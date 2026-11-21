import { useEffect, useRef, useState } from "react";
import { Actions, BackHeader, Check, LessonProgress, Media } from "../components";
import { go } from "../router";
import { howTo, isWord, labelOf, useLesson } from "../lesson";
import { attempt, snapshot, watch, type Reading } from "../recognizer";

// HACK: a try starts when the camera first sees a hand and lasts this long; no success by then
// sends you to the coach.
const TRY_MS = 8000;

export default function CheckScreen() {
  const { item = "L", isFinale, isLast, pass, next, skip } = useLesson();
  const [earned, setEarned] = useState<number | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tryStarted, setTryStarted] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const tryLog = useRef({ hint: null as string | null, looks: null as string | null });
  // The quiz round comes after the last sign.
  const after = isLast ? "quiz" : "watch";

  useEffect(() => {
    const c = watch(video.current!, overlay.current!, item, setReading);
    c.ready.catch((e: Error) =>
      setError(
        e.name === "NotAllowedError" || e.name === "SecurityError"
          ? "Camera access is blocked. Allow it in the address bar and reload."
          : `The camera or the hand model didn't start: ${e.message}`,
      ),
    );
    return c.stop;
  }, [item]);

  useEffect(() => {
    if (!tryStarted || earned !== null) return;
    const t = setTimeout(() => {
      attempt.hint = tryLog.current.hint;
      attempt.looks = tryLog.current.looks;
      attempt.image = snapshot(video.current!, overlay.current!);
      go("coach");
    }, TRY_MS);
    return () => clearTimeout(t);
  }, [tryStarted, earned]);

  useEffect(() => {
    if (earned !== null || !reading) return;
    if (reading.hand && !tryStarted) setTryStarted(true);
    if (reading.hint && !reading.good) tryLog.current.hint = reading.hint;
    if (reading.looks) tryLog.current.looks = reading.looks;
    if (reading.ok) setEarned(pass());
  }, [reading, earned, tryStarted, pass]);

  const prompt =
    error ??
    (earned !== null
      ? "Got it!"
      : !reading
        ? "Starting the camera and the hand model…"
        : (reading.hint ?? "Show the sign and hold it."));

  return (
    <>
      <BackHeader />
      <LessonProgress step={2} label="sign it" back="watch" />
      <main className="main check">
        <section aria-label="Your camera" className="camera">
          <div className="camera-stage">
            <video ref={video} className="camera-feed camera-mirror" muted playsInline aria-label="Your webcam, mirrored" />
            <canvas ref={overlay} aria-hidden="true" className="camera-feed camera-mirror" />
            {reading && (
              <div className="camera-status">
                <span>
                  {reading.hand && <Check />}
                  {reading.hand ? "Hand in the frame" : "No hand yet"}
                </span>
                {isWord(item) && (
                  <span>
                    {reading.face && <Check />}
                    {reading.face ? "Face in the frame" : "Show your face"}
                  </span>
                )}
              </div>
            )}
            {reading && earned === null && (
              <div aria-hidden="true" className="camera-meter">
                <div style={{ width: `${Math.round((reading?.progress ?? 0) * 100)}%` }} />
              </div>
            )}
            <p aria-live="polite" className="camera-prompt">
              {prompt}
            </p>
          </div>
          <p className="tiny muted">Recognition runs in your browser. Video never leaves your computer.</p>
        </section>

        <aside className="check-side">
          <div className="check-title">
            <h1 tabIndex={-1}>
              {isFinale ? "Now sign them together" : "Sign"}
              <span className={isWord(item) ? "big-letter big-letter--word" : "big-letter"}>{labelOf(item)}</span>
            </h1>
          </div>
          <Media item={item} label="Reference of the sign, looping" className="stage--4x3 stage--sm" />
          <p className="body-17">{isFinale ? `I love you. ${howTo(item, true)}` : howTo(item, true)}</p>
          <div role="status" className="verdict-slot">
            {earned !== null && (
              <p className="verdict verdict--ok">
                <Check color="currentColor" size={22} />
                <span>Got it</span>
                <span aria-hidden="true" className="stars">
                  {"★".repeat(earned)}
                </span>
                <span className="sr-only">
                  , {earned} star{earned > 1 ? "s" : ""}
                </span>
              </p>
            )}
          </div>
        </aside>
      </main>
      <Actions split>
        {earned === null ? (
          <>
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                skip();
                go(after);
              }}
            >
              Skip for now
            </button>
            <span />
          </>
        ) : (
          <>
            <span />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                next();
                go(after);
              }}
            >
              {isLast ? "Finish lesson" : isWord(item) ? "Next word" : "Next letter"}
            </button>
          </>
        )}
      </Actions>
    </>
  );
}
