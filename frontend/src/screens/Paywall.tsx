import { useState } from "react";
import { BackHeader } from "../components";
import { href } from "../router";

// HACK: mock paywall, no payments (see CLAUDE.md › Won't).
const ROWS: [string, string, string][] = [
  ["Lessons and quizzes", "Alphabet and first words", "All lessons"],
  ["Camera checks", "A few per day", "Unlimited"],
  ["Coach", "Hints", "Hints, lesson summary, review plan"],
  ["Read signs at full speed", "Not included", "Included"],
];

export default function Paywall() {
  const [note, setNote] = useState(false);
  return (
    <>
      <BackHeader back="lessons" help={false} />
      <main className="main paywall">
        <div className="paywall-head">
          <h1 tabIndex={-1} className="display h-56 balance">Your free checks for today are used up</h1>
          <p className="lead muted">
            Lessons and quizzes stay open. Come back tomorrow for more camera checks, or go Premium to keep practicing
            now.
          </p>
        </div>

        <table className="plans">
          <thead>
            <tr>
              <td />
              <th scope="col">Free</th>
              <th scope="col" className="premium">
                Premium
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([feature, free, premium]) => (
              <tr key={feature}>
                <th scope="row">{feature}</th>
                <td className={free === "Not included" ? "muted" : undefined}>{free}</td>
                <td className="premium">{premium}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="paywall-actions">
          {/* HACK: no payments (see CLAUDE.md › Won't); the button only shows a note. */}
          <button type="button" className="btn-primary btn-primary--wide" onClick={() => setNote(true)}>
            Go Premium for $99.99 a year
          </button>
          <a href={href("lessons")} style={{ fontWeight: 600 }}>
            Come back tomorrow
          </a>
        </div>
        <p role="status" className="small muted">
          {note ? "Demo: payments are mocked." : ""}
        </p>
      </main>
    </>
  );
}
