import { useState } from "react";
import { HomeHeader, Media } from "../components";
import { go, href } from "../router";
import { useLesson } from "../lesson";
import { useFunnel } from "../funnel";

// HACK: teaser videos reuse lesson-2 clips until we record these signs.
const LOCKED: [title: string, words: string, video: string][] = [
  ["Family", "Mom, dad, baby and love.", "ILY"],
  ["At the table", "Eat, drink, water, milk and more.", "THANKYOU"],
  ["Every day", "Help, play and where.", "YES"],
];

export default function Lessons() {
  const { letters, openLesson, progress } = useLesson();
  const { logout, dirty } = useFunnel();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const { stars } = progress[1];

  async function signOut() {
    setSigningOut(true);
    setSignOutError(false);
    try {
      await logout();
      go("welcome");
    } catch {
      setSignOutError(true);
    } finally {
      setSigningOut(false);
    }
  }
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
            <button type="button" className="btn-primary btn-primary--wide" onClick={() => openLesson(1)}>
              {progress[1].completed ? "View results" : "Continue"}
            </button>
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
              onClick={() => openLesson(2)}
            >
              {progress[2].completed ? "View results" : progress[2].pos ? "Continue" : "Start"}
            </button>
          </li>
          {/* HACK: locked teasers for the levels after the demo; asl-core already knows these signs. */}
          {LOCKED.map(([title, words, video], i) => (
            <li key={title} className="lesson-row">
              <Media item={video} label={`Lesson ${i + 3}: ${title}`} className="lesson-img" />
              <div className="lesson-body">
                <span className="lesson-kicker">Lesson {i + 3}</span>
                <h2 className="lesson-title lesson-title--locked">{title}</h2>
                <p className="body-17 muted">{words} {i === 0 && progress[2].completed ? "Premium." : `Opens after lesson ${i + 2}.`}</p>
              </div>
              {i === 0 && progress[2].completed && (
                <a href={href("paywall")} className="btn-primary btn-primary--wide">
                  Unlock
                </a>
              )}
            </li>
          ))}
        </ol>
        <button type="button" className="btn-text" onClick={signOut} disabled={dirty || signingOut}>
          {signingOut ? "Logging out…" : "Log out"}
        </button>
        {signOutError && <p className="field-error" role="alert">Couldn't log out. Try again.</p>}
      </main>
    </>
  );
}
