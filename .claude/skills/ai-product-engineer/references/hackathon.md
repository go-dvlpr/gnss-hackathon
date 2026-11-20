# Hackathon: from idea to a pitch in one day

Use on the hackathon day (Sat 2026-11-21, 10:30–20:00): picking the idea, cutting the MVP, choosing the one metric, the money line, the pitch. The team's working rules are in the repo's `CLAUDE.md`; they win over anything here. The engineering side (agent or workflow, evals, RAG, secrets, parallel agents) is `ai-agent-engineer` `references/hackathon.md`. The other files in this folder hold the full frameworks; this file only says what to take from them in a day.

Tags are the same as in `SKILL.md`; lecturers and titles are in `LOCAL.md`. `(own)` = not from a lecture. `(own, Battle)` = the rules written for the 10-minute AI Builder Battle (L12, no slides or notes).

## 1. Pick the idea: 45 minutes, not three hours

1. **Start from a problem, not a technology.** "Any tool starts with a problem, not a technology." [L9 p.21] An idea that opens with "an agent on Claude that…" and names no loss is not ready. [L9 00:25]
2. **Three filters**, one line each per idea [L5 00:11–00:14]: whose pain is it (the author's own pain rarely matches the users'); does it move the goal; is it timely.
3. **Look for something that exists.** No ready tool at all → "a signal that doing it now is very hard". [L9 p.21] A crowded market is a good sign: demand is already proven. [PMF 00:12–00:14] Do not assume you are smarter than 25 competitors; first understand why they built it that way. [PMF 00:25]
4. **ICE, each of Impact / Confidence / Ease from 1 to 10.** "A sifting tool, not exact numbers"; its main use is forcing an honest "confidence is low, we have not seen the pain". [L5 p.40] The slides show no formula for a total score, so compare the three numbers side by side. [L5 p.41] For today read Ease as "the demo path works by 14:00". (own)
5. **Take the top one and stop.** Of 10 hypotheses a team strongly believes in about 3 and tests those. [L2 00:53–00:54] A team with many focuses finishes none. [PMF 00:49–00:51]

An LLM helps to generate ideas but invents pains and flatters. Ask for a source for every pain, then ask it to break the idea. [L5 00:49–01:00] Prompts are in §8.

## 2. Frame it and write it into `CLAUDE.md`

The repo's `CLAUDE.md` Project section is the "epic" for the day. Fill it before anyone writes code; agents read it first.

- **Problem statement — "a few sentences about the problem without a word about the solution"** [L9 p.24]: who suffers; what the problem is; evidence (a case, a number, a lost deal — not "we think"); what it costs in money.
- **Hypothesis**, the four-slot template [L5 00:17]: «Ми віримо, що зміна **X** для сегменту **Y** призведе до результату **Z**, бо **O**.» Rationale = the mechanism, why it should work. [W6 00:22] An empty slot is a question for the team, not something to invent. Full rules: `hypotheses.md`.
- **JTBD line** for the demo story: "Коли [ситуація], хочу [мотивація], щоб [результат]." [L5 p.38]
- You cannot validate with users today. Say so in the pitch and name the cheapest next check from the ladder (research → fake door → prototype → A/B). [L5 p.56] "Until someone pays, you have proven nothing." [PMF 00:42]

## 3. Cut the MVP to one demo path

- The MVP is one courier carrying one thing from A to B: every version works end to end. Do not assemble the truck part by part. [PMF 00:28–00:31] [PMF p.17]
- **MoSCoW** [PMF p.18]: Must — "the project cannot do without them"; Should — "must-haves over the long run"; Could — "low-cost tweaking"; Won't — "get back to them at better days". With competitors at hand, the audio rule: a feature all have → Must, ~8 of 10 → Should, ~5 → Could, 1–2 → Won't. [PMF 00:31–00:38]
- For today (own): **Must = the steps of the demo path, nothing else.** Should = what makes the path convincing (real data, the four UI states). Could = only after the 14:00 checkpoint. Won't = write the list down, it is a pitch slide ("next steps").
- Not in an MVP, per the lecture's slide: email and push notifications, personal recommendations, gamification, localization, a referral program. [PMF p.24–25] Add for the day (own): login, payments, settings, an admin panel — mock them and mark with `HACK:`.
- Source conflict: L11 says cache, pagination, tests and localization now cost hours and should be done at once [L11 p.26] [L11 00:50]; PMF says the limit is the team's focus, not the effort. [PMF 00:49–00:51] For one day the focus rule wins. (own)
- **A stop bar before starting.** "MVP is constant validation of the idea", with a number at which you stop. [L9 01:15–01:17] [L9 p.68] The case: a fully automatic creative review needed 98 of 100 test cases, reached ~78% after two months, and the team stopped. [L9 p.64–65] For today: if the core step does not work on the golden set by 14:00, drop to a simpler shape or a narrower case. (own)
- Experiment first, clean up after: throwaway code is fine for a test. [L2 00:22–00:23]

## 4. The one metric the demo proves

- One primary metric, never changed after the fact, plus what must not get worse. [L7 p.32] Full rules: `metrics.md`.
- A demo cannot show retention or revenue. Pick from what a stage can show (own):
  - the **value action** done live, once, with a time ("from upload to answer in N seconds") — engagement is repeated value, not logins [L7 00:33–00:43];
  - for an LLM feature, the **pass rate on the golden set**: "evals are the success metric" (`ai-features.md` §2) [L14 00:32–00:55]. Say the set size and the number of runs; a low first score is normal — the lecture's assistant started at 36%. [L14 00:44]
  - time to answer and cost per request, if users would see them. [L14 00:54]
- Name the product metric you would track after the demo and the aha moment you would look for (target action → behaviour → count + time window). [L7 p.36] Do not present the public aha formulas as benchmarks: "find your own formula in the data".
- Every number on a slide is measured today or labelled an assumption. The more precise an LLM's number, the less to trust it. [L5 00:49–01:00]

## 5. One money line for the pitch

Speak money: "a manager buys a solved problem with a number, not a technology". [L9 p.26] Build one line from whichever fits; details in `economics.md` and `business-case.md`.

- **Cost of the problem**: time or money lost per user or per company, as a share, not "$500 lost". [L9 00:24]
- **Unit economics**: one unit must earn more than it costs. [PMF 01:12] For an AI product the cost under the hood is tokens: "number and size of requests → tokens → money", plus infrastructure and third-party services. [L9 p.22] Measure tokens per request on your own runs and multiply by the provider's price; do not guess. (own)
- **LTV:CAC 3:1** is the lecturers' target; neither explained where 3 comes from. [UE 00:19] [PMF 01:16] A worked example from the slides: an install costs $3, the user makes 4 transactions of $0.25 in 30 days, payback comes around month 4. [PMF p.55–56]
- **Acquisition chain** to reason about CAC: CPM $10 → CTR 1% → CPC $1 → CR 2% → CPA $50; doubling CTR or CR halves CPA. These are the slide's illustration, not a benchmark. [L8 p.56–57]
- **Market**: competitive, large, growing, not a monopoly, the team knows the field. [PMF 00:12–00:16] Take traffic and revenue from a tool (Similarweb for web, Sensor Tower or AppMagic for apps), with its limits: it does not see web payments. [PMF 01:02] An agent with a browser can pull the top-5 competitors with numbers. [L17 p.95]
- **Why not buy**: name what you compared. [L9 p.25] If a ready tool nearly fits, L9 says buy; L11 says build is now cheap. Say which view you take. (`business-case.md`)

## 6. Pitch structure

The lecture splits it in two; keep the order. [L9 p.24–26] [L9 00:23–00:25]

1. **Problem statement** (no solution yet): who suffers → the problem → evidence → its cost in money.
2. **Pitch**: the solution in one sentence → **the live demo** (own: put it here) → effect (money and metrics) → cost and effort (money, time, people) → risks and a small first step ("an MVP for one team") → why not buy → the ask.

- The whole problem statement fits in two minutes. [L9 00:23]
- The ask on a hackathon is small and concrete: what you would do next week with what. (own)
- After 4 seconds of the first screen it must be clear what the product offers. [L17 p.78]
- "Code is worth nothing. A solved problem with a number is." [L9 p.79]

## 7. UI for the demo

Use `ux-design.md`; do not repeat it here. The four things that decide a demo: one main action per screen (§2), the four states — empty, loading, error, success (§3), a six-part brief instead of "make it pretty" (§5), and the list of signs that AI made it (§7). A ready component library plus a short `DESIGN.md` with prohibitions keeps several agents' screens alike (§6). The 11-step MVP pipeline (§9) is the lecture's own one-day route from competitors to a live URL.

From the Battle (own, Battle): a clean layout, a clear title and **one "wow" interaction** on the demo path beat five half-finished screens; fake data is inline and deterministic, so the rehearsal and the demo look the same.

## 8. Timeline 10:30–20:00 (own)

The lectures give no schedule; this one is ours. Shift it once the real demo slot is known. The checkpoints carry the lecture rules.

| Time | What | Checkpoint |
|---|---|---|
| 10:30–11:15 | Ideas → three filters → ICE → pick one (§1) | `CLAUDE.md` Project: idea, hypothesis, metric, demo path, stop bar |
| 11:15–12:00 | Stack, one-command run, deploy URL, empty slice on `main`; split the work; one person writes the 10 golden cases | every teammate and agent can run the app; cases exist before the prompt does |
| 12:00–14:00 | The demo path end to end, ugly, real core step | **14:00: click through the path on the deployed URL.** Not working → cut scope or drop a rung (§3 stop bar) |
| 14:00–16:30 | Quality by the eval, UI states, the wow interaction; pitch draft from 15:00 | 16:30 **feature freeze**; eval pass rate recorded with set size and runs |
| 16:30–18:00 | Polish, deterministic demo data, fallback recording, pitch numbers checked against sources | every number on a slide has a source or the word "assumption" |
| 18:00–19:00 | Two timed rehearsals on the deployed URL; fix only what breaks the path | 19:00 **code freeze** on `main` |
| 19:00–20:00 | Buffer and demo | — |

Why these checkpoints: one iteration of the feedback loop should take under an hour [L9 p.39] (⚠ in the audio this was another startup's goal, on the slide the lecturer's own team's); "the winner is not who wrote the perfect prompt first, but who made the most iterations in the same time" [L9 00:44]; `main` always runs (repo `CLAUDE.md`); first working version early, then small steps (own, Battle: ≤4 minutes of 10).

## 9. Prompts to paste

Composed for the day from the tagged rules (own). Replace the brackets.

**Ideas, without invented pains** [L5 00:49–01:00]:
> Role: product analyst. Product area: [area]. Goal: an idea a team of four can demo in one day. Segments: [who]. Constraints: web app, no real payments, public data only. Give 7 ideas. For each: the user's pain with a source and a quote (a link I can open; write "no source" if you have none), the JTBD line "Коли …, хочу …, щоб …", what exists on the market already, and the hypothesis «Ми віримо, що зміна X для сегменту Y призведе до результату Z, бо O». Do not praise the ideas.

**Devil's advocate** [L5 00:49–01:00]:
> Now break our hypothesis: [hypothesis]. Why will it not work, what did we miss, which ready tool already does it, and what would a sceptical jury member ask first? Five points, strongest first.

**Review of the Project section** (this skill, hackathon mode):
> Розбери ідею з розділу Project у CLAUDE.md як ai-product-engineer у режимі хакатону: чи є проблема з доказом, гіпотеза за шаблоном, одна метрика для демо, один демо-шлях (Must), стоп-планка. Коротко, в чаті.

**Pitch check** [L9 p.24–26]:
> Here is our pitch: [text]. Check it against this order: who suffers → problem → evidence → cost in money (no solution so far) → solution in one sentence → effect → cost and effort → risks and a small first step → why not buy → the ask. List what is missing or out of order, and every number that has no source.

Review check for the day: the Project section has a problem with evidence, a four-slot hypothesis, one metric a demo can show, one demo path, a Won't list and a stop bar; every pitch number is measured or marked as an assumption.
