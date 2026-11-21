import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

const base = process.env.ILY_TEST_URL;
const lesson = (queue) => ({
  queue, pos: 0, tries: 1, hinted: false, missedAt: null, missed: [], stars: {}, completed: false,
});

async function request(path, { method = "GET", body, cookie, origin } = {}) {
  return fetch(new URL(`/api/${path}`, base), {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(cookie && { Cookie: cookie }),
      ...(origin && { Origin: origin }),
    },
    body: body && JSON.stringify(body),
  });
}

test("account sessions and per-lesson progress through Compose", { skip: !base }, async () => {
  assert.equal((await request("health")).status, 200);
  assert.equal((await request("account")).status, 401);

  const credentials = { email: `test-${randomUUID()}@example.test`, password: randomUUID() };
  const state = {
    profile: { reason: "loved", who: "other", name: "Jane", level: "none", goal: "5", source: "other" },
    progress: {
      active: 1,
      name: "Lily",
      lessons: { 1: lesson(["L", "I", "Y", "ILY"]), 2: lesson(["HELLO", "YES", "NO", "THANKYOU", "ILY"]) },
    },
  };
  const initial = structuredClone(state);
  const register = (email = credentials.email) => request("signup", {
    method: "POST", body: { ...credentials, email, state: initial },
  });
  const registered = await register(credentials.email.toUpperCase());
  assert.equal(registered.status, 201);
  const header = registered.headers.get("set-cookie");
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Lax/);
  const cookie = header.split(";")[0];
  assert.deepEqual(await registered.json(), { email: credentials.email, state, revision: 0 });
  assert.equal((await register()).status, 409);

  const put = (body, options = {}) => request("account", { method: "PUT", cookie, body, ...options });
  assert.equal((await put({ state, revision: 0 }, { origin: "https://example.test" })).status, 403);
  const invalid = structuredClone(state);
  invalid.progress.lessons[1].pos = 999;
  assert.equal((await put({ state: invalid, revision: 0 })).status, 400);

  const invalidName = { ...state, profile: { ...state.profile, name: "A".repeat(81) } };
  assert.equal((await put({ state: invalidName, revision: 0 })).status, 400);

  Object.assign(state.progress.lessons[1], { pos: 4, completed: true, stars: { L: 2, I: 1, Y: 2, ILY: 2 } });
  Object.assign(state.progress.lessons[2], { pos: 1, missed: ["HELLO"] });
  state.progress.active = 2;
  const writes = await Promise.all([put({ state, revision: 0 }), put({ state, revision: 0 })]);
  assert.deepEqual(writes.map((response) => response.status).sort(), [200, 409]);
  assert.deepEqual(await (await request("account", { cookie })).json(), {
    email: credentials.email, state, revision: 1,
  });

  const other = await register(`test-${randomUUID()}@example.test`);
  assert.equal(other.status, 201);
  const otherCookie = other.headers.get("set-cookie").split(";")[0];
  const otherAccount = await (await request("account", { cookie: otherCookie })).json();
  assert.equal(otherAccount.revision, 0);
  assert.equal(otherAccount.state.progress.lessons[1].completed, false);

  assert.equal((await request("logout", { method: "POST", cookie, body: {} })).status, 204);
  assert.equal((await request("account", { cookie })).status, 401);
  const login = (password) => request("login", { method: "POST", body: { ...credentials, password } });
  assert.equal((await login("wrong-password")).status, 401);
  const loggedIn = await login(credentials.password);
  assert.equal(loggedIn.status, 200);
  assert.deepEqual(await loggedIn.json(), { email: credentials.email, state, revision: 1 });
});
