import { Actions, BackHeader, Check, LessonProgress, Stage } from "../components";
import { href } from "../router";
import { useLesson } from "../lesson";

export default function CheckScreen() {
  const { letters } = useLesson();
  const letter = letters[0] ?? "L";
  return (
    <>
      <BackHeader back="quiz" />
      <LessonProgress label="Step 3 of 3: sign it" />
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
            <div role="status" className="camera-status">
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
            <h1>Sign</h1>
            <span className="big-letter">{letter}</span>
          </div>
          <Stage label="Reference of the sign, looping" text="[reference, looping]" className="stage--4x3 stage--sm" />
          <p className="body-17">[How to make the sign, same text as on the watch screen.]</p>
        </aside>
      </main>
      <Actions split>
        <button className="btn-text">Skip this letter</button>
        <a href={href("coach")} className="btn-primary">
          <span aria-hidden="true" className="rec-dot" />
          Start 3, 2, 1
        </a>
      </Actions>
    </>
  );
}
