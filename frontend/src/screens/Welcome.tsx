import { useEffect } from "react";
import { Actions, Logo, Stage } from "../components";
import { href } from "../router";
import { track } from "../funnel";

const STEPS = [
  "Tell us who you're learning for. Lesson 1 is their name.",
  "Watch each letter, then pick it out in a quick quiz.",
  "Sign it to your webcam. The coach says exactly what to fix.",
];

export default function Welcome() {
  useEffect(() => track("welcome_viewed"), []);
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Logo />
          <span className="spacer" />
          <a href={href("login")} className="topbar-link">
            Log in
          </a>
        </div>
      </header>
      <main className="main name-screen">
        <section className="name-intro">
          <h1 tabIndex={-1} className="display h-64 balance">Learn to sign to the one you love</h1>
          <p className="lead muted">
            A sign language practice game for hearing people with a Deaf partner, child or parent. Your webcam checks every
            sign.
          </p>
          <ol className="how-list">
            {STEPS.map((s, i) => (
              <li key={i}>
                <span className="how-num">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>
        <section aria-label="How it looks" className="name-preview">
          <Stage label="Demo clip" text="[demo clip: a hand signs I love you]" className="stage--4x3" />
          <p className="small muted">Recognition runs in your browser. Video never leaves your computer.</p>
        </section>
      </main>
      <Actions split>
        <a href={href("login")} className="btn-text">
          I already have an account
        </a>
        <a href={href("onboarding")} className="btn-primary btn-primary--wide">
          Get started
        </a>
      </Actions>
    </>
  );
}
