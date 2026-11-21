import { createContext, useContext } from "react";

export const DEFAULT_NAME = "Lily";
export const FINALE = "ILY";
/** Lesson 2: the words asl-core can recognise (GOODBYE, PLEASE and SORRY are not there yet). */
export const WORDS = ["HELLO", "YES", "NO", "THANKYOU", "ILY"];
const LABELS: Record<string, string> = { THANKYOU: "THANK YOU", ILY: "I LOVE YOU" };
export const labelOf = (id: string) => LABELS[id] ?? id;
export const isWord = (id: string) => id.length > 1;

export type Lesson = {
  /** 1 = the letters of the name, 2 = words. */
  lesson: 1 | 2;
  /** Start lesson 2 from its first word. */
  startWords: () => void;
  name: string;
  setName: (name: string) => void;
  /** Teachable unique letters of the name, in order (no J or Z). */
  letters: string[];
  /** Letters, re-inserted misses, then the finale "ILY". */
  queue: string[];
  pos: number;
  /** Current item, or undefined when the lesson is over. */
  item: string | undefined;
  isFinale: boolean;
  isLast: boolean;
  /** Camera tries for the current item, starting at 1. */
  tries: number;
  /** The coach gave a hint for the current item. */
  hinted: boolean;
  stars: Record<string, number>;
  /** Record a correct sign; returns the stars earned for it. */
  pass: () => number;
  /** Mark the current item missed: it comes back after two others. */
  miss: () => void;
  next: () => void;
  retry: () => void;
  skip: () => void;
  reset: () => void;
};

// Letters A–Z only. J and Z move, so we teach them later.
export const isTeachable = (l: string) => /^[A-Z]$/.test(l) && l !== "J" && l !== "Z";

export function allLettersOf(name: string): string[] {
  return name.toUpperCase().replace(/[^A-Z]/g, "").split("");
}

export function lettersOf(name: string): string[] {
  return [...new Set(allLettersOf(name).filter(isTeachable))];
}

export function queueOf(name: string): string[] {
  const letters = lettersOf(name);
  return letters.length ? [...letters, FINALE] : [];
}

/** Where a missed item goes: after two others, but always before the finale. */
export function reinsert(queue: string[], pos: number): string[] {
  const item = queue[pos];
  if (item === undefined || item === FINALE) return queue;
  const finaleAt = queue.lastIndexOf(FINALE);
  const at = Math.min(pos + 3, finaleAt === -1 ? queue.length : finaleAt);
  return [...queue.slice(0, at), item, ...queue.slice(at)];
}

/** Stars per sign: ★ first correct; ★★ correct on the first try without a hint. */
export const starsFor = (tries: number, hinted: boolean, missed: boolean) =>
  tries === 1 && !hinted && !missed ? 2 : 1;

const HOW_TO: Record<string, [long: string, short: string]> = {
  L: [
    "Point your index finger up and stick your thumb straight out to the side. Fold the other fingers down.",
    "Index finger up, thumb out to the side.",
  ],
  I: [
    "Make a fist and raise only your little finger. Your thumb rests across the folded fingers.",
    "Fist, little finger up.",
  ],
  Y: ["Stick out your thumb and little finger. Fold the three middle fingers down.", "Thumb and little finger out."],
  ILY: [
    "Thumb, index and little finger out; middle and ring fingers down.",
    "Thumb, index and little finger out; middle and ring fingers down.",
  ],
  HELLO: [
    "Flat hand at your forehead, like a salute, then move it out and away from your head.",
    "Flat hand from your forehead, out to the side.",
  ],
  YES: ["Make a fist and nod it up and down from the wrist, like a nodding head.", "Fist, nod it from the wrist."],
  NO: [
    "Open your index and middle fingers, then snap them shut onto your thumb.",
    "Index and middle fingers snap onto the thumb.",
  ],
  THANKYOU: [
    "Fingertips of your flat hand at your chin, then move the hand forward and down.",
    "Flat hand from your chin, forward and down.",
  ],
};

// HACK: how-to copy exists only for L, I, Y and ILY (the demo name); other letters get a placeholder.
export const howTo = (item: string, short = false) => HOW_TO[item]?.[short ? 1 : 0] ?? "[How to make the sign]";

// HACK: look-alikes are hand-picked; real ones come from the hard pairs of the eval set.
const LOOK_ALIKES = ["D", "A", "S", "E", "M", "N", "T", "L", "I", "Y", "B", "C", "O"];

// Hard pairs from CLAUDE.md go first among the wrong options.
const WORD_LOOK_ALIKES: Record<string, string> = { HELLO: "THANKYOU", THANKYOU: "HELLO", YES: "NO", NO: "YES", ILY: "YES" };

/** Three quiz options: the answer, two other letters of the name (or words), padded with look-alikes. */
export function quizOptions(item: string, letters: string[], pos: number): string[] {
  const pool = isWord(item) ? [WORD_LOOK_ALIKES[item], ...WORDS] : [...letters, ...LOOK_ALIKES];
  const others = pool.filter((l, i, all) => l !== item && all.indexOf(l) === i);
  const opts = [item, ...others.slice(0, 2)];
  // HACK: deterministic rotation so the answer isn't always first.
  const k = pos % opts.length;
  return [...opts.slice(k), ...opts.slice(0, k)];
}

const noop = () => {};
export const LessonContext = createContext<Lesson>({
  lesson: 1,
  startWords: noop,
  name: DEFAULT_NAME,
  setName: noop,
  letters: lettersOf(DEFAULT_NAME),
  queue: queueOf(DEFAULT_NAME),
  pos: 0,
  item: queueOf(DEFAULT_NAME)[0],
  isFinale: false,
  isLast: false,
  tries: 1,
  hinted: false,
  stars: {},
  pass: () => 0,
  miss: noop,
  next: noop,
  retry: noop,
  skip: noop,
  reset: noop,
});

export const useLesson = () => useContext(LessonContext);
