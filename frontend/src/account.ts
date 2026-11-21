import { useEffect, useRef, useState } from "react";
import { clearLegacyProgress, initialState, legacyProgress, type AccountState } from "./progress";

export type AuthMode = "signup" | "login";

type Account = {
  email: string;
  state: AccountState;
  revision: number;
};

class APIError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function api<T>(path: string, method = "GET", body?: object): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: body && { "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    const fallback = response.status === 429 ? "Too many attempts. Try again shortly." : "Couldn't reach ILY. Try again.";
    throw new APIError(response.status, data?.error || fallback);
  }
  return data as T;
}

export function useAccount() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ message: string; reload: boolean }>();
  const saved = useRef<{ state: AccountState; revision: number }>();

  function hydrate(account: Account) {
    saved.current = { state: account.state, revision: account.revision };
    setState(account.state);
    setEmail(account.email);
  }

  useEffect(() => {
    let current = true;
    api<Account>("account").then((account) => {
      if (current) hydrate(account);
    }).catch((error: unknown) => {
      if (current && !(error instanceof APIError && error.status === 401)) setLoadError(true);
    }).finally(() => {
      if (current) setReady(true);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    const previous = saved.current;
    if (!email || !previous || state === previous.state || saving || saveError) return;
    setSaving(true);
    api<{ revision: number }>("account", "PUT", { state, revision: previous.revision })
      .then(({ revision }) => { saved.current = { state, revision }; })
      .catch((error: unknown) => {
        setSaveError({
          message: error instanceof APIError ? error.message : "Couldn't save progress. Check your connection.",
          reload: error instanceof APIError && (error.status === 401 || error.status === 409),
        });
      }).finally(() => setSaving(false));
  }, [email, state, saving, saveError]);

  async function authenticate(mode: AuthMode, email: string, password: string) {
    const signup = mode === "signup";
    const account = await api<Account>(mode, "POST", {
      email,
      password,
      ...(signup && { state: { profile: state.profile, progress: legacyProgress() } }),
    });
    hydrate(account);
    if (signup) clearLegacyProgress();
    const { active, lessons } = account.state.progress;
    return active === 2 || lessons[1].pos > 0 || Object.keys(lessons[1].stars).length > 0;
  }

  async function logout() {
    await api("logout", "POST", {});
    saved.current = undefined;
    setSaveError(undefined);
    setState(initialState());
    setEmail("");
  }

  return {
    email, state, setState, ready, loadError, authenticate, logout, saveError,
    dirty: Boolean(email && state !== saved.current?.state),
    retrySave: () => setSaveError(undefined),
  };
}
