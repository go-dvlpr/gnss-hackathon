import { BackHeader } from "../components";
import { href } from "../router";
import { useLesson } from "../lesson";

export default function NameScreen() {
  const { name, setName, letters } = useLesson();
  return (
    <>
      <BackHeader back="lessons" />
      <main className="main name-screen">
        <section className="name-intro">
          <h1 className="display h-64 balance">Learn to sign to the one you love</h1>
          <p className="lead muted">
            Lesson 1 is their name, letter by letter. Your webcam checks every sign, and the coach tells you exactly what
            to fix.
          </p>
          <form
            className="field"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.hash = href("watch");
            }}
          >
            <label htmlFor="name">Who are you learning for?</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            <span className="tiny muted">Their first name. J and Z move, so we'll teach those later.</span>
          </form>
          <a href={href("watch")} className="btn-primary btn-primary--wide" style={{ alignSelf: "flex-start" }}>
            Start lesson 1
          </a>
        </section>

        <section aria-label="Your lesson" className="name-preview">
          <div className="tiles">
            {letters.map((l, i) => (
              <span key={i} className="tile">
                {l}
              </span>
            ))}
          </div>
          <p className="muted">
            {letters.length} letters, about {Math.max(1, Math.round(letters.length * 1.25))} minutes. The tiles update as
            you type.
          </p>
          <p className="small muted note">
            You'll need your webcam. Recognition runs in your browser and video never leaves your computer.
          </p>
        </section>
      </main>
    </>
  );
}
