import { useState } from "react";
import { Actions, BackHeader, LessonProgress, Media } from "../components";
import { href } from "../router";
import { howTo, isWord, labelOf, useLesson } from "../lesson";

export default function Watch() {
  const { item = "L", isFinale, lesson } = useLesson();
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(true);
  const [mirror, setMirror] = useState(false);
  return (
    <>
      <BackHeader />
      <LessonProgress step={1} label="watch" back={lesson === 2 ? "lessons" : "name"} />
      <main className="main watch">
        <section aria-label="Reference" className="watch-media">
          <Media
            item={item}
            label={`Reference of the sign ${labelOf(item)}`}
            className="stage--16x10"
            paused={paused}
            rate={slow ? 0.5 : 1}
            mirror={mirror}
          />
          {/* Letters are static photos: no pause or speed. */}
          <div className="controls">
            {isWord(item) && (
              <>
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
              </>
            )}
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
                <span className={isWord(item) ? "big-letter big-letter--word" : "big-letter"}>{labelOf(item)}</span>
              </h1>
              <p className="lead">{howTo(item)}</p>
              <p className="small muted">Next, sign it to your webcam. A quick quiz on all the signs comes at the end.</p>
            </>
          )}
        </aside>
      </main>
      <Actions>
        {/* The quiz is one round at the end of the lesson, so every sign goes straight to the camera. */}
        <a href={href("check")} className="btn-primary">
          Got it, let me sign it
        </a>
      </Actions>
    </>
  );
}
