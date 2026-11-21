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
const HelpLink = () => (
  // HACK: "How checking works" page is not designed yet.
  <a href="#" className="help-link" onClick={(e) => e.preventDefault()}>
    How checking works
  </a>
);

export function HomeHeader() {
  return (
    <header className="topbar topbar--home">
      <div className="wrap">
        <Logo />
        <nav aria-label="Main" className="nav">
          <a href={href("lessons")} aria-current="page">Lessons</a>
          {/* HACK: Review screen is not designed yet. */}
          <a href="#" onClick={(e) => e.preventDefault()}>Review</a>
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

export function LessonProgress({ current = 0, label }: { current?: number; label: string }) {
  const { name, letters } = useLesson();
  return (
    <div aria-label="Lesson progress" className="progress">
      <div className="wrap">
        <b>Lesson 1: {name}</b>
        <ol className="steps">
          {letters.map((l, i) => (
            <li key={i} aria-current={i === current ? "step" : undefined}>
              {l}
            </li>
          ))}
        </ol>
        <span className="spacer" />
        <span className="progress-label">{label}</span>
      </div>
    </div>
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
