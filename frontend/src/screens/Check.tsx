import { useState } from "react";
import { Actions, BackHeader, Check, LessonProgress, Stage } from "../components";
import { go } from "../router";
import { howTo, useLesson } from "../lesson";

export default function CheckScreen() {
  const { item = "L", isFinale, isLast, pos, tries, pass, next, skip } = useLesson();
  const [earned, setEarned] = useState<number | null>(null);
  const after = isLast ? "done" : "watch";

  const start = () => {
    // HACK: mock verdict until webcam + MediaPipe + classifier exist. The first letter of the
    // lesson fails on try 1 so the demo shows the coach; every other try is right.
    if (pos === 0 && tries === 1) {
      go("coach");
      return;
    }
    setEarned(pass());
  };

  return (
    <>
      <BackHeader />
      <LessonProgress step={3} label="sign it" back={isFinale ? "watch" : "quiz"} />
      <main className="main check">
        <section aria-label="Your camera" className="camera">
          <div className="camera-stage">
            {/* HACK: webcam + MediaPipe go here. */}
            <div role="img" aria-label="Your webcam, mirrored" className="camera-feed">
              [webcam, mirrored]
            </div>
            <div aria-hidden="true" className="corner corner--tl" />
            <div aria-hidden="true" className="corner corner--tr" />
            <div aria-hidden="true" className="corner corner--bl" />
            <div aria-hidden="true" className="corner corner--br" />
            {/* HACK: mock camera status from the design; nothing is detected yet. */}
            <div className="camera-status">
              <span>
                <Check />
                Hand in the frame
              </span>
              <span>
                <Check />
                Enough light
              </span>
            </div>
            <p className="camera-prompt">Ready. After 3, 2, 1, hold the sign for a second and a half.</p>
          </div>
          <p className="tiny muted">Recognition runs in your browser. Video never leaves your computer.</p>
        </section>

        <aside className="check-side">
          <div className="check-title">
            <h1 tabIndex={-1}>
              {isFinale ? "Now sign them together" : "Sign"}
              <span className={isFinale ? "big-letter big-letter--word" : "big-letter"}>{item}</span>
            </h1>
          </div>
          {/* HACK: placeholder until the handshape photos are added. */}
          <Stage label="Reference photo of the handshape" text="[reference photo]" className="stage--4x3 stage--sm" />
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
            <button type="button" className="btn-primary" onClick={start}>
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
              {isLast ? "Finish lesson" : "Next letter"}
            </button>
          </>
        )}
      </Actions>
    </>
  );
}
