# gnss-hackathon

One-day hackathon project (Sat 2026-11-21, 10:30–20:00). Several people and several AI sessions write to this repo at the same time. The goal is a live demo at the end, not production code.

## Project

- **Name:** ILY — the ASL handshape for "I love you", which is also the demo finale.
  Tagline: "Learn to sign to the one you love".
- **Pitch story (presenter, keep the wording):**
  1. Problem slide: «Наш сегмент — чуючі люди з глухою близькою людиною: партнером, дитиною,
     батьками. Вони вчать мову, щоб бути ближче, а не заради кар'єри. «I love you» — перше, що
     такій людині хочеться сказати жестами.» Number for it: over 90% of Deaf children in the US
     are born to hearing parents (Mitchell & Karchmer 2004, Sign Language Studies 4(2)).
  2. Demo finale: the name LILY is the letters L, I, Y; the ILY handshape combines exactly
     I + L + Y. «Ви щойно вивчили I, L і Y. Покажіть їх разом — це I love you. Так називається
     наш продукт.»
- **Idea:** A practice game for hearing people in the US who learn ASL for a Deaf loved one
  (partner, friend, relative). The webcam checks each sign you make, and an AI coach says what
  to fix. Leaders (Lingvano, ASL Bloom) already check signs with the camera but only say
  "wrong"; App Store reviews complain that correct signs are rejected. Fingerspelling.xyz
  (Hello Monday, 2021, free web) already checks the ASL alphabet by webcam for parents of Deaf
  children; we differ by the coach that names the fix, words, and stars. Put it on the
  competitors slide.
- **Hypothesis:** We believe that feedback naming what to fix, for hearing US adults learning
  ASL for a Deaf loved one, will raise the share of signs done right on the second try, because
  competitors' cameras only say "wrong". Evidence is thin (2 of 717 recent reviews of three
  leaders, 2026-11-21); say so in the pitch.
- **Demo metric:** recognition accuracy on people the references never saw
  (leave-one-person-out), plus false accepts on random movement. No retention or revenue claims.
- **Stop bar (checkpoint 14:30, before the lunch merge):** TODO — team confirms. Proposal:
  false rejects ≤ 15%, false accepts ≤ 5% on held-out people. If words cannot be told apart,
  the demo stays on letters + "I love you".

### Core feature — build this first, nothing else until it works

**Sign check with a coach:** the webcam records one sign → the browser recognises it →
verdict and confidence → if wrong, the coach names what to fix → retry.
- Vision: MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`, in the browser, no key) → our
  classifier (DTW nearest neighbour against recorded references). Recognition stays in the
  browser: it must answer in under a second.
- Coach: the code computes the difference from the reference (which finger, where the movement
  starts); the LLM only phrases it. The LLM never decides right or wrong. Low confidence →
  "show it again", not a guess. The LLM key lives on the backend only.

### Learning loop — around the core

- Per sign: watch (reference clip, 0.5× option) → quiz (recognise it) → AI review (sign it
  yourself: 3-2-1, 1.5 s → check → coach hint → retry) → review round at the end.
- Quiz: show a sign, pick the word or letter from 4 options; or the reverse. The code picks the
  wrong options from the hard pairs of the eval set (PLEASE gets THANK YOU as an option). No LLM.
- Stars per sign: ★ first correct; ★★ three correct in a row without a hint; ★★★ correct in the
  mixed review round.
- Lesson = the letters of your loved one's name, then the finale I LOVE YOU. A missed letter
  (quiz or camera) comes back after two others; the lesson ends with spelling the whole name.
  The eight words are the next lesson.
- Code decides correctness, stars and the review queue. The LLM writes only hints and a
  two-line lesson summary.

### Free and Premium

Prices: proposal $99.99/year (analyst confirms). Reference: Lingvano $17.99–19.99/month or
$119.99/year; ASL Bloom $98.99/year.

Unit economics (draft for the slide; ⚠️ = our assumption):
- Net after Stripe (2.9% + $0.30): $96.79/year. LLM cost (GPT-5 mini, ~400 in + 60 out tokens
  per hint ⚠️): ~$0.08 per payer per month, ~$0.30 with free users. Margin ≈ $7.77/month.
- LTV (13 months, 24% first annual renewal in Education, RevenueCat) ≈ $116.
- Base: $3.03 per signup (iOS CPI proxy ⚠️) ÷ 2.1% freemium conversion (RevenueCat 2026) →
  CAC ≈ $144, LTV/CAC ≈ 0.8.
- Target LTV/CAC 2.0: conversion 5.2% with the paywall after the name lesson (hard-paywall
  median is 10.7%) → CAC ≈ $58. Backup: ≥ 60% organic signups (TikTok) at 2.1%.
- Replace the token counts with the cost log after 15:00.

| | Free | Premium |
|---|---|---|
| Lessons and quizzes | alphabet and the first words | all lessons |
| AI review of a sign | a few checks per day ("energy") | unlimited |
| Coach | hints | hints, lesson summary, review plan |
| Sign reading mode | — | yes |

AI review stays in Free with a daily limit: it is the feature that sets us apart, so people must
try it before paying. Recognition runs on the device and costs nothing; the limit exists to sell
Premium, not to save money. Evidence: App Store reviews of Ziggy and ASL Bloom ask for limited
daily free practice instead of a hard paywall. Free-to-Premium conversion is unknown; label it
an assumption.

### Demo path (= Must)

1. Open the page, allow the webcam, type the loved one's name.
2. Quiz: one question on a letter of the name ("is this L, I or Y?").
3. AI review: sign a letter wrong on purpose → coach hint → retry → ★.
4. Spell the rest of the name; a missed letter comes back.
5. Finale: I LOVE YOU → lesson summary from the coach.
6. Paywall screen (mock, `HACK:`): "your free checks for today are used up".
7. Slide: eval results.

Demo name: no J or Z (they move), and few of the fist letters A, E, M, N, S, T, which are
easy to confuse. LILY works: L, I and Y look nothing alike.

### Not core

- **Should:** the four UI states (empty, loading, error, success), slow-motion reference,
  streak, backup video of the demo, cost log per LLM call.
- **Could (after 14:30):** more words, fingerspelling the name, MOM/DAD (needs face landmarks),
  LLM-planned next lesson.
- **Won't (pitch slide "next"):** video lessons, dictionary, sentences or translation, login and
  payments (mock with `HACK:`), push notifications, native mobile app, other sign languages.

- **What we teach, in order** (references recorded from a video dictionary):
  1. The ASL alphabet, all letters. J and Z have movement; the other letters are static
     handshapes.
  2. Eight words, all one-handed, so no face landmarks are needed: HELLO, GOODBYE, YES, NO,
     PLEASE, THANK YOU, SORRY, I LOVE YOU. Goal: after the demo the jury can sign a few of them.
     Hard pairs, keep them in the eval set: HELLO vs THANK YOU (flat hand moving out, from the
     forehead vs the chin), PLEASE vs SORRY (circle on the chest, flat hand vs fist), YES vs SORRY
     (fist, nod vs circle). The rest of the team's list is the pitch slide "next".
- **Stack:** full-stack TypeScript; a web app for desktop with a mobile-adapted layout, hosted
  on Vercel. MediaPipe Tasks Vision runs in the browser. Frameworks: TODO. LLM provider: OpenAI
  (key in `.env` and Vercel env vars, name in `.env.example`; called from the backend only).
- **Status:** MediaPipe feasibility spike in progress by Vladyslav Hirko (branch: TODO); record
  the result here.
- **Run locally:** TODO
- **Deploy / demo URL:** Vercel; URL TODO

### ASL recognition prototype

The standalone [ASL prototype](asl-demo/README.md) evaluates transcription of MediaPipe hand
landmarks with GPT-6.2 Sol. Run it with `cd asl-demo && go run .` after loading the local
`.env` described in the README. The app serves `http://127.0.0.1:8080` and accepts a
manually recorded landmark sequence at `POST /api/recognize`.

The day plan is in [PLAN.md](PLAN.md) (Ukrainian): timeline, roles, how we cover each judging criterion, the three mandatory slides (architecture, evals, unit economics), evals and the README sections required at code freeze.

## Skills (`.claude/skills/`)

Built from the course lectures; each `LOCAL.md` sets hackathon mode (short, in chat, in Ukrainian) and lists the lectures.
- `ai-product-engineer` — idea, MVP cut, one demo metric, money line, pitch. `references/hackathon.md` holds the day's timeline, checkpoints and paste-ready prompts; `references/ux-design.md` covers UI: brief, `DESIGN.md`, the four states, signs of AI-made design.
- `ai-agent-engineer` — the LLM part: agent or workflow, a 10-case golden set, a quick RAG path, secrets and injection, parallel agents in one repo.

- Design skills from the L17 lecturer (review, UX copy, research, UI styling, tokens, slides): list, sources and what was changed in `.claude/skills/DESIGN-SKILLS.md`. For a UI review use `heuristic-review` or `design-critique`; for the pitch deck, `slides`.

Ask e.g. «розбери ідею з Project як ai-product-engineer» or «перевір LLM-частину як ai-agent-engineer».

## Priorities

1. The demo path works end to end. Build a thin vertical slice first, then improve it.
2. `main` always runs. Never push a broken `main` — the demo can start from whatever is there.
3. Speed over polish: hardcoded config, mock data and shortcuts are fine. Mark each shortcut with a `HACK:` comment so it is easy to find.
4. No new dependency unless it saves real time; ask the team before adding a framework or a paid service.

## Working together

- One feature = one short-lived branch (`<name>/<feature>`), merged within an hour or two. Pull `main` before you start and before you merge.
- Small commits with clear messages. Touch only the files your task needs: no mass reformatting, renames or moving files around — that causes merge conflicts for everyone else.
- Never force-push to `main`, never rewrite shared history.
- If you change something others depend on (API shape, env vars, the run command), update this file in the same commit.

## Secrets

- Keys go in `.env` (git-ignored); list the variable names in `.env.example`.
- Never commit API keys, tokens or real personal data, and never paste them into prompts that end up in the repo.

## Checks

- Before merging to `main`: run the app and click through the demo path.
- Tests only for logic that would break the demo silently (parsing, calculations). No coverage goals.

## For AI agents

- Read this file and the code you are about to change before writing anything.
- Before any UI work, read `DESIGN.md` if it exists; record accepted design decisions there.
- Keep diffs minimal and scoped to the task; say what you skipped.
- Ask before deleting files, changing the stack, or anything that touches `main` history.
- If something in "Project" above is still TODO and you need it, ask instead of guessing.
