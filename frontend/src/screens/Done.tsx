import { Actions, BackHeader } from "../components";
import { go, href } from "../router";
import { WORDS, labelOf, useLesson } from "../lesson";

const list = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

// HACK: template summary until the coach LLM writes it. For LILY it reads like the design copy.
function summary(letters: string[], stars: Record<string, number>): string {
  const clean = letters.filter((l) => (stars[l] ?? 0) >= 2);
  const worked = letters.filter((l) => (stars[l] ?? 0) === 1);
  const parts: string[] = [];
  if (clean.length) parts.push(`${list(clean)} ${clean.length > 1 ? "were" : "was"} clean from the first try.`);
  if (worked.length)
    parts.push(
      `${list(worked)} took two${worked.includes("L") ? ": keep that thumb out" : ""}.`,
    );
  if (["I", "L", "Y"].every((l) => letters.includes(l)))
    parts.push("Put I, L and Y together and you're signing I love you.");
  return parts.join(" ") || "Practice the name once more and the stars will follow.";
}

export default function Done() {
  const { lesson, name, letters: nameLetters, stars, reset } = useLesson();
  const letters = lesson === 2 ? WORDS : nameLetters;
  return (
    <>
      <BackHeader back="lessons" help={false} />
      <main className="main done">
        <h1 tabIndex={-1} className="display h-72 balance">
          {lesson === 2 ? `You can sign ${WORDS.length} words` : `You can spell ${name} in sign`}
        </h1>
        <ol aria-label="Stars per letter" className="star-list">
          {letters.map((l) => {
            const n = stars[l] ?? 0;
            return (
              <li key={l}>
                <span className="tile tile--lg">{labelOf(l)}</span>
                <span role="img" aria-label={n ? `${l}: ${n} star${n > 1 ? "s" : ""}` : `${l}: not yet`} className="stars">
                  {n ? "★".repeat(n) : "Not yet"}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="lead done-summary">
          <b>Coach:</b> {summary(letters, stars)}
        </p>
      </main>
      <Actions>
        <button
          type="button"
          className="btn-text"
          onClick={() => {
            reset();
            go("watch");
          }}
        >
          {lesson === 2 ? "Practice the words again" : "Practice the name again"}
        </button>
        <a href={href("paywall")} className="btn-primary">
          Start lesson 2
        </a>
      </Actions>
    </>
  );
}
