# Hypotheses

## Definition
- A product hypothesis is an assumption about how a change in the product changes user behaviour. [L5 00:09]
- An idea is not a hypothesis. "Let's add a dark theme" lacks: for whom, why, what changes, which metric will show it. [L5 00:10]
- A hypothesis is born from a user's pain, not the author's wish. [L5 00:11]
- "An idea is cheap, a mistake is expensive; a hypothesis is a way to make fewer mistakes." [L5 00:08]
- Formulate hypotheses **before** launch, never fit them to the data afterwards. [PMF 00:24]

## Template
> «Ми віримо, що зміна **X** для сегменту **Y** призведе до результату **Z**, бо обґрунтування **O**.» [L5 00:17, verbatim]

Each slot is a filter on its own [L5 00:17–00:19]:
- **X, the change** — one change (see Scope below).
- **Y, the segment** — whole audience, a country, a plan. Ask how big the impact is: a change seen by a few users may not be worth it. Go top-down, from the goal to the segment.
- **Z, the result** — what moves in the product or business goal, with a metric and a threshold. One target metric plus a few health metrics.
- **O, the rationale** — research, data, interviews. "Competitors have it" alone is weak.

Good: «Ми віримо, що заміна розділу пошуку на тематичні категорії призведе до зростання вихідних реакцій, взаємних симпатій і повернень у застосунок, бо дослідження показало …»
Bad: «Ми думаємо, що заміна пошуку на Explore, як у конкурентів, буде кращою» — no segment, result or metric. [L5 00:20]

W6 adds: the rationale must name the **mechanism**, i.e. why it should work. "I think it'll be better" and "copy 2 sounds nicer than copy 1" both fail. [W6 00:22]

## Three filters [L5 00:11–00:14]
1. **Solves someone's pain?** Pain of the author only → it rarely matches the users' pain.
2. **Actually affects the goal?** Recolouring a button users on small screens can't even see does not.
3. **Timely?** AR try-on in 2012 was right but early.

The closing line of L5: an idea becomes a hypothesis when it affects the goal on time and is born from user pain. [L5 01:28]

## Sources of hypotheses [L5 00:36–00:41]
1. Product data: analytics, past experiments, user paths.
2. Users: support, store reviews, interviews, surveys. Watch out for answers given because of a reward.
3. Market and competitors.
4. Team: brainstorms, long-standing internal pain.

The source does not matter if the idea passes the filters. Data from the database earns more trust than feelings. "I've run 100 experiments, so I know" is not a rationale.

PMF: reverse-engineer competitors' funnels (ad → click → install → pay → day 30). Don't assume you're smarter than 25 competitors; first understand why they did it. [PMF 00:25]
PMF: when retention leaks, look at the **last events before users leave for good**. The case: readers had finished all 20 books, so the fix was the catalogue, not price or UI. [PMF 00:55]

## Generation and prioritisation [L5 00:44–00:49]
- **JTBD** — the job the user hires the product for ("people don't want a drill, they want a hole").
- **Opportunity Solution Tree** — product goal → opportunities (user pains and jobs) → solutions → tests. [L5 p.39] If a solution can't be traced bottom-up to the team or business goal, don't do it now, or revisit the goals.
- **ICE / RICE** — Impact, Confidence, Ease (+ Reach). The L5 slides score each of I, C, E on 1–10; the total score and Reach are not shown. [L5 p.40–41] Decomposition ("on crutches first, then the core") raises Ease.
- MoSCoW from a competitor matrix: a feature all have → Must; ~8 of 10 → Should; ~5 → Could; 1–2 → Won't. Don't build what you don't understand the problem of. [PMF 00:31]

## Cheapest validation first — the "ladder of cheapness" [L5 01:05–01:07] [L5 p.56]
"Choosing how to check is half the hypothesis." [L5 p.8] From cheapest to most expensive:
1. Research: data already in the company, old research.
2. **Worsening test** — remove or hide the feature and watch. It also tests whether a metric hit its ceiling. [L5 00:23–00:26] Slide case: hiding an unused section changed nothing; hiding a paid tab cut ARPU by 9.6%. [L5 p.24]
3. **Fake door** — a button to a feature that doesn't exist yet; count the clicks.
4. **Prototype** — a clickable, non-working flow, paired with interviews.
5. **A/B test.**

Validation can run in phases: on crutches → better → the core. The second run may not repeat the first: the traffic mix changes. [L5 00:28]
PMF: "Until someone pays, you have proven nothing". Surveys of friends don't count. [PMF 00:42]

## Common mistakes [L5 01:00–01:07]
- Filters not checked: not from pain, no effect on the goal, not timely.
- **A package of changes** in one iteration (new tier + new prices + new design).
- **No threshold**: "let's launch and see".
- **A test that can't be rejected** (compliance). It still has value: measuring the hit and knowing what to optimise next.
- Testing "on everyone" without knowing the effect per segment.
- Not recording what was learned. A failed experiment pays off only if the lesson is written down. Don't run "one more iteration" out of pity for a nice idea.

## Using an LLM for hypotheses [L5 00:49–01:00]
- Risks: it invents pains that don't exist and flatters ("99% wouldn't have thought of this").
- Prompt frame: role → product → goal → segments → constraints → answer format → hypothesis formula → **a source and a quote for every pain**.
- The more precise a number (10.26%), the less to trust it; demand a link to the exact fragment.
- Devil's advocate: "now break our hypothesis — why won't it work, what did we miss".
