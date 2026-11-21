import { useEffect, useState } from "react";

// HACK: tiny hash router so Vercel needs no rewrites and we add no dependency.
export const ROUTES = [
  "welcome",
  "signup",
  "login",
  "onboarding",
  "lessons",
  "name",
  "watch",
  "quiz",
  "check",
  "coach",
  "done",
  "paywall",
  "how",
] as const;

export type Route = (typeof ROUTES)[number];

export const href = (route: Route) => `#/${route}`;

export function readRoute(): Route {
  const r = window.location.hash.replace(/^#\/?/, "");
  return (ROUTES as readonly string[]).includes(r) ? (r as Route) : "welcome";
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

export function go(route: Route) {
  window.location.hash = href(route);
}
