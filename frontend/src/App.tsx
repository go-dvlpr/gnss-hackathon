import { useEffect, useMemo, useRef, type ComponentType } from "react";
import { go, readRoute, useRoute, type Route } from "./router";
import { FINALE, LessonContext, lettersOf, reinsert, starsFor, type Lesson } from "./lesson";
import Lessons from "./screens/Lessons";
import NameScreen from "./screens/Name";
import Watch from "./screens/Watch";
import Quiz from "./screens/Quiz";
import CheckScreen from "./screens/Check";
import Coach from "./screens/Coach";
import Done from "./screens/Done";
import Paywall from "./screens/Paywall";
import How from "./screens/How";
import Welcome from "./screens/Welcome";
import { Login, Signup } from "./screens/Auth";
import Onboarding from "./screens/Onboarding";
import { FunnelContext, QUESTIONS, type Profile } from "./funnel";
import { useAccount } from "./account";
import { freshLesson, type LessonNumber, type LessonProgress } from "./progress";

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
  how: How,
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
  how: "How checking works",
};

const PUBLIC_ROUTES: Route[] = ["welcome", "signup", "login", "onboarding", "how"];
const SIGN_ROUTES: Route[] = ["watch", "quiz", "check", "coach"];

export default function App() {
  const requested = useRoute();
  const account = useAccount();
  const { state, setState, email } = account;
  const { name, active, lessons } = state.progress;
  const current = lessons[active];

  let route = requested;
  if (!email && !PUBLIC_ROUTES.includes(route)) route = "login";
  if (!email && route === "signup") {
    const profile = { ...state.profile, email };
    const complete = QUESTIONS.every((question) =>
      (question.when && !question.when(profile)) || question.options.some((option) => option.value === profile[question.key]),
    );
    if (!complete) route = "onboarding";
  }
  if (email && ["welcome", "signup", "login"].includes(route)) route = "lessons";
  if (email && SIGN_ROUTES.includes(route) && current.pos === current.queue.length) {
    route = current.queue.length ? "done" : "name";
  }
  if (email && requested === "done") {
    if (!current.queue.length) route = "name";
    else if (current.pos < current.queue.length) route = "watch";
  }

  useEffect(() => {
    if (account.ready && !account.loadError && route !== requested && readRoute() === requested) go(route);
  }, [route, requested, account.ready, account.loadError]);

  const funnel = {
    profile: { ...state.profile, email },
    update: ({ email: _email, ...patch }: Partial<Profile>) =>
      setState((st) => ({ ...st, profile: { ...st.profile, ...patch } })),
    authenticate: account.authenticate,
    logout: account.logout,
    dirty: account.dirty,
  };

  const lesson = useMemo<Lesson>(() => {
    const item = current.queue[current.pos];
    const change = (update: (st: LessonProgress) => LessonProgress) =>
      setState((st) => {
        const { active, lessons } = st.progress;
        return { ...st, progress: { ...st.progress, lessons: { ...lessons, [active]: update(lessons[active]) } } };
      });
    const miss = (st: LessonProgress): LessonProgress =>
      st.missedAt === st.pos || st.queue[st.pos] === undefined
        ? st
        : {
            ...st,
            queue: st.queue.length < 500 ? reinsert(st.queue, st.pos) : st.queue,
            missedAt: st.pos,
            missed: st.missed.includes(st.queue[st.pos]) ? st.missed : [...st.missed, st.queue[st.pos]],
          };
    const next = (st: LessonProgress): LessonProgress => {
      if (st.pos >= st.queue.length) return st;
      const pos = st.pos + 1;
      return { ...st, pos, tries: 1, hinted: false, missedAt: null, completed: st.completed || pos === st.queue.length };
    };
    return {
      lesson: active,
      openLesson: (id: LessonNumber) => {
        setState((st) => st.progress.active === id ? st : { ...st, progress: { ...st.progress, active: id } });
        const target = lessons[id];
        if (target.queue.length && target.pos === target.queue.length) go("done");
        else go(id === 1 && target.pos === 0 && !target.missed.length && !Object.keys(target.stars).length ? "name" : "watch");
      },
      name,
      setName: (name) => setState((st) => ({
        ...st, progress: { ...st.progress, name, active: 1, lessons: { ...st.progress.lessons, 1: freshLesson(name, 1) } },
      })),
      letters: lettersOf(name),
      queue: current.queue,
      pos: current.pos,
      item,
      isFinale: active === 1 && item === FINALE,
      isLast: current.pos === current.queue.length - 1,
      tries: current.tries,
      hinted: current.hinted,
      stars: current.stars,
      progress: lessons,
      pass: () => {
        if (item === undefined) return 0;
        const earned = starsFor(current.tries, current.hinted, current.missed.includes(item));
        change((st) => ({ ...st, stars: { ...st.stars, [item]: Math.max(st.stars[item] ?? 0, earned) } }));
        return earned;
      },
      miss: () => change(miss),
      next: () => change(next),
      retry: () => change((st) => ({ ...st, tries: Math.min(st.tries + 1, 10000), hinted: true })),
      skip: () => change((st) => next(miss(st))),
      reset: () => change((st) => ({ ...freshLesson(name, active), completed: st.completed, stars: st.stars })),
    };
  }, [active, current, lessons, name, setState]);

  // On route change: set the tab title and move focus to the screen's heading.
  const firstRender = useRef(true);
  useEffect(() => {
    if (!account.ready || account.loadError) return;
    document.title = `${TITLES[route]} — ILY`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [route, current.pos, account.ready, account.loadError]);

  if (!account.ready || account.loadError) {
    return (
      <div className="page">
        <main className="main funnel" aria-live="polite">
          <p className="lead">{account.loadError ? "Couldn't load ILY. Try again." : "Loading ILY…"}</p>
          {account.loadError && <button className="btn-primary" onClick={() => location.reload()}>Reload</button>}
        </main>
      </div>
    );
  }

  const Screen = SCREENS[route];
  return (
    <FunnelContext.Provider value={funnel}>
      <LessonContext.Provider value={lesson}>
        <div className="page">
          {/* Keyed so per-screen state (quiz picks, check verdict) resets for each item. */}
          {account.saveError && (
            <div className="wrap">
              <p className="field-error" role="alert">{account.saveError.message}</p>
              <button
                className="btn-text"
                onClick={account.saveError.reload ? () => location.reload() : account.retrySave}
              >
                {account.saveError.reload ? "Reload saved progress" : "Retry save"}
              </button>
            </div>
          )}
          <Screen key={`${route}-${active}-${current.pos}`} />
        </div>
      </LessonContext.Provider>
    </FunnelContext.Provider>
  );
}
