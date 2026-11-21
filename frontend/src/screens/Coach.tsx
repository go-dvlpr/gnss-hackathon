import { Actions, BackHeader, LessonProgress, Stage } from "../components";
import { href } from "../router";

export default function Coach() {
  return (
    <>
      <BackHeader back="check" />
      <LessonProgress label="Try 2" />
      <main className="main coach">
        <div className="coach-head">
          <h1 className="display h-48">Almost. Fix one thing.</h1>
          {/* HACK: mock hint; the coach API fills this in. */}
          <p className="coach-hint">
            <b>Coach:</b> [what to fix, in one sentence, e.g. stick your thumb straight out to the side, so your thumb
            and index finger make an L.]
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
            <Stage label="Reference, same moment" text="[reference, same moment]" className="stage--16x9" />
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
        {/* HACK: design jumps straight to "Lesson done"; should go back to the camera check. */}
        <a href={href("done")} className="btn-primary">
          Try again
        </a>
      </Actions>
    </>
  );
}
