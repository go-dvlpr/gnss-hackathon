import { useEffect } from "react";
import { Actions, Check, Logo } from "../components";
import { href } from "../router";
import { track } from "../funnel";

const STEPS = [
  "Tell us who you're learning for. Lesson 1 is their name.",
  "Watch each sign, then sign it to your webcam. The coach says exactly what to fix.",
  "Finish with a quick quiz on all the signs you learned.",
];

/** I + L + Y: the three letters that make the ILY handshape. */
const ILY_PARTS = [
  { letter: "I", finger: "little finger" },
  { letter: "L", finger: "thumb and index" },
  { letter: "Y", finger: "thumb and little finger" },
];

export default function Welcome() {
  useEffect(() => track("welcome_viewed"), []);
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Logo />
          <span className="spacer" />
          <a href={href("login")} className="topbar-link">
            Log in
          </a>
        </div>
      </header>
      <main className="main landing">
        <section className="landing-hero">
          <div className="landing-copy">
            <h1 tabIndex={-1} className="display h-64 balance">
              Learn to sign to the one you love
            </h1>
            <p className="lead muted">
              A sign language practice game for hearing people with a Deaf partner, child or parent. Your webcam checks
              every sign, and the coach says what to fix.
            </p>
          </div>
          <figure className="landing-video">
            {/* HACK: the hand frame and the verdict are drawn over the reference clip, not a live check. */}
            <div className="stage stage--media stage--16x9 landing-stage">
              <video
                src="/media/signs/ILY.mp4"
                aria-label="A woman signs I love you in ASL"
                muted
                loop
                autoPlay
                playsInline
              />
              <span className="landing-frame" aria-hidden="true" />
              <p className="camera-status landing-status">
                <span>
                  <Check /> I love you
                </span>
              </p>
            </div>
            <figcaption className="small muted">
              This is “I love you” in ASL. In lesson 2 you will sign it too.
            </figcaption>
          </figure>
        </section>

        <section className="landing-ily" aria-labelledby="ily-title">
          <h2 id="ily-title" className="display h-48 balance">
            Three letters, one sentence
          </h2>
          <p className="lead muted landing-ily-lead">
            The “I love you” handshape is I, L and Y at once. Learn the letters, then put them together.
          </p>
          <ol className="ily-sum">
            {ILY_PARTS.map(({ letter, finger }, i) => (
              <li key={letter}>
                {i > 0 && (
                  <span className="ily-op" aria-hidden="true">
                    +
                  </span>
                )}
                <figure>
                  <img src={`/media/letters/${letter}.svg`} alt={`ASL letter ${letter}`} />
                  <figcaption>
                    <b className="display">{letter}</b>
                    <span className="small muted">{finger}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
            <li className="ily-result">
              <span className="ily-op" aria-hidden="true">
                =
              </span>
              <figure>
                <div className="stage stage--media ily-result-media">
                  <video src="/media/signs/ILY.mp4" aria-label="The I love you sign" muted loop autoPlay playsInline />
                </div>
                <figcaption>
                  <b className="display">I love you</b>
                  <span className="small muted">all three at once</span>
                </figcaption>
              </figure>
            </li>
          </ol>
        </section>

        <section className="landing-how" aria-labelledby="how-title">
          <div className="landing-how-text">
            <h2 id="how-title" className="display h-48 balance">
              Not just “wrong”. What to fix.
            </h2>
            <ol className="how-list">
              {STEPS.map((s, i) => (
                <li key={i}>
                  <span className="how-num">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="landing-hint">
            <p className="tiny muted">The coach, after a try at Y</p>
            <p className="coach-hint">Almost. Stretch your thumb out to the side, like the little finger.</p>
            <p className="small muted">
              Recognition runs in your browser. Video never leaves your computer.
            </p>
          </div>
        </section>
      </main>
      <Actions split>
        <a href={href("login")} className="btn-text">
          I already have an account
        </a>
        <a href={href("onboarding")} className="btn-primary btn-primary--wide">
          Get started
        </a>
      </Actions>
    </>
  );
}
