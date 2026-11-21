import { createContext, useContext } from "react";

export type Reason = "loved" | "self" | "curious" | "work" | "other";
export type Who = "partner" | "child" | "parent" | "sibling" | "friend" | "other";

export type Profile = {
  email: string;
  reason?: Reason;
  who?: Who;
  /** First name for lesson 1. */
  name?: string;
  level?: string;
  goal?: string;
  source?: string;
};

export type Funnel = {
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
};

export type Option = { value: string; label: string; hint?: string };
export type Question = {
  key: "reason" | "who" | "name" | "level" | "goal" | "source";
  title: string;
  lead?: string;
  options: Option[];
  /** Also ask for the first name used in lesson 1. */
  askName?: { label: string };
  /** Asked only when this returns true. */
  when?: (p: Profile) => boolean;
};

export const QUESTIONS: Question[] = [
  {
    key: "reason",
    title: "Why are you learning ASL?",
    lead: "We build the first lesson around your answer.",
    options: [
      { value: "loved", label: "Someone I love is Deaf or hard of hearing" },
      { value: "self", label: "I'm Deaf or hard of hearing myself" },
      { value: "curious", label: "I'm curious about ASL and the Deaf community" },
      { value: "work", label: "For work or school" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    key: "who",
    title: "Who are you learning for?",
    lead: "Lesson 1 is their name, letter by letter.",
    when: (p) => p.reason === "loved",
    askName: { label: "Their first name" },
    options: [
      { value: "partner", label: "My partner" },
      { value: "child", label: "My child" },
      { value: "parent", label: "My parent" },
      { value: "sibling", label: "My brother or sister" },
      { value: "friend", label: "A friend" },
      { value: "other", label: "Someone else" },
    ],
  },
  {
    key: "name",
    title: "What's your name?",
    lead: "Lesson 1 is your name, letter by letter.",
    when: (p) => !!p.reason && p.reason !== "loved",
    options: [],
    askName: { label: "Your first name" },
  },
  {
    key: "level",
    title: "How much ASL do you know?",
    options: [
      { value: "none", label: "Nothing yet" },
      { value: "few", label: "A few signs" },
      { value: "alphabet", label: "I can fingerspell" },
      { value: "conversation", label: "I can hold a simple conversation" },
    ],
  },
  {
    key: "goal",
    title: "How much time a day?",
    lead: "You can change this later.",
    options: [
      { value: "5", label: "5 minutes", hint: "Casual" },
      { value: "10", label: "10 minutes", hint: "Regular" },
      { value: "15", label: "15 minutes", hint: "Serious" },
      { value: "20", label: "20 minutes", hint: "Intense" },
    ],
  },
  {
    key: "source",
    title: "How did you hear about ILY?",
    options: [
      { value: "tiktok", label: "TikTok" },
      { value: "instagram", label: "Instagram" },
      { value: "youtube", label: "YouTube" },
      { value: "search", label: "Google or another search" },
      { value: "friend", label: "A friend or family member" },
      { value: "deaf-community", label: "A Deaf school, club or community" },
      { value: "other", label: "Somewhere else" },
    ],
  },
];

const WHO_LABEL: Record<Who, string> = {
  partner: "partner",
  child: "child",
  parent: "parent",
  sibling: "brother or sister",
  friend: "friend",
  other: "loved one",
};

/** "your partner", or a neutral phrase when we don't know who. */
export const lovedOne = (p: Profile) => (p.who ? `your ${WHO_LABEL[p.who]}` : "the one you love");

export const FunnelContext = createContext<Funnel>({ profile: { email: "" }, update: () => {} });
export const useFunnel = () => useContext(FunnelContext);

// HACK: funnel events go to the console until we pick an analytics tool.
export function track(event: string, props: Record<string, unknown> = {}) {
  console.info("[funnel]", event, props);
}
