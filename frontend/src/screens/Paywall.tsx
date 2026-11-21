import { useEffect, useState } from "react";
import { Actions, BackHeader } from "../components";
import { href } from "../router";
import { track } from "../funnel";

// HACK: mock paywall, no payments (see CLAUDE.md › Won't).
// Prices come from research/asl-unit-economics.xlsx: change them there first, then here.
const PLANS = {
  year: { label: "Yearly", price: "$94.99", per: "a year", note: "$7.92 a month · save 50%" },
  month: { label: "Monthly", price: "$15.99", per: "a month", note: "Cancel anytime" },
} as const;
type Plan = keyof typeof PLANS;

const ROWS: [string, string, string][] = [
  ["Lessons and quizzes", "Alphabet and first words", "All lessons"],
  ["Camera checks", "A few per day", "Unlimited"],
  ["Coach", "Hints", "Hints, lesson summary, review plan"],
  ["Read signs at full speed", "Not included", "Included"],
];

export default function Paywall() {
  // The target scenario assumes 70% annual plans, so the yearly plan is preselected.
  const [plan, setPlan] = useState<Plan>("year");
  const [note, setNote] = useState(false);
  useEffect(() => track("paywall_viewed"), []);
  const chosen = PLANS[plan];

  return (
    <>
      <BackHeader back="lessons" help={false} />
      <main className="main paywall">
        <div className="paywall-head">
          <h1 tabIndex={-1} className="display h-56 balance">You finished the free lessons</h1>
          <p className="lead muted">
            You can spell their name and sign your first words. Premium opens every next lesson and unlimited camera
            checks with the coach.
          </p>
        </div>

        <fieldset className="question">
          <legend className="body-17">
            <b>Choose a plan</b>
          </legend>
          <ul className="choice-list">
            {(Object.keys(PLANS) as Plan[]).map((id) => (
              <li key={id}>
                <label className="choice">
                  <input
                    type="radio"
                    name="plan"
                    value={id}
                    checked={plan === id}
                    onChange={() => {
                      setPlan(id);
                      track("paywall_plan_selected", { plan: id });
                    }}
                  />
                  <span className="choice-text">
                    {PLANS[id].label}: {PLANS[id].price} {PLANS[id].per}
                    <small>{PLANS[id].note}</small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

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
        <p role="status" className="small muted">
          {note ? "Demo: payments are mocked." : ""}
        </p>
      </main>
      <Actions split>
        <a href={href("lessons")} className="btn-text">
          Not now
        </a>
        {/* HACK: no payments (see CLAUDE.md › Won't); the button only shows a note. */}
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            track("paywall_checkout_clicked", { plan });
            setNote(true);
          }}
        >
          Go Premium for {chosen.price} {chosen.per}
        </button>
      </Actions>
    </>
  );
}
