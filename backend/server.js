import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { promisify } from "node:util";
import pg from "pg";
import { validState } from "./state.js";

const pool = new pg.Pool({ connectionTimeoutMillis: 5000, statement_timeout: 5000 });
pool.on("error", (error) => console.error("PostgreSQL connection error", error.code));
const derive = promisify(scrypt);
const cookieName = "ily_session";
const week = 7 * 24 * 60 * 60;
const secure = process.env.SESSION_SECURE === "true";
const digest = (token) => createHash("sha256").update(token).digest("hex");
const sessionToken = () => randomBytes(32).toString("hex");
let authInFlight = 0;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function passwordKey(password, salt) {
  return derive(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
}

async function readJSON(req) {
  if (req.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError(415, "Send JSON.");
  }
  const origin = req.headers.origin;
  if (req.headers["sec-fetch-site"] === "cross-site" || (origin &&
      origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`)) {
    throw new RequestError(403, "This request must come from ILY.");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 16384) throw new RequestError(413, "Request is too large.");
    chunks.push(chunk);
  }
  let data;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400, "Invalid JSON.");
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new RequestError(400, "Send a JSON object.");
  }
  return data;
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function setCookie(res, token) {
  res.setHeader("Set-Cookie", `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? week : 0}${secure ? "; Secure" : ""}`);
}

function getToken(req) {
  const cookie = req.headers.cookie?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  const token = cookie?.slice(cookieName.length + 1);
  return token && /^[0-9a-f]{64}$/.test(token) ? digest(token) : null;
}

async function authenticate(req, res, signup) {
  const { email: input, password, state } = await readJSON(req);
  const email = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < (signup ? 8 : 1) || password.length > 128) {
    throw new RequestError(400, "Enter a valid email and password.");
  }
  if (signup && !validState(state)) throw new RequestError(400, "Invalid lesson progress.");
  if (authInFlight >= 4) throw new RequestError(429, "Too many attempts. Try again shortly.");

  authInFlight++;
  try {
    const token = sessionToken();
    const previous = getToken(req);
    let account;
    if (signup) {
      const salt = randomBytes(16).toString("hex");
      const passwordHash = `${salt}:${(await passwordKey(password, salt)).toString("hex")}`;
      const result = await pool.query(`
        WITH new_account AS (
          INSERT INTO accounts (email, password_hash, state) VALUES ($1, $2, $3)
          ON CONFLICT (email) DO NOTHING RETURNING id, email, state, revision
        ), new_session AS (
          INSERT INTO sessions (token_hash, account_id) SELECT $4, id FROM new_account
        ), old_session AS (
          DELETE FROM sessions WHERE token_hash = $5 AND EXISTS (SELECT 1 FROM new_account)
        )
        SELECT email, state, revision FROM new_account
      `, [email, passwordHash, state, digest(token), previous]);
      account = result.rows[0];
      if (!account) throw new RequestError(409, "An account already exists for this email.");
    } else {
      const result = await pool.query(
        "SELECT id, email, password_hash, state, revision FROM accounts WHERE email = $1", [email],
      );
      const row = result.rows[0];
      const [salt, hash] = row?.password_hash.split(":") ?? ["0".repeat(32), "0".repeat(128)];
      const matches = timingSafeEqual(await passwordKey(password, salt), Buffer.from(hash, "hex"));
      if (!row || !matches) throw new RequestError(401, "Email or password is incorrect.");
      await pool.query(`
        WITH old_session AS (DELETE FROM sessions WHERE token_hash = $3)
        INSERT INTO sessions (token_hash, account_id) VALUES ($1, $2)
      `, [digest(token), row.id, previous]);
      account = { email: row.email, state: row.state, revision: row.revision };
    }
    setCookie(res, token);
    json(res, signup ? 201 : 200, account);
  } finally {
    authInFlight--;
  }
}

async function handle(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const path = req.url.split("?")[0];
  if (req.method === "GET" && path === "/api/health") {
    await pool.query("SELECT 1");
    return json(res, 200, { status: "ok" });
  }
  if (req.method === "POST" && (path === "/api/signup" || path === "/api/login")) {
    return authenticate(req, res, path === "/api/signup");
  }
  const token = getToken(req);
  if (req.method === "POST" && path === "/api/logout") {
    await readJSON(req);
    if (token) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [token]);
    setCookie(res, "");
    res.writeHead(204).end();
    return;
  }
  if (path !== "/api/account" || !["GET", "PUT"].includes(req.method)) {
    throw new RequestError(404, "Not found.");
  }
  const { rows: [account] } = await pool.query(`
    SELECT a.id, a.email, a.state, a.revision
    FROM sessions s JOIN accounts a ON a.id = s.account_id
    WHERE s.token_hash = $1 AND s.expires_at > now()
  `, [token]);
  if (!account) throw new RequestError(401, "Log in to continue.");
  if (req.method === "GET") {
    return json(res, 200, { email: account.email, state: account.state, revision: account.revision });
  }
  const { state, revision } = await readJSON(req);
  if (!Number.isSafeInteger(revision) || revision < 0 || revision >= 2147483647 || !validState(state)) {
    throw new RequestError(400, "Invalid lesson progress.");
  }
  const result = await pool.query(`
    UPDATE accounts SET state = $2, revision = revision + 1
    WHERE id = $1 AND revision = $3
      AND EXISTS (SELECT 1 FROM sessions WHERE token_hash = $4 AND expires_at > now())
    RETURNING revision
  `, [account.id, state, revision, token]);
  if (!result.rowCount) throw new RequestError(409, "Progress changed on another device. Reload to continue.");
  json(res, 200, result.rows[0]);
}

await pool.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
const pruneSessions = () => pool.query("DELETE FROM sessions WHERE expires_at <= now()")
  .catch((error) => console.error("Session cleanup failed", error.code));
await pruneSessions();
const cleanup = setInterval(pruneSessions, 60 * 60 * 1000);
cleanup.unref();

const server = createServer({ requestTimeout: 15000, headersTimeout: 10000 }, (req, res) => {
  handle(req, res).catch((error) => {
    if (error instanceof RequestError) return json(res, error.status, { error: error.message });
    console.error("API request failed", req.method, error.code ?? error.name);
    json(res, 500, { error: "Something went wrong. Try again." });
  });
});
server.listen(3000, "0.0.0.0", () => console.info("ILY API listening on port 3000"));

process.once("SIGTERM", () => {
  clearInterval(cleanup);
  server.close(() => pool.end());
});
