import { Actions, BackHeader } from "../components";
import { href } from "../router";
import { useLesson } from "../lesson";

// HACK: mock stars (1, 2, 1, 2, ...) until the lesson loop computes them.
const mockStars = (i: number) => (i % 2 === 0 ? 1 : 2);

export default function Done() {
  const { name, letters } = useLesson();
  return (
    <>
      <BackHeader back="lessons" help={false} />
      <main className="main done">
        <h1 className="display h-72">You can spell {name} in sign</h1>
        <ol aria-label="Stars per letter" className="star-list">
          {letters.map((l, i) => {
            const n = mockStars(i);
            return (
              <li key={i}>
                <span className="tile tile--lg">{l}</span>
                <span aria-label={`${n} star${n > 1 ? "s" : ""}`} className="stars">
                  {"★".repeat(n)}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="lead done-summary">
          <b>Coach:</b> [two-line lesson summary, e.g. I and Y were clean from the first try. L took two: keep that thumb
          out.]
        </p>
      </main>
      <Actions>
        <a href={href("watch")} className="btn-text">
          Practice the name again
        </a>
        <a href={href("paywall")} className="btn-primary">
          Start lesson 2
        </a>
      </Actions>
    </>
  );
}
