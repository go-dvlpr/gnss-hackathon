import { ComingSoon, HomeHeader, Stage } from "../components";
import { href } from "../router";
import { useLesson } from "../lesson";

export default function Lessons() {
  const { letters, stars } = useLesson();
  const learned = letters.filter((l) => (stars[l] ?? 0) > 0).length;
  return (
    <>
      <HomeHeader />
      <main className="main lessons">
        <h1 tabIndex={-1} className="display h-56">Your lessons</h1>
        <ol className="lesson-list">
          <li className="lesson-row">
            <Stage label="Lesson 1 image" text="[lesson image]" className="lesson-img" />
            <div className="lesson-body">
              <span className="lesson-kicker">Lesson 1</span>
              <h2 className="lesson-title">Their name, letter by letter</h2>
              <p className="body-17 muted">
                Type the name of the person you're learning for. For each letter you watch, pick it out, then sign it on
                camera.
              </p>
              <div className="lesson-meter">
                <div aria-hidden="true" className="meter" style={{ gridTemplateColumns: `repeat(${letters.length || 1}, minmax(0, 1fr))` }}>
                  {letters.map((l) => (
                    <div key={l} className={(stars[l] ?? 0) > 0 ? "is-done" : undefined} />
                  ))}
                </div>
                <span className="small" style={{ fontWeight: 600 }}>
                  {learned} of {letters.length} letters
                </span>
              </div>
            </div>
            <a href={href("name")} className="btn-primary btn-primary--wide">
              Continue
            </a>
          </li>
          <li className="lesson-row">
            <Stage label="Lesson 2 image" text="[lesson image]" className="lesson-img lesson-img--locked" />
            <div className="lesson-body">
              <span className="lesson-kicker">Lesson 2</span>
              <h2 className="lesson-title lesson-title--locked">Your first eight words</h2>
              <p className="body-17 muted">Hello, goodbye, yes, no, please, thank you, sorry and I love you. Opens after lesson 1.</p>
            </div>
            {/* HACK: lesson 2 preview is not designed yet. */}
            <ComingSoon className="btn-text">Preview</ComingSoon>
          </li>
        </ol>
      </main>
    </>
  );
}
