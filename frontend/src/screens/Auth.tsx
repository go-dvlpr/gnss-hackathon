import { useState, type FormEvent } from "react";
import { Actions, BackHeader } from "../components";
import { go, href } from "../router";
import { track, useFunnel } from "../funnel";

import type { AuthMode } from "../account";
type Errors = { email?: string; password?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(mode: AuthMode, email: string, password: string): Errors {
  const errors: Errors = {};
  if (!EMAIL.test(email.trim())) errors.email = "Enter an email like name@example.com.";
  if (mode === "signup" && password.length < 8) errors.password = "Use at least 8 characters.";
  if (mode === "login" && !password) errors.password = "Enter your password.";
  return errors;
}

function Auth({ mode }: { mode: AuthMode }) {
  const { authenticate } = useFunnel();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = validate(mode, email, password);
    setErrors(found);
    setSubmitError("");
    if (found.email || found.password) return;
    setBusy(true);
    try {
      const hasProgress = await authenticate(mode, email, password);
      track(signup ? "signup_completed" : "login_completed", { method: "email" });
      go(signup && !hasProgress ? "name" : "lessons");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Couldn't sign in. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BackHeader back="welcome" help={false} />
      <main className="main funnel">
        <div className="funnel-head">
          <h1 tabIndex={-1} className="display h-48 balance">{signup ? "Save your plan" : "Welcome back"}</h1>
          <p className="lead muted">
            {signup ? "Create an account to keep your plan, progress and stars on any device." : "Pick up where you left off."}
          </p>
        </div>

        <form id="auth-form" className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="field field--compact">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <span id="email-error" className="field-error">
                {errors.email}
              </span>
            )}
          </div>
          <div className="field field--compact">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              maxLength={128}
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "password-error" : "password-hint"}
            />
            {errors.password ? (
              <span id="password-error" className="field-error">
                {errors.password}
              </span>
            ) : (
              signup && (
                <span id="password-hint" className="tiny muted">
                  At least 8 characters.
                </span>
              )
            )}
          </div>
          {submitError && <p role="alert" className="field-error">{submitError}</p>}
        </form>

        <p className="small muted">
          {signup ? (
            <>
              Already have an account? <a href={href("login")}>Log in</a>
            </>
          ) : (
            <>
              New to ILY? <a href={href("signup")}>Create an account</a>
            </>
          )}
        </p>
        {signup && (
          // HACK: Terms and Privacy pages do not exist yet.
          <p className="tiny muted">By continuing you agree to the Terms and the Privacy Policy.</p>
        )}
      </main>
      <Actions>
        <button type="submit" form="auth-form" className="btn-primary btn-primary--wide" disabled={busy}>
          {busy ? (signup ? "Creating account…" : "Logging in…") : signup ? "Create account" : "Log in"}
        </button>
      </Actions>
    </>
  );
}

export const Signup = () => <Auth mode="signup" />;
export const Login = () => <Auth mode="login" />;
