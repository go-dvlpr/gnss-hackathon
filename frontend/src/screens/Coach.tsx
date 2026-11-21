import { Actions, BackHeader, LessonProgress, Stage } from "../components";
import { go, href } from "../router";
import { useLesson } from "../lesson";

export default function Coach() {
  const { retry } = useLesson();
  return (
    <>
      <BackHeader />
      <LessonProgress step={3} label="try again" back="check" />
      <main className="main coach">
        <div className="coach-head">
          <h1 tabIndex={-1} className="display h-48">Almost. Fix one thing.</h1>
          {/* HACK: static mock hint for L; the coach API fills this in later. */}
          <p className="coach-hint">
            <b>Coach:</b> Your thumb is tucked in. Stick it straight out to the side, so your thumb and index finger make
            an L.
          </p>
        </div>
        <div className="compare">
          <figure>
            <Stage label="Your attempt, key frame" text="[your attempt, key frame]" className="stage--16x9" />
            <figcaption>
              <b>You</b>
            </figcaption>
          </figure>
          <figure>
            <Stage label="Reference photo" text="[reference photo]" className="stage--16x9" />
            <figcaption>
              <b>Reference</b>
            </figcaption>
          </figure>
        </div>
        <p className="small muted">
          If the camera isn't sure, we say "Show it again" instead of guessing, and the try doesn't count.
        </p>
      </main>
      <Actions>
        <a href={href("watch")} className="btn-text">
          Watch it again
        </a>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            retry();
            go("check");
          }}
        >
          Try again
        </button>
      </Actions>
    </>
  );
}
