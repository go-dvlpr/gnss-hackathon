import { HomeHeader, Stage } from "../components";
import { href } from "../router";
import { useLesson } from "../lesson";

export default function Lessons() {
  const { letters } = useLesson();
  const learned = 1; // HACK: mock progress until the lesson loop stores it.
  return (
    <>
      <HomeHeader />
      <main className="main lessons">
        <h1 className="display h-56">Your lessons</h1>
        <ol className="lesson-list">
          <li className="lesson-row">
            <Stage label="Lesson 1 image" text="[lesson image]" className="lesson-img" />
            <div className="lesson-body">
              <span className="lesson-kicker">Lesson 1</span>
              <h2 className="lesson-title">Their name, letter by letter</h2>
              <p className="body-17 muted">
                You type the name of the person you're learning for. We teach each letter, quiz you, then check your sign
                on camera.
              </p>
              <div className="lesson-meter">
                <div className="meter" style={{ gridTemplateColumns: `repeat(${letters.length || 1}, minmax(0, 1fr))` }}>
                  {letters.map((_, i) => (
                    <div key={i} className={i < learned ? "done" : undefined} />
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
              <h2 className="lesson-title lesson-title--locked">Two phrases</h2>
              <p className="body-17 muted">[Phrase 1] and [Phrase 2]. Opens after lesson 1.</p>
            </div>
            <a href="#" className="btn-text" onClick={(e) => e.preventDefault()}>
              Preview
            </a>
          </li>
        </ol>
      </main>
    </>
  );
}
