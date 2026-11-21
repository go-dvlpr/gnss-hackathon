import { useEffect, useState } from "react";

// HACK: tiny hash router so Vercel needs no rewrites and we add no dependency.
export const ROUTES = [
  "lessons",
  "name",
  "watch",
  "quiz",
  "check",
  "coach",
  "done",
  "paywall",
] as const;

export type Route = (typeof ROUTES)[number];

export const href = (route: Route) => `#/${route}`;

function readRoute(): Route {
  const r = window.location.hash.replace(/^#\/?/, "");
  return (ROUTES as readonly string[]).includes(r) ? (r as Route) : "lessons";
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
