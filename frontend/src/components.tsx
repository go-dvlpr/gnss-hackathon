import { useEffect, useRef, useState, type ReactNode } from "react";
import { href, type Route } from "./router";
import { labelOf, useLesson } from "./lesson";

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

/** ILY handshape mark: solid white on an Ink tile (see DESIGN.md › Decisions). */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 128 128" className="logo-mark">
      <rect width="128" height="128" rx="30" fill="var(--ink)" />
      {/* assets/icons/ily-mark.svg geometry, filled solid white. */}
      <g transform="translate(22 14) scale(0.66)">
        <g stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" fill="none">
          <line x1="46" y1="80" x2="44" y2="18" />
          <line x1="96" y1="84" x2="99" y2="36" />
          <line x1="42" y1="106" x2="12" y2="76" />
          <line x1="62" y1="77" x2="62" y2="75" />
          <line x1="79" y1="78" x2="79" y2="76" />
        </g>
        <rect x="34" y="70" width="72" height="68" rx="22" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

export const Logo = () => (
  <span className="logo" aria-label="ILY">
    <LogoMark />
    <span className="logo-word" aria-hidden="true">ILY</span>
  </span>
);
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

export function BackLink({ to }: { to: Route }) {
  return (
    <a href={href(to)} className="back" aria-label="Back">
      <ArrowLeft />
      <span className="back-label">Back</span>
    </a>
  );
}

/** Lesson screens pass no `back`: their Back lives in the progress strip. */
export function BackHeader({ back, help = true }: { back?: Route; help?: boolean }) {
  return (
    <header className="topbar">
      <div className="wrap">
        {back && <BackLink to={back} />}
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

export function LessonProgress({ step, label, back }: { step: 1 | 2 | 3; label: string; back: Route }) {
  const { lesson, name, queue, pos } = useLesson();
  return (
    <nav aria-label="Lesson progress" className="progress">
      <div className="wrap">
        <BackLink to={back} />
        <b>{lesson === 2 ? "Lesson 2: words" : `Lesson 1: ${name}`}</b>
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
                {labelOf(l)}
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

/**
 * Reference for a letter (image) or a word (video), from public/media/. Shows the placeholder
 * until the file exists: letters/{L}.svg, signs/{ID}.mp4 (ID as in asl-core, e.g. THANKYOU, ILY).
 */
export function Media({
  item,
  label,
  className = "",
  paused = false,
  rate = 1,
  mirror = false,
}: {
  item: string;
  label: string;
  className?: string;
  paused?: boolean;
  rate?: number;
  mirror?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const isLetter = item.length === 1;
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.playbackRate = rate;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, rate]);
  if (broken) return <Stage label={label} text={isLetter ? "[photo of the handshape]" : `[video of ${item}]`} className={className} />;
  const style = mirror ? { transform: "scaleX(-1)" } : undefined;
  return (
    <div className={`stage stage--media ${className}`}>
      {isLetter ? (
        <img src={`/media/letters/${item}.svg`} alt={label} style={style} onError={() => setBroken(true)} />
      ) : (
        <video
          ref={video}
          src={`/media/signs/${item}.mp4`}
          aria-label={label}
          style={style}
          muted
          loop
          autoPlay
          playsInline
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}
