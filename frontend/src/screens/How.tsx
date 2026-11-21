import { ArrowLeft, Logo } from "../components";
import { href } from "../router";
import { useFunnel } from "../funnel";

// Facts on this page mirror recognizer.ts and vendor/asl-core.js; update both together.
const STEPS: { title: string; body: string }[] = [
  {
    title: "The camera finds your hand",
    body:
      "A free hand model from Google (MediaPipe Hand Landmarker) runs right in your browser and puts 21 points on your hand in every frame. For word signs it also finds your face, so it knows where your forehead and chin are.",
  },
  {
    title: "Rules read the handshape",
    body:
      "From those points we work out each finger: straight, curved, folded into the palm, hooked or bent at the knuckle, plus where the thumb is and how far apart the fingers are. Every letter is a short list of such rules. L, for example: index finger straight up, thumb out to the side, the other three fingers folded.",
  },
  {
    title: "When a sign counts",
    body:
      "A letter counts when its rules match, no important rule clearly fails, no other letter fits better, and you hold it for a moment (about two thirds of a second). A word also checks where and how your hand moves: HELLO starts at the forehead and moves away, THANK YOU starts at the chin, YES is a fist nodding a few times, NO is two fingers snapping onto the thumb.",
  },
  {
    title: "The coach names one fix",
    body:
      "The rule that failed writes the hint, so the hint always matches the reason the sign wasn't accepted: “Stick your thumb out to the side to make an L.” If your hand looks like another letter, the coach says which one. On the video, fingers that fit turn green, nearly-there ones yellow, and the ones to fix red.",
  },
  {
    title: "Not sure means “show it again”",
    body:
      "If your hand is too far, too close, partly out of frame or moving, the camera tells you that instead of judging the sign. A try starts when the camera first sees your hand and lasts 8 seconds. If the sign doesn't count by then, you see your last frame next to the reference and the hint, and you try again.",
  },
];

export default function How() {
  const { profile } = useFunnel();
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          {/* Back returns to wherever the link was opened (a lesson step or Lessons). */}
          <a
            href={href(profile.email ? "lessons" : "welcome")}
            className="back"
            aria-label="Back"
            onClick={(e) => {
              if (window.history.length > 1) {
                e.preventDefault();
                window.history.back();
              }
            }}
          >
            <ArrowLeft />
            <span className="back-label">Back</span>
          </a>
          <Logo />
        </div>
      </header>
      <main className="main how">
        <h1 tabIndex={-1} className="display h-48 balance">
          How checking works
        </h1>
        <p className="lead">
          Sign recognition happens on your device. Your video stays in the browser. The rules that check your sign also
          write the coach's hint.
        </p>

        <ol className="how-steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <h2>{s.title}</h2>
              <p className="body-17">{s.body}</p>
            </li>
          ))}
        </ol>

        <section aria-labelledby="how-privacy" className="how-note">
          <h2 id="how-privacy">Your camera and your data</h2>
          <p className="body-17">
            The video is processed frame by frame in your browser and is not recorded or uploaded. The browser
            downloads the hand model from a public site once; after that, recognition runs on your computer. Your lesson
            progress is saved to your account so you can resume on another device.
          </p>
        </section>

        <section aria-labelledby="how-limits" className="how-note">
          <h2 id="how-limits">What it can't do yet</h2>
          <ul className="body-17">
            <li>It doesn't check which way your palm faces yet.</li>
            <li>The rules were tuned on a model hand and a few people, so an unusual hand can be rejected. If a sign
              you're sure of keeps failing, watch the reference and try in better light.</li>
            <li>J and Z (letters that move) and two-handed words are not in the lessons yet.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
