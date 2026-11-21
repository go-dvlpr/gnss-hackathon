import { useEffect, useRef, useState } from "react";
import { Actions, BackHeader, Check, LessonProgress, Media } from "../components";
import { go } from "../router";
import { howTo, isWord, labelOf, useLesson } from "../lesson";
import { attempt, snapshot, watch, type Reading } from "../recognizer";

// HACK: one try lasts this long; no success by then sends you to the coach.
const TRY_MS = 8000;

type Phase = "idle" | 3 | 2 | 1 | "checking" | "done";

export default function CheckScreen() {
  const { item = "L", isFinale, isLast, pass, next, skip } = useLesson();
  const [earned, setEarned] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const cam = useRef<ReturnType<typeof watch> | null>(null);
  const tryLog = useRef({ sawHand: false, hint: null as string | null, looks: null as string | null });
  const after = isLast ? "done" : "watch";

  useEffect(() => {
    const c = watch(video.current!, overlay.current!, item, setReading);
    cam.current = c;
    c.ready.catch((e: Error) =>
      setError(
        e.name === "NotAllowedError" || e.name === "SecurityError"
          ? "Camera access is blocked. Allow it in the address bar and reload."
          : `The camera or the hand model didn't start: ${e.message}`,
      ),
    );
    return c.stop;
  }, [item]);

  // Countdown, then one try.
  useEffect(() => {
    if (typeof phase === "number") {
      const t = setTimeout(() => {
        if (phase > 1) return setPhase((phase - 1) as 2 | 1);
        cam.current?.reset();
        tryLog.current = { sawHand: false, hint: null, looks: null };
        setPhase("checking");
      }, 1000);
      return () => clearTimeout(t);
    }
    if (phase !== "checking") return;
    const t = setTimeout(() => {
      if (!tryLog.current.sawHand) {
        // Low confidence: ask again, the try doesn't count.
        setNotice("We didn't see your hand. Show it again.");
        setPhase("idle");
        return;
      }
      attempt.hint = tryLog.current.hint;
      attempt.looks = tryLog.current.looks;
      attempt.image = snapshot(video.current!, overlay.current!);
      go("coach");
    }, TRY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "checking" || !reading) return;
    const log = tryLog.current;
    if (reading.hand) log.sawHand = true;
    if (reading.hint && !reading.good) log.hint = reading.hint;
    if (reading.looks) log.looks = reading.looks;
    if (reading.ok) {
      setEarned(pass());
      setPhase("done");
    }
  }, [reading, phase, pass]);

  const prompt =
    error ??
    (typeof phase === "number"
      ? String(phase)
      : phase === "checking"
        ? (reading?.hint ?? "Show the sign")
        : phase === "done"
          ? "Got it!"
          : !reading
            ? "Starting the camera and the hand model…"
            : (notice ?? "Ready. After 3, 2, 1, show the sign and hold it."));

  return (
    <>
      <BackHeader />
      <LessonProgress step={3} label="sign it" back={isFinale ? "watch" : "quiz"} />
      <main className="main check">
        <section aria-label="Your camera" className="camera">
          <div className="camera-stage">
            <video ref={video} className="camera-feed camera-mirror" muted playsInline aria-label="Your webcam, mirrored" />
            <canvas ref={overlay} aria-hidden="true" className="camera-feed camera-mirror" />
            <div aria-hidden="true" className="corner corner--tl" />
            <div aria-hidden="true" className="corner corner--tr" />
            <div aria-hidden="true" className="corner corner--bl" />
            <div aria-hidden="true" className="corner corner--br" />
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
            {phase === "checking" && (
              <div aria-hidden="true" className="camera-meter">
                <div style={{ width: `${Math.round((reading?.progress ?? 0) * 100)}%` }} />
              </div>
            )}
            <p
              aria-live="polite"
              className={typeof phase === "number" ? "camera-prompt camera-prompt--count" : "camera-prompt"}
            >
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
            <button
              type="button"
              className="btn-primary"
              disabled={!reading || phase !== "idle"}
              onClick={() => {
                setNotice(null);
                setPhase(3);
              }}
            >
              <span aria-hidden="true" className="rec-dot" />
              Start 3, 2, 1
            </button>
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
