import { useMemo, useState, type ComponentType } from "react";
import { useRoute, type Route } from "./router";
import { DEFAULT_NAME, LessonContext, lettersOf } from "./lesson";
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

export default function App() {
  const route = useRoute();
  const [name, setName] = useState(DEFAULT_NAME);
  const lesson = useMemo(() => ({ name, setName, letters: lettersOf(name) }), [name]);
  const Screen = SCREENS[route];
  return (
    <LessonContext.Provider value={lesson}>
      <div className="page">
        <Screen />
      </div>
    </LessonContext.Provider>
  );
}
