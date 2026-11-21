import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRoute, type Route } from "./router";
import { DEFAULT_NAME, FINALE, LessonContext, lettersOf, queueOf, reinsert, starsFor, type Lesson } from "./lesson";
import Lessons from "./screens/Lessons";
import NameScreen from "./screens/Name";
import Watch from "./screens/Watch";
import Quiz from "./screens/Quiz";
import CheckScreen from "./screens/Check";
import Coach from "./screens/Coach";
import Done from "./screens/Done";
import Paywall from "./screens/Paywall";

const SCREENS: Record<Route, ComponentType> = {
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

const fresh = (name: string): State => ({
  name,
  queue: queueOf(name),
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
      ...fresh(s.name),
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

  useEffect(() => {
    try {
      const { name, queue, pos, stars, missed } = s;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, queue, pos, stars, missed }));
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
      name: s.name,
      setName: (name) => setS(fresh(name)),
      letters: lettersOf(s.name),
      queue: s.queue,
      pos: s.pos,
      item,
      isFinale: item === FINALE,
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
      reset: () => setS((st) => fresh(st.name)),
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
    <LessonContext.Provider value={lesson}>
      <div className="page">
        {/* Keyed so per-screen state (quiz picks, check verdict) resets for each item. */}
        <Screen key={`${route}-${s.pos}`} />
      </div>
    </LessonContext.Provider>
  );
}
