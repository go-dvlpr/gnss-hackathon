import { useEffect, useState } from "react";
import { BackHeader, LessonProgress, Media } from "../components";
import { go } from "../router";
import { isWord, labelOf, quizOptions, useLesson } from "../lesson";

export default function Quiz() {
  const { item = "L", isFinale, letters, pos, miss } = useLesson();
  const [wrong, setWrong] = useState<string[]>([]);
  const options = quizOptions(item, letters, pos);
  const last = wrong[wrong.length - 1];
  const tip = isWord(item)
    ? "Look at the handshape and where the hand moves."
    : "Look at the thumb and which fingers are up.";

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
      <BackHeader />
      <LessonProgress label="Quiz" back="watch" />
      <main className="main quiz">
        <Media item={item} label="The sign to recognise" className="stage--4x3 quiz-media" />
        <section className="quiz-side">
          <h1 tabIndex={-1} className="display h-48">
            {isWord(item) ? "Which word is this?" : "Which letter is this?"}
          </h1>
          <div role="group" aria-label="Answers" className="answers">
            {options.map((o) => {
              const isWrong = wrong.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  className={[isWrong ? "is-wrong" : "", isWord(o) ? "answer answer--word" : "answer"].join(" ").trim()}
                  aria-invalid={isWrong || undefined}
                  aria-disabled={isWrong || undefined}
                  onClick={isWrong ? undefined : () => pick(o)}
                >
                  {labelOf(o)}
                  {isWrong && <span className="sr-only">, not this one</span>}
                </button>
              );
            })}
          </div>
          <p className="small muted quiz-feedback" aria-live="polite">
            {last ? (
              <span className="fix-text">That's {labelOf(last)}. {tip}</span>
            ) : (
              tip
            )}
          </p>
        </section>
      </main>
    </>
  );
}
