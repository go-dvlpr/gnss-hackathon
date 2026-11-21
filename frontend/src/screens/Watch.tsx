import { useState } from "react";
import { Actions, BackHeader, LessonProgress, Stage } from "../components";
import { href } from "../router";
import { useLesson } from "../lesson";

export default function Watch() {
  const { letters } = useLesson();
  const letter = letters[0] ?? "L"; // HACK: always the first letter until the lesson loop exists.
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(true);
  const [mirror, setMirror] = useState(false);
  return (
    <>
      <BackHeader back="lessons" />
      <LessonProgress label="Step 1 of 3: watch" />
      <main className="main watch">
        <section aria-label="Reference" className="watch-media">
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
          <span className="big-letter">{letter}</span>
          <p className="lead">[How to make the sign: one or two short sentences, e.g. index finger up, thumb out to the side.]</p>
          <p className="small muted">Next you'll pick it out of three, then sign it yourself.</p>
        </aside>
      </main>
      <Actions>
        <a href={href("quiz")} className="btn-primary">
          Got it, quiz me
        </a>
      </Actions>
    </>
  );
}
