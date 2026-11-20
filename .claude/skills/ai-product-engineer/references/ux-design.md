# UX/UI of a feature, built with AI

Use when the epic changes a screen, a flow, onboarding, a paywall or a form, or when the team builds the UI with an agent (Claude Design, Claude Code, Figma through MCP). Source: L17 (audio and 102 slides).

## 1. Why it matters now [L17 00:02–00:08] [L17 p.2, p.6–11]
- "AI removed the tool barrier, not the decision barrier." [p.2]
- Building got cheap: ~600k new App Store apps in 2025 (+30%), Q1 2026 +84% year on year; yet the revenue top-5 per category barely moved, and the number of new apps that reach even 10 ratings in 3 months is the same as in 2024. [p.6–9] "What sets a product apart now is the quality of the experience." [p.10]
- The engineer's edge is the decisions: what to show first, what to remove, where to stop the user. Without quality criteria the agent produces the average. [p.11] The slide says "code is no longer an advantage"; the lecturer said orally that code still is one, because scaling a vibe-coded product is hard. [L17 00:06]

## 2. Order of work [L17 00:11–00:13] [L17 p.15–16]
Task (what the user wants and why) → flow (steps from entry to result) → screen (**one main action** per step) → states (empty, loading, error, success) → check (heuristics, contrast, real data). UX asks "does it work" (task, steps, what is seen first, where one can err); UI asks "how does it look" (hierarchy, type, colour, spacing, element states).

## 3. Review checklist [L17 00:12–00:32] [L17 p.17–31]
- Nielsen's 10 heuristics: visibility of system status; match the real world (user words, not `Error 0x80040`); user control and freedom (undo, exit — or deliberately not, which moves conversion); consistency; error prevention; recognition over recall; flexibility (shortcuts for experts); aesthetic and minimal (**one CTA**); help users recover from errors (say what happened and how to fix it, highlight on the user's side); help in place. [p.17–27]
- Defaults steer behaviour: a reference app pre-selects the annual plan and hides the others behind "View all plans" — up to 20% annual subscriptions. That is a dark pattern; count the risk metrics next to it (cancellations after trial, complaints). [L17 00:16–00:20]
- Four states teams forget: empty (say what to do first), loading (skeleton or progress, not a white screen), error (what happened and how to fix it), success (confirmation and the next step). [p.28]
- Six UX laws: Fitts (bigger and closer is faster to hit), Hick (more options, slower choice), Jakob (people expect your product to work like the others), Miller (memory holds little — group), proximity (near = one whole), von Restorff (the different one is remembered). [p.29]
- Turn the theory into a review prompt: "Check this screen against Nielsen's 10 heuristics and the UX laws. Return the violations by priority, each with a concrete fix." [p.31]

## 4. Mobile is a separate layout [L17 00:31–00:37] [L17 p.32–37]
- Finger not cursor, one focus per screen, main action at the bottom, the platform's native navigation; desktop has hover, keyboard, density, columns, breakpoints. [p.34]
- Touch targets ≥ 44 pt (iOS) / 48 dp (Android); main action in the thumb zone; one column — rebuild the hierarchy, don't squeeze the desktop; native patterns (bottom sheet, tab bar, system gestures). Use Material Design 3 and Apple HIG for mobile. [p.35–36]

## 5. Briefing an AI design tool [L17 00:36–00:43] [L17 p.39–46]
- Six-part brief: audience (who, what they already know), task on this screen, platform and screen size, the one main action, references (real product screens, `DESIGN.md`), states and limits (empty, error, long texts). [p.41]
- Bad: "Make a nice landing for a CV builder." Good: "Resume editor screen for a junior developer, desktop. Main action: download PDF. Style from DESIGN.md. Show the states: empty, filled, error." [p.42]
- Iterate: ask for 2–3 variants and compare directions; edit by point ("reduce the card padding", not "make it better"); never regenerate everything — it loses decisions already taken; write every accepted decision into `DESIGN.md`. [p.43] "The fifth iteration is better than the first." The lecturer dictates the brief in her own language and lets Claude turn it into an English prompt. [L17 01:43–01:49]
- Where to design depends on where the system lives: in code → Claude Design or Claude Code on the repo; in Figma with a designer → Claude in Figma through MCP (keeps variables and components); outsourced layouts → Claude creates editable Figma frames through MCP. [p.44] "Claude Design, then export to Figma" gives layers detached from components and needs a third-party bridge. [p.45] Orally the lecturer said Claude can export layouts to Figma [L17 00:42]; the slide's point stands for keeping the link to components.
- **One source of truth — the code**; Figma syncs from it. Keep both A/B variants: in git and preview deploys (the reliable history), and in Figma as a visual archive. [p.46, p.49]

## 6. Design system as the agent's context [L17 00:43–00:50] [L17 p.48–59]
- Tokens (colour, type, spacing, radii, shadows) → components with all states → patterns (forms, navigation, paywall, onboarding). [p.48]
- Take a ready library rather than build one: the code is in your repo, tokens are CSS variables to repaint, the model knows it and generates more stably, and it ships agent instructions. [p.53] Five ready for vibe coding: shadcn (MCP, CLI, registry, llms.txt), createui (Figma + React/Tailwind/Radix, MCP, skills.md), Untitled UI React (MCP, CLAUDE.md/AGENTS.md), MUI (MCP; hard to pull away from the Google look), HeroUI (own MCP). [p.52]
- `DESIGN.md`: principles (3–5 one-sentence rules), colour (palette, semantic roles, contrast), typography (font, size scale, weights), shape (radii, borders, shadows), space (grid step, paddings), icons (set, stroke, fill), **prohibitions** — what not to do so the model doesn't drift to its default. [p.54] The slide calls `DESIGN.md` an open spec from Google Labs (April 2026). [p.65]
- Legacy UI (e.g. on Bootstrap) is not rewritten: the agent extracts its tokens and rules into `DESIGN.md` on top of the new library, and old screens migrate gradually. [L17 00:44]
- Restyle a ready system: 5–10 reference screens of one style → `DESIGN.md` as rules, not adjectives → the same rules as CSS variables → point fixes where tokens aren't enough → a showcase page with every component. [p.55]
- Make it AI-friendly: remove duplicate tokens (fewer tokens, fewer invented ones); semantic names (`color-text-secondary`, not `gray-500`); themes as value sets of the same tokens; one line in `AGENTS.md`: "read DESIGN.md before any UI work". [p.56]
- Fonts: Google Fonts, check Cyrillic support, one or two families, 4–5 sizes in tokens. Icons: Material Symbols, one weight, fill only for the active state, one style. [p.57–58]
- "Without a system every generation drifts. The system is the context for AI." [p.59]

## 7. Signs that AI made it [L17 00:55–01:05] [L17 p.66–80]
Purple-blue gradient everywhere; one characterless font; emoji and "sparkles" instead of icons; template landing (centred hero, three cards, testimonials, CTA strip); cards everywhere, card in card; same big radii, deep shadows and glass; everything equally important (several primary buttons, all bold caps); invented round numbers and testimonials without surnames; only the ideal filled state; desktop squeezed into mobile with random spacing; a pill badge over every heading; after 4 seconds it's unclear what the product offers (the lecturer cites "a Google study" for the 4 seconds). [p.67–78] [L17 00:57]
Five steps to hide it: references before the prompt; the design system as context; `DESIGN.md` with the prohibitions; a brief instead of "make it pretty"; review against this checklist. [p.79] In the live demo the agent partly ignored the `DESIGN.md` rules (badges, frame in frame), so the review must be a separate step; a `DESIGN.md` built from one competitor produced a copy of it — use several references. [L17 01:36–01:48] Review prompt from the demo: "Check against the UX laws and best UX practices", with design-critique and heuristics skills; the agent then offers to fix all, the first 7 or the first 21 findings. [L17 01:48–01:49] "AI shows where there were no decisions." [p.80]

## 8. Design and A/B metrics [L17 01:04–01:23] [L17 p.82–92]
| Change | Metric | Example |
|---|---|---|
| CTA and screen hierarchy | CTR, conversion to the action | one main button instead of three |
| Onboarding | activation | fewer steps to first value |
| Paywall | trial rate, purchase rate | plan order, stress the benefit |
| Forms | completion rate | fewer fields, hints in the field |
| Empty states | day-1 retention | explain what to do next |

[p.82]
- Design hypothesis: "If we change [element] for [segment], [metric] grows by [__%], because [reason from research or data]." "A hypothesis without a reason is guessing." [p.83] Same shape as `hypotheses.md`.
- Testing rules: one hypothesis per test; sample size and duration fixed before launch; guardrail and risk metrics (conversion up — and refunds, churn?); don't stop early, the first days are noise; keep both variants. [p.91] See `experiments.md`.
- AI makes variants in hours from the system's components, and with a system the variants differ only by the hypothesis — a clean difference. [p.92]
- Cases: simplified navigation in a CV builder → +5% builder completion [p.88]; a music generator's landing → about 12% landing-to-trial conversion (the slide hides it as "+XX") [L17 01:07]. Regional tests vary compliance tier, monetization model (subscription vs transactional, e.g. pay per file of ~50 cents in some markets) and local formats, not only the UI. [p.90] [L17 01:19]

## 9. MVP pipeline in 11 steps [L17 00:50–00:55, 01:23–01:50] [L17 p.95–97]
1. Competitors by traffic — an agent with a browser in Similarweb → top-5 with numbers.
2. Competitors by UI/UX — another agent → 3–5 strong by design.
3. Flow screenshots — an agent walks onboarding and paywall → a folder of screens by step.
4. Competitor analysis and MVP scope — from steps 1–3 → feature matrix and MVP scope.
5. Pattern references — Mobbin → 5–10 screens per flow.
6. Colour analysis — competitors' logos on Itten's colour wheel → the niche palette, the free spot, the style.
7. `DESIGN.md` — from steps 4–6.
8. Design system — a ready repo plus tokens.
9. Screens — Claude Design with that system.
10. Code and publish — Claude Code, then Vercel → a live URL.
11. Feedback — 3–5 users and the checklist → second iteration.

Connectors for the chain: Similarweb (traffic), Mobbin (references), Figma (design), Vercel (live URL), Amplitude (funnels, retention, A/B). [p.61] Claude Code plugins: `frontend-design`, `figma`, Playwright (the agent opens the page and sees it), Vercel; skills for design critique, accessibility (WCAG), UX copy, handoff, design-system audit. [p.63–64] Reference sources: Mobbin, Dribbble, designbookmark. [p.97]
- In the demo the traffic step was done by hand: Similarweb is a paid shared account without a Claude integration; for mobile apps use Sensor Tower. [L17 00:50–00:52, 01:28] Connect Amplitude only when the events are clean, without duplicates — otherwise the agent reads wrong numbers. [L17 00:53] The demo did not show the Vercel and feedback steps, and its oral step order differs from the slide.

Review check: the one main action per screen; all four states drawn; the brief's six parts; a `DESIGN.md` with prohibitions; the metric each visible change should move, with a reason; both variants kept.
