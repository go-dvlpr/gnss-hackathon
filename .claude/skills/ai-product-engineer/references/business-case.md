# Business case: is this epic worth building?

## Problem statement [L9 00:23–00:25]
An epic should read like a two-minute problem statement. Check each part; a missing part is a finding plus a question for the PM:
1. **Who suffers and from what** — a few sentences.
2. **Evidence** — data, a case, a lost deal; not "we think".
3. **Cost of the problem in money** — a share of revenue, not "$500 lost".
4. **Solution** — as short as the problem.
5. **Effect in money** — "speak one language with the business: money".
6. **Cost, effort, market alternatives found, risks.**
7. **The ask** — what is needed from whoever approves it.

The slides split this in two [L9 p.24–26]: first a **problem statement** with no word about the solution (who suffers, the problem, evidence, its cost in lost money), then a **pitch** (solution in one sentence, effect, cost and effort, risks and a small first step such as an MVP for one team, why not buy, the ask).

"A manager buys a solved problem with a number, not a technology." An epic that opens with the tech ("let's build an agent on Claude") and never names the loss is a finding. [L9 00:25]

## Priority = value / effort [L9 00:09–00:15]
- Rank by expected money (EGP, see `economics.md`) **divided by effort**. A bigger EGP alone is not a reason to go first. Belief and intuition may tip close calls.
- Two kinds of change, two kinds of estimate:
  - **speeds up work** (capacity ×4 → output ×4) — easy to estimate;
  - **improves a metric** (CPC, conversion) — the multiplier is a guess; get it from the owning team's history and a joint brainstorm.
- No access to finance data is normal. Ask for a range ("20k–500k a month"), not the exact number: the point is to compare options.
- (own) In B2B epics the value side is usually missing. Ask the PM for the range of the metric it moves, then size it; never invent it.

## Build vs buy [L9 00:19–00:23] [L11 00:40–00:44]
L9 sequence before building (six steps on the slide: ready tools exist? → do they solve our problem? → value → own costs → compare with the market → problem statement and pitch [L9 p.21]):
1. Look for ready tools on the market. **None exists → the problem is probably hard** and you may not solve it; account for that. One exists → check it solves *your* problem.
2. Ready tool doesn't fit or is too expensive → estimate the value of building.
3. Subtract your own running costs over the same period: AI tokens per use, infrastructure, third-party services.
4. Compare with the market option, then decide.
- Small or non-critical difference → **buy**: validated by the market, a whole team maintains it, you drop the support burden. [L9]
- L11 disagrees in part: "no simple answer"; with cheap AI-written code they build whenever they see a manual process. "Don't build, buy" was a habit from expensive code. [L11 00:40–00:44]
- (own) Report both views; the deciding inputs are the support cost over time and how close the ready tool fits.

## A stop bar before starting [L9 01:09–01:17] [L9 p.61–65]
- "MVP is not splitting a big task into small iterations; it is constant validation of the idea." **Set in advance when to stop.**
- The case: a fully automatic creative review needed 98% correct on a 100-case test set; the best reached was 78% after two months. The "N × EGP" formula looked so attractive nobody stopped earlier. "Nothing is impossible today — there are things whose effort doesn't match the outcome."
- For an epic: is there a kill criterion (metric, date, accuracy bar) written before the work? None → finding.

## Signals the epic class is wrong [L2 00:16–00:22]
- "Tasks close, tests pass, few bugs — but retention, activation and LTV don't move." Shipping more code is not progress. Ask which metric the epic moves.
- Saying "yes" to every feature because an agent can build any of them makes the product over-engineered. Half the features may be the ones to drop. (Ties to Scope, step 6.)
- In an AI-native team the developer first asks whether the task is needed, why, and which metrics it moves. [L13 01:13] [L13 p.39]
- Experiment first, clean up after: quick throwaway code to test a feature is fine; fold it into the architecture once it wins. Plan the cleanup. [L2 00:22–00:23]

## Tech epics still have product impact [L1 01:20–01:22]
- "Often every technical decision is a product decision": speed, stability and architecture move business metrics. Examples: a TV service fell over during a big fight and lost sales to pirates; a fixed scroll bug raised time on page and monetisation.
- (own) For a **Tech** epic: name the user-visible effect (latency, errors, failed payments) and the metric that would show it, even when there is no A/B.

## Portfolio, not one bet [L2 00:53–00:56] [L8 00:11–00:20]
- Of 10 hypotheses: ~3 strongly believed, ~5 lukewarm, ~2 not believed. Test the top 3; if they fail, stop and wait for a better idea from research or the market. [L2]
- Marketing ideas: only 2–5% of original ads win; plan 20% "most promising" and 80% the rest, because nobody knows in advance what will work. [L8]
- Start from a **problem metric** (weak activation or retention), find the cause. Fixing a few annoying bugs users keep hitting can lift it a lot. [L2 00:54]
- An obvious bug is fixed for everyone, not A/B tested: "it would hurt to watch the control group". Only check nothing got worse. [L2 01:01]

## Scope habits that no longer hold [L11 00:43–00:51]
- "MVP without logs and cache", "skip tests", "postpone localisation" came from the era of expensive hand-written code. With AI, cache, pagination and websockets cost hours.
- Code got cheap, process didn't: developers write code ~16% of their time (IDC 2024), so by Amdahl's law even instant code speeds delivery by at most ~16%. [L11 p.31–32] (own) An epic that promises a big delivery speed-up from AI coding alone is a finding: ask which process step it removes.
- (own) An epic that cuts **tracking or analytics events** "to save time" is a finding: without them the hypothesis can't be checked (PMF: track from day one).
