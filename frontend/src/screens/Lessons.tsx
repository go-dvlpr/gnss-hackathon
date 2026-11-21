import { HomeHeader, Media } from "../components";
import { go, href } from "../router";
import { useLesson } from "../lesson";

// HACK: teaser videos reuse lesson-2 clips until we record these signs.
const LOCKED: [title: string, words: string, video: string][] = [
  ["Family", "Mom, dad, baby and love.", "ILY"],
  ["At the table", "Eat, drink, water, milk and more.", "THANKYOU"],
  ["Every day", "Help, play and where.", "YES"],
];

export default function Lessons() {
  const { letters, stars, startWords } = useLesson();
  const learned = letters.filter((l) => (stars[l] ?? 0) > 0).length;
  return (
    <>
      <HomeHeader />
      <main className="main lessons">
        <h1 tabIndex={-1} className="display h-56">Your lessons</h1>
        <ol className="lesson-list">
          <li className="lesson-row">
            <div role="img" aria-label="Lesson 1: letters of the alphabet" className="stage stage--media lesson-img">
              <div className="lesson-grid">
                {/* Four letters: the name's own, padded with A, S, L, Y. */}
                {[...new Set([...letters, "A", "S", "L", "Y"])].slice(0, 4).map((l) => (
                  <img key={l} src={`/media/letters/${l}.svg`} alt="" />
                ))}
              </div>
            </div>
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
            <Media item="HELLO" label="Lesson 2: the sign for hello" className="lesson-img" />
            <div className="lesson-body">
              <span className="lesson-kicker">Lesson 2</span>
              <h2 className="lesson-title">Your first words</h2>
              <p className="body-17 muted">Hello, yes, no, thank you and I love you.</p>
            </div>
            {/* HACK: open for the demo; GOODBYE, PLEASE and SORRY wait until asl-core recognises them. */}
            <button
              type="button"
              className="btn-primary btn-primary--wide"
              onClick={() => {
                startWords();
                go("watch");
              }}
            >
              Start
            </button>
          </li>
          {/* HACK: locked teasers for the levels after the demo; asl-core already knows these signs. */}
          {LOCKED.map(([title, words, video], i) => (
            <li key={title} className="lesson-row">
              <Media item={video} label={`Lesson ${i + 3}: ${title}`} className="lesson-img" />
              <div className="lesson-body">
                <span className="lesson-kicker">Lesson {i + 3}</span>
                <h2 className="lesson-title lesson-title--locked">{title}</h2>
                <p className="body-17 muted">{words} Opens after lesson {i + 2}.</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
