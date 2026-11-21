import { DEFAULT_NAME, WORDS, queueOf } from "./lesson";
import type { Profile } from "./funnel";

export type LessonNumber = 1 | 2;

export type LessonProgress = {
  queue: string[];
  pos: number;
  tries: number;
  hinted: boolean;
  missedAt: number | null;
  missed: string[];
  stars: Record<string, number>;
  completed: boolean;
};

export type Progress = {
  active: LessonNumber;
  name: string;
  lessons: Record<LessonNumber, LessonProgress>;
};

export type AccountState = {
  profile: Omit<Profile, "email">;
  progress: Progress;
};

export function freshLesson(name: string, lesson: LessonNumber): LessonProgress {
  return {
    queue: lesson === 2 ? WORDS : queueOf(name),
    pos: 0,
    tries: 1,
    hinted: false,
    missedAt: null,
    missed: [],
    stars: {},
    completed: false,
  };
}

export function initialState(name = DEFAULT_NAME): AccountState {
  return {
    profile: {},
    progress: { active: 1, name, lessons: { 1: freshLesson(name, 1), 2: freshLesson(name, 2) } },
  };
}

const LEGACY_KEY = "ily.lesson.v1";
const isSign = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[A-Z]|ILY|HELLO|YES|NO|THANKYOU)$/.test(value);

export function legacyProgress(): Progress {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return initialState().progress;
    const saved = JSON.parse(raw);
    if (typeof saved?.name !== "string" || saved.name.length > 80 || !Array.isArray(saved.queue) ||
        saved.queue.length > 500 || !saved.queue.every(isSign) || !Number.isInteger(saved.pos) ||
        saved.pos < 0 || saved.pos > saved.queue.length) return initialState().progress;

    const progress = initialState(saved.name).progress;
    const active = saved.lesson === 2 ? 2 : 1;
    const stars = Object.entries(saved.stars ?? {}).filter(
      ([id, count]) => isSign(id) && typeof count === "number" && Number.isInteger(count) && count >= 0 && count <= 3,
    ) as [string, number][];
    progress.active = active;
    progress.lessons[active] = {
      ...progress.lessons[active],
      queue: saved.queue,
      pos: saved.pos,
      stars: Object.fromEntries(stars),
      completed: saved.queue.length > 0 && saved.pos === saved.queue.length,
      missed: Array.isArray(saved.missed) ? [...new Set<string>(saved.missed.filter(isSign))] : [],
    };
    if (active === 2) {
      progress.lessons[1].stars = Object.fromEntries(stars.filter(([id]) => id.length === 1));
    }
    return progress;
  } catch {
    return initialState().progress;
  }
}

export function clearLegacyProgress() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Storage may be disabled.
  }
}
