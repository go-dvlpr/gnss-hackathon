import { useEffect, useState } from "react";
import { BackHeader, LessonProgress, Stage } from "../components";
import { go } from "../router";
import { quizOptions, useLesson } from "../lesson";

export default function Quiz() {
  const { item = "L", isFinale, letters, pos, miss } = useLesson();
  const [wrong, setWrong] = useState<string[]>([]);
  const options = quizOptions(item, letters, pos);
  const last = wrong[wrong.length - 1];

  // The finale has no quiz.
  useEffect(() => {
    if (isFinale) go("check");
  }, [isFinale]);

  const pick = (o: string) => {
    if (o === item) {
      go("check");
      return;
    }
    setWrong((w) => (w.includes(o) ? w : [...w, o]));
    miss(); // Comes back after two others.
  };

  return (
    <>
      <BackHeader back="watch" />
      <LessonProgress step={2} label="quiz" />
      <main className="main quiz">
        {/* HACK: placeholder until reference images are recorded. */}
        <Stage label="The sign to recognise" text="[sign image or clip]" className="stage--4x3 quiz-media" />
        <section className="quiz-side">
          <h1 tabIndex={-1} className="display h-48">
            Which letter is this?
          </h1>
          <div role="group" aria-label="Answers" className="answers">
            {options.map((o) => {
              const isWrong = wrong.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  className={isWrong ? "answer is-wrong" : "answer"}
                  aria-invalid={isWrong || undefined}
                  aria-disabled={isWrong || undefined}
                  onClick={isWrong ? undefined : () => pick(o)}
                >
                  {o}
                  {isWrong && <span className="sr-only">, not this one</span>}
                </button>
              );
            })}
          </div>
          <p className="small muted quiz-feedback" aria-live="polite">
            {last ? (
              <span className="fix-text">That's {last}. Look at the thumb and which fingers are up.</span>
            ) : (
              "Look at the thumb and which fingers are up."
            )}
          </p>
        </section>
      </main>
    </>
  );
}
