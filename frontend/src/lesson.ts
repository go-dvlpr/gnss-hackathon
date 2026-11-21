import { createContext, useContext } from "react";

export type Lesson = {
  name: string;
  setName: (name: string) => void;
  letters: string[];
};

export const DEFAULT_NAME = "Lily";

// Letters A–Z only. J and Z move, so the design teaches them later (still shown for now).
export function lettersOf(name: string): string[] {
  return name.toUpperCase().replace(/[^A-Z]/g, "").split("");
}

export const LessonContext = createContext<Lesson>({
  name: DEFAULT_NAME,
  setName: () => {},
  letters: lettersOf(DEFAULT_NAME),
});

export const useLesson = () => useContext(LessonContext);
