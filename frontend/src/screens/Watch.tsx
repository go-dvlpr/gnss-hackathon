import { useState } from "react";
import { Actions, BackHeader, LessonProgress, Stage } from "../components";
import { href } from "../router";
import { howTo, useLesson } from "../lesson";

export default function Watch() {
  const { item = "L", isFinale } = useLesson();
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(true);
  const [mirror, setMirror] = useState(false);
  return (
    <>
      <BackHeader back="name" />
      <LessonProgress step={1} label="watch" />
      <main className="main watch">
        <section aria-label="Reference" className="watch-media">
          {/* HACK: placeholder until reference clips are recorded. */}
          <Stage
            label="Reference video of the sign"
            text="[reference video of the sign, looping]"
            className="stage--16x10"
          />
          <div className="controls">
            <button className="btn-secondary" onClick={() => setPaused((p) => !p)}>
              {paused ? "Play" : "Pause"}
            </button>
            <div role="group" aria-label="Speed" className="segmented">
              <button aria-pressed={slow} onClick={() => setSlow(true)}>
                0.5×
              </button>
              <button aria-pressed={!slow} onClick={() => setSlow(false)}>
                1×
              </button>
            </div>
            <button className="btn-secondary" aria-pressed={mirror} onClick={() => setMirror((m) => !m)}>
              Mirror
            </button>
          </div>
        </section>

        <aside className="watch-side">
          {isFinale ? (
            <>
              <h1 tabIndex={-1} className="finale-title">
                Now sign them together: I love you
              </h1>
              <span aria-hidden="true" className="big-letter big-letter--word">
                {item}
              </span>
              <p className="lead">You know I, L and Y. Combine them in one hand. {howTo(item)}</p>
              <p className="small muted">Next, sign it yourself on camera.</p>
            </>
          ) : (
            <>
              <h1 tabIndex={-1} className="watch-title">
                <span className="sr-only">Watch the sign for </span>
                <span className="big-letter">{item}</span>
              </h1>
              <p className="lead">{howTo(item)}</p>
              <p className="small muted">Next, pick it out of a few look-alikes, then sign it yourself.</p>
            </>
          )}
        </aside>
      </main>
      <Actions>
        {/* The finale has no quiz: straight to the camera. */}
        <a href={href(isFinale ? "check" : "quiz")} className="btn-primary">
          {isFinale ? "Got it, let me sign it" : "Got it, quiz me"}
        </a>
      </Actions>
    </>
  );
}
