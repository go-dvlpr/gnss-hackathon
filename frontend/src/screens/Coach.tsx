import { Actions, BackHeader, LessonProgress, Media, Stage } from "../components";
import { go, href } from "../router";
import { labelOf, useLesson } from "../lesson";
import { attempt } from "../recognizer";

export default function Coach() {
  const { item = "L", retry } = useLesson();
  return (
    <>
      <BackHeader />
      <LessonProgress step={2} label="try again" back="check" />
      <main className="main coach">
        <div className="coach-head">
          <h1 tabIndex={-1} className="display h-48">Almost. Fix one thing.</h1>
          {/* The hint comes from the rule that failed; HACK: the LLM does not rephrase it yet. */}
          <p className="coach-hint">
            <b>Coach:</b> {attempt.hint ?? "Watch the reference once more and copy the handshape."}
            {attempt.looks && ` To the camera it looked more like ${labelOf(attempt.looks)}.`}
          </p>
        </div>
        <div className="compare">
          <figure>
            {attempt.image ? (
              <img src={attempt.image} alt="Your attempt, last frame" className="stage stage--media stage--16x9" />
            ) : (
              <Stage label="Your attempt, key frame" text="[your attempt, key frame]" className="stage--16x9" />
            )}
            <figcaption>
              <b>You</b>
            </figcaption>
          </figure>
          <figure>
            <Media item={item} label={`Reference of ${labelOf(item)}`} className="stage--16x9" />
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
