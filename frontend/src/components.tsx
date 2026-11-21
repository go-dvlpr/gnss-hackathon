import type { ReactNode } from "react";
import { href, type Route } from "./router";
import { useLesson } from "./lesson";

export function ArrowLeft() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export function Check({ color = "#7FE0B0", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const Logo = () => <span className="logo">ILY</span>;
/** A control whose screen isn't built yet: shown, but not interactive. */
export function ComingSoon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span aria-disabled="true" title="Coming soon" className={`is-soon ${className}`}>
      {children}
    </span>
  );
}

// HACK: "How checking works" page is not designed yet.
const HelpLink = () => <ComingSoon className="help-link">How checking works</ComingSoon>;

export function HomeHeader() {
  return (
    <header className="topbar topbar--home">
      <div className="wrap">
        <Logo />
        <nav aria-label="Main" className="nav">
          <a href={href("lessons")} aria-current="page">Lessons</a>
          {/* HACK: Review screen is not designed yet. */}
          <ComingSoon className="nav-soon">Review</ComingSoon>
        </nav>
        <HelpLink />
      </div>
    </header>
  );
}

export function BackHeader({ back, help = true }: { back: Route; help?: boolean }) {
  return (
    <header className="topbar">
      <div className="wrap">
        <a href={href(back)} className="back">
          <ArrowLeft />
          Back
        </a>
        <Logo />
        {help && (
          <>
            <span className="spacer" />
            <HelpLink />
          </>
        )}
      </div>
    </header>
  );
}

export function LessonProgress({ step, label }: { step: 1 | 2 | 3; label: string }) {
  const { name, queue, pos } = useLesson();
  return (
    <nav aria-label="Lesson progress" className="progress">
      <div className="wrap">
        <b>Lesson 1: {name}</b>
        <ol className="steps">
          {queue.map((l, i) => {
            const done = i < pos;
            return (
              <li
                key={i}
                aria-current={i === pos ? "step" : undefined}
                className={[done ? "is-done" : "", l.length > 1 ? "is-word" : ""].join(" ").trim() || undefined}
              >
                {done && <Check color="currentColor" size={12} />}
                {l}
                {done && <span className="sr-only"> done</span>}
              </li>
            );
          })}
        </ol>
        <span className="spacer" />
        <span className="progress-label">
          Step {step} of 3: {label}
        </span>
      </div>
    </nav>
  );
}

export function Actions({ children, split = false }: { children: ReactNode; split?: boolean }) {
  return (
    <footer className={split ? "actions actions--split" : "actions"}>
      <div className="wrap">{children}</div>
    </footer>
  );
}

/** Dark placeholder for video, webcam or image slots. */
export function Stage({ label, text, className = "" }: { label: string; text: string; className?: string }) {
  return (
    <div role="img" aria-label={label} className={`stage ${className}`}>
      {text}
    </div>
  );
}
