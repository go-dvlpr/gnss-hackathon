import { useEffect, useState } from "react";
import { BackHeader, Check, LessonProgress, Media } from "../components";
import { go } from "../router";
import { FINALE, isWord, labelOf, quizOptions, useLesson } from "../lesson";

/** Pause on a right answer before the next question, so the ✓ is seen. */
const RIGHT_MS = 700;

/**
 * Quiz round at the end of the lesson, after every sign was watched and signed: one question per
 * sign. A missed question comes back once at the end of the round.
 * HACK: round progress lives in this screen only; a reload restarts the round.
 */
export default function Quiz() {
  const { lesson, queue, letters } = useLesson();
  const [round, setRound] = useState<string[]>(() =>
    queue.filter((x, i) => queue.indexOf(x) === i && !(lesson === 1 && x === FINALE)),
  );
  const [qi, setQi] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [right, setRight] = useState(false);
  const [requeued, setRequeued] = useState<string[]>([]);
  const item = round[qi];

  useEffect(() => {
    if (item === undefined) go("done");
  }, [item]);

  useEffect(() => {
    if (!right) return;
    const t = setTimeout(() => {
      setRight(false);
      setWrong([]);
      setQi((i) => i + 1);
    }, RIGHT_MS);
    return () => clearTimeout(t);
  }, [right]);

  if (item === undefined) return null;

  const options = quizOptions(item, letters, qi);
  const last = wrong[wrong.length - 1];
  const tip = isWord(item)
    ? "Look at the handshape and where the hand moves."
    : "Look at the thumb and which fingers are up.";

  const pick = (o: string) => {
    if (right) return;
    if (o === item) {
      setRight(true);
      return;
    }
    setWrong((w) => (w.includes(o) ? w : [...w, o]));
    // A miss comes back once, at the end of the round.
    if (!requeued.includes(item)) {
      setRequeued((r) => [...r, item]);
      setRound((r) => [...r, item]);
    }
  };

  return (
    <>
      <BackHeader />
      <LessonProgress label={`Final quiz: ${Math.min(qi + 1, round.length)} of ${round.length}`} back="check" />
      <main className="main quiz">
        <Media key={qi} item={item} label="The sign to recognise" className="stage--4x3 quiz-media" />
        <section className="quiz-side">
          <h1 tabIndex={-1} className="display h-48">
            {isWord(item) ? "Which word is this?" : "Which letter is this?"}
          </h1>
          <div role="group" aria-label="Answers" className="answers">
            {options.map((o) => {
              const isWrong = wrong.includes(o);
              const isRight = right && o === item;
              return (
                <button
                  key={o}
                  type="button"
                  className={[isWrong ? "is-wrong" : "", isRight ? "is-right" : "", isWord(o) ? "answer answer--word" : "answer"]
                    .join(" ")
                    .trim()}
                  aria-invalid={isWrong || undefined}
                  aria-disabled={isWrong || right || undefined}
                  onClick={isWrong ? undefined : () => pick(o)}
                >
                  {labelOf(o)}
                  {isWrong && <span className="sr-only">, not this one</span>}
                </button>
              );
            })}
          </div>
          <p className="small muted quiz-feedback" aria-live="polite">
            {right ? (
              <span className="ok-text">
                <Check color="currentColor" /> Right, that's {labelOf(item)}.
              </span>
            ) : last ? (
              <span className="fix-text">
                That's {labelOf(last)}. {tip}
              </span>
            ) : (
              tip
            )}
          </p>
        </section>
      </main>
    </>
  );
}
