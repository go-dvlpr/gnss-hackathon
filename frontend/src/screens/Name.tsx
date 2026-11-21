import { Actions, BackHeader } from "../components";
import { go } from "../router";
import { allLettersOf, isTeachable, useLesson } from "../lesson";
import { lovedOne, useFunnel } from "../funnel";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function NameScreen() {
  const { name, setName, letters, item, lesson } = useLesson();
  const { profile } = useFunnel();
  const canStart = letters.length > 0;
  const tiles = allLettersOf(name);
  return (
    <>
      <BackHeader back="lessons" />
      <main className="main name-screen">
        <section className="name-intro">
          <h1 tabIndex={-1} className="display h-64 balance">
            Learn to sign to the one you love
          </h1>
          <p className="lead muted">
            Lesson 1 is their name, letter by letter. Your webcam checks every sign, and the coach tells you exactly what
            to fix.
          </p>
          <form
            id="name-form"
            className="field"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canStart) return;
              if (lesson === 2) setName(name);
              go(lesson === 1 && !item ? "done" : "watch");
            }}
          >
            <label htmlFor="name">
              {profile.who
                ? `${capitalize(lovedOne(profile))}'s first name`
                : profile.reason
                  ? "Your first name"
                  : "Who are you learning for?"}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              maxLength={80}
              aria-invalid={canStart ? undefined : true}
              aria-describedby={canStart ? "name-help" : "name-error name-help"}
            />
            {!canStart && (
              <span id="name-error" className="field-error">
                Type their first name
              </span>
            )}
            <span id="name-help" className="tiny muted">
              Their first name. J and Z move, so we'll teach those later.
            </span>
          </form>
        </section>

        <section aria-label="Your lesson" className="name-preview">
          <div className="tiles">
            {tiles.map((l, i) =>
              isTeachable(l) ? (
                <span key={i} className="tile">
                  {l}
                </span>
              ) : (
                <span key={i} className="tile is-later">
                  {l}
                  <span className="tile-note">later</span>
                </span>
              ),
            )}
          </div>
          <p className="muted" aria-live="polite">
            {letters.length} letter{letters.length === 1 ? "" : "s"}, about{" "}
            {Math.max(1, Math.round(letters.length * 1.25))} minute{letters.length <= 1 ? "" : "s"}. The tiles update as
            you type.
          </p>
          <p className="small muted note">
            You'll need your webcam. Recognition runs in your browser and video never leaves your computer.
          </p>
        </section>
      </main>
      <Actions>
        <button type="submit" form="name-form" disabled={!canStart} className="btn-primary btn-primary--wide">
          Start lesson 1
        </button>
      </Actions>
    </>
  );
}
