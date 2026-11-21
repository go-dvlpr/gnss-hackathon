import { BackHeader, LessonProgress, Stage } from "../components";
import { href } from "../router";

// HACK: fixed options from the design; real ones come from the hard pairs of the eval set.
const OPTIONS = ["L", "I", "Y"];
const CORRECT = "L";

export default function Quiz() {
  return (
    <>
      <BackHeader back="watch" />
      <LessonProgress label="Step 2 of 3: quiz" />
      <main className="main quiz">
        <Stage label="The sign to recognise" text="[sign image or clip]" className="stage--4x3 quiz-media" />
        <section className="quiz-side">
          <h1 className="display h-48">Which letter is this?</h1>
          <div role="group" aria-label="Answers" className="answers">
            {OPTIONS.map((o) => (
              <a
                key={o}
                className="answer"
                href={o === CORRECT ? href("check") : "#"}
                onClick={o === CORRECT ? undefined : (e) => e.preventDefault()}
              >
                {o}
              </a>
            ))}
          </div>
          <p className="small muted">For phrases the options are words. Wrong answers come from signs that look alike.</p>
        </section>
      </main>
    </>
  );
}
