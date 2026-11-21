import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRoute, type Route } from "./router";
import { DEFAULT_NAME, FINALE, WORDS, LessonContext, lettersOf, queueOf, reinsert, starsFor, type Lesson } from "./lesson";
import Lessons from "./screens/Lessons";
import NameScreen from "./screens/Name";
import Watch from "./screens/Watch";
import Quiz from "./screens/Quiz";
import CheckScreen from "./screens/Check";
import Coach from "./screens/Coach";
import Done from "./screens/Done";
import Paywall from "./screens/Paywall";
import Welcome from "./screens/Welcome";
import { Login, Signup } from "./screens/Auth";
import Onboarding from "./screens/Onboarding";
import { FunnelContext, type Profile } from "./funnel";

const SCREENS: Record<Route, ComponentType> = {
  welcome: Welcome,
  signup: Signup,
  login: Login,
  onboarding: Onboarding,
  lessons: Lessons,
  name: NameScreen,
  watch: Watch,
  quiz: Quiz,
  check: CheckScreen,
  coach: Coach,
  done: Done,
  paywall: Paywall,
};

const TITLES: Record<Route, string> = {
  welcome: "Learn to sign to the one you love",
  signup: "Save your plan",
  login: "Log in",
  onboarding: "Getting to know you",
  lessons: "Your lessons",
  name: "Who are you learning for",
  watch: "Watch",
  quiz: "Quiz",
  check: "Sign it",
  coach: "Coach",
  done: "Lesson done",
  paywall: "Premium",
};

type State = {
  lesson: 1 | 2;
  name: string;
  queue: string[];
  pos: number;
  tries: number;
  hinted: boolean;
  /** Position whose miss was already re-inserted, so one item comes back once. */
  missedAt: number | null;
  /** Letters missed at least once in this lesson (no ★★ for them). */
  missed: string[];
  stars: Record<string, number>;
};

const STORAGE_KEY = "ily.lesson.v1";

const fresh = (name: string, lesson: 1 | 2 = 1): State => ({
  lesson,
  name,
  queue: lesson === 2 ? WORDS : queueOf(name),
  pos: 0,
  tries: 1,
  hinted: false,
  missedAt: null,
  missed: [],
  stars: {},
});

function load(): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh(DEFAULT_NAME);
    const s = JSON.parse(raw) as Partial<State>;
    if (typeof s.name !== "string" || !Array.isArray(s.queue) || typeof s.pos !== "number") return fresh(DEFAULT_NAME);
    return {
      ...fresh(s.name, s.lesson === 2 ? 2 : 1),
      queue: s.queue.filter((x): x is string => typeof x === "string"),
      pos: s.pos,
      stars: s.stars && typeof s.stars === "object" ? s.stars : {},
      missed: Array.isArray(s.missed) ? s.missed : [],
    };
  } catch {
    return fresh(DEFAULT_NAME);
  }
}

export default function App() {
  const route = useRoute();
  const [s, setS] = useState<State>(load);
  // HACK: onboarding answers live in memory only; a reload starts over.
  const [profile, setProfile] = useState<Profile>({ email: "" });
  const funnel = useMemo(
    () => ({ profile, update: (patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch })) }),
    [profile],
  );

  useEffect(() => {
    try {
      const { lesson, name, queue, pos, stars, missed } = s;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lesson, name, queue, pos, stars, missed }));
    } catch {
      // Storage blocked (private mode): the lesson just isn't remembered.
    }
  }, [s]);

  const lesson = useMemo<Lesson>(() => {
    const item = s.queue[s.pos];
    const miss = (st: State): State =>
      st.missedAt === st.pos || st.queue[st.pos] === undefined
        ? st
        : {
            ...st,
            queue: reinsert(st.queue, st.pos),
            missedAt: st.pos,
            missed: st.missed.includes(st.queue[st.pos]) ? st.missed : [...st.missed, st.queue[st.pos]],
          };
    const next = (st: State): State => ({ ...st, pos: st.pos + 1, tries: 1, hinted: false, missedAt: null });
    return {
      lesson: s.lesson,
      startWords: () => setS((st) => ({ ...fresh(st.name, 2), stars: st.stars })),
      name: s.name,
      setName: (name) => setS(fresh(name)),
      letters: lettersOf(s.name),
      queue: s.queue,
      pos: s.pos,
      item,
      isFinale: s.lesson === 1 && item === FINALE,
      isLast: s.pos === s.queue.length - 1,
      tries: s.tries,
      hinted: s.hinted,
      stars: s.stars,
      pass: () => {
        if (item === undefined) return 0;
        const earned = starsFor(s.tries, s.hinted, s.missed.includes(item));
        setS((st) => ({ ...st, stars: { ...st.stars, [item]: Math.max(st.stars[item] ?? 0, earned) } }));
        return earned;
      },
      miss: () => setS(miss),
      next: () => setS(next),
      retry: () => setS((st) => ({ ...st, tries: st.tries + 1, hinted: true })),
      skip: () => setS((st) => next(miss(st))),
      reset: () => setS((st) => fresh(st.name, st.lesson)),
    };
  }, [s]);

  // On route change: set the tab title and move focus to the screen's heading.
  const firstRender = useRef(true);
  useEffect(() => {
    document.title = `${TITLES[route]} — ILY`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [route, s.pos]);

  const Screen = SCREENS[route];
  return (
    <FunnelContext.Provider value={funnel}>
      <LessonContext.Provider value={lesson}>
        <div className="page">
          {/* Keyed so per-screen state (quiz picks, check verdict) resets for each item. */}
          <Screen key={`${route}-${s.pos}`} />
        </div>
      </LessonContext.Provider>
    </FunnelContext.Provider>
  );
}
