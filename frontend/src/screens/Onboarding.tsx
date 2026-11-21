import { useState } from "react";
import { Actions, ArrowLeft, BackLink, Logo } from "../components";
import { go } from "../router";
import { QUESTIONS, track, useFunnel, type Profile } from "../funnel";

export default function Onboarding() {
  const { profile, update } = useFunnel();
  const questions = QUESTIONS.filter((q) => !q.when || q.when(profile));
  const [step, setStep] = useState(0);
  const total = questions.length;
  const q = questions[Math.min(step, total - 1)];
  const answer = profile[q.key];
  const last = step === total - 1;

  const next = () => {
    track("onboarding_answered", { question: q.key, answer });
    if (last) {
      track("onboarding_completed", { ...profile, email: undefined });
      go("lessons");
    } else {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const choose = (value: string) => {
    const patch: Partial<Profile> = { [q.key]: value };
    if (q.key === "reason" && value !== "loved") patch.who = undefined;
    update(patch);
  };

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          {step === 0 ? (
            <BackLink to="welcome" />
          ) : (
            <button type="button" className="back" aria-label="Back" onClick={() => setStep(step - 1)}>
              <ArrowLeft />
              <span className="back-label">Back</span>
            </button>
          )}
          <Logo />
        </div>
      </header>
      <div aria-label="Onboarding progress" className="progress">
        <div className="wrap">
          <b>Getting to know you</b>
          <div className="meter" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
            {Array.from({ length: total }, (_, i) => (
              <div key={i} className={i <= step ? "is-done" : undefined} />
            ))}
          </div>
          <span className="spacer" />
          <span className="progress-label">Question {step + 1} of {total}</span>
        </div>
      </div>

      <main className="main funnel">
        <fieldset className="question" key={q.key}>
          <legend className="funnel-head">
            <h1 tabIndex={-1} className="display h-48 balance">{q.title}</h1>
            {q.lead && <p className="lead muted">{q.lead}</p>}
          </legend>
          <ul className="choice-list">
            {q.options.map((o) => (
              <li key={o.value}>
                <label className="choice">
                  <input
                    type="radio"
                    name={q.key}
                    value={o.value}
                    checked={answer === o.value}
                    onChange={() => choose(o.value)}
                  />
                  <span className="choice-text">
                    {o.label}
                    {o.hint && <small>{o.hint}</small>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </main>
      <Actions>
        <button type="button" className="btn-primary btn-primary--wide" disabled={!answer} onClick={next}>
          {last ? "Start learning" : "Continue"}
        </button>
      </Actions>
    </>
  );
}
