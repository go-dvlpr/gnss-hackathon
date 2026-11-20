# Experiments (A/B)

## Why test, and why "before/after" is not a test
- Metrics grew after rollout to everyone ≠ grew because of it: trend, seasonality, competitors, market. Both groups at the same time see the same outside world, so the difference is the change. [W6 00:13–00:18]
- Only ~10–15% (max 20%) of A/B tests win; most are neutral. [W6 00:18] The slide says 10%. [W6 p.9] Another company in L5: 679 tests in a year, 34% won by the test — "two of three hypotheses fail, and that is not a bad result". [L5 00:04] [L5 p.17]
- Goals of a test [W6 00:20]: validate an idea; **check a feature doesn't hurt** (no metric change expected); learn user behaviour; size an effect.
- Intuition is fine when backed by experience. Data-driven is not always optimal [W6 00:10–00:13]:
  - no data in a young product;
  - speed beats optimality in a startup;
  - **two-way door** (reversible) → just do it and watch; **one-way door** → be conservative.

## When A/B is the wrong tool
- **Low volume.** At ~100 users/day an A/B won't reach significance. Make a radical change (+75%, not +5%) and watch the metric instead. [PMF 01:10]
- The first year of a product: there is little to improve yet; make big bets. [PMF 00:26]
- The required sample means months: 1000 users/day on the screen and 100k needed → 100 days. Grow the audience or pick a bigger change. [L5 01:04]
- An MDE so small (+0.1–0.5%) that the test takes "a pile of time and traffic" and has doubtful economic sense. [W6 00:27]
- A test nobody may reject (compliance) still runs only to measure the damage. [L5 01:03] [W6 01:34]
- W6 gave no explicit "don't A/B when" rule. The list above is assembled from the lectures.

## Before launch — write it all down [W6 00:22–00:32] [L5 01:04]
The slides make four items mandatory: the hypothesis, the current level of target and health metrics, MDE with sample and duration, the action plan for each outcome [W6 p.12–17]; the experiment card is on p.18.
1. **Hypothesis with a mechanism** (see `hypotheses.md`).
2. **Current level** of the target and health metrics.
3. **One target metric** (rarely two) + **health/guardrail** metrics — what must not get worse. Check if the target is gameable: email CTR rises if you just send fewer emails, so the send count is a guardrail. Don't watch 20–40 metrics: some will move by chance.
4. **MDE** — the smallest change worth detecting, seen in reasonable time.
5. **Sample size and duration** from the MDE. Use calculators or scripts, never by hand (slides: evanmiller.org sample-size calculator [W6 p.16]; abtestguide.com/calc to read a result [W6 p.28]). Example: base conversion 20%, MDE 5%, ~1000 per group, 100 signups/day → 20 days. The 5% is absolute (20% → 25%); that is what gives ~1000 per group.
6. **Action for every outcome**: win → ship test; loss → keep control; neutral → ?; a guardrail drop of >X% → stop. Decision trees are fine (compliance copy: >20% drop → try other wording).
7. **Experiment card** in a test database: hypothesis, knowledge it's based on, design, metrics, MDE, sample, plan, then course and result, tags. Without it, teams rerun the same tests years later.

One hypothesis — one change — one metric. [L5 01:05]

### Sample-size rule of thumb (own — not from the lectures)
Lehr's rule for a conversion metric, α = 0.05 two-sided, power 0.8:
`n per group ≈ 16 · p(1−p) / δ²`, where p is the baseline rate and δ the absolute MDE.
Example: p = 0.20, δ = 0.01 (20% → 21%) → 16·0.16/0.0001 = **25,600 per group**. Divide by the daily eligible traffic per group to get days; round up to whole cycles.
This is a feasibility check only. For the real plan use your experiment platform or a calculator (UE named VWO's).

## Running the test
- **Split**: random by default. Stratify when users are few or very different ("whales" in one group). Never split by a deterministic trait like even/odd IDs. [W6 00:33–00:35]
- **Network effects**: if users interact, split by cluster, not by user. [W6 00:36] (own: in B2B the cluster is usually the organization.)
- **Traffic share**: start small (e.g. 5%) to check that tracking works and nothing breaks, then grow. [W6 00:39]
- **Keep group proportions equal and fixed** (10/10, 50/50). Changing the proportion while the metric trends gives a false winner — Simpson's paradox. [W6 00:44–00:49]
- **Parallel tests** [W6 00:40–00:52]:
  - no synergy between the changes → overlap freely;
  - possible synergy → run them sequentially, or as a multivariate test (control, A, B, A+B);
  - many variants → multi-armed bandit + a correction for multiple comparisons.
- **Duration**: never close after 2–3 days. Cover at least one full cycle (≥ a week). [W6 00:53–00:55]
  - The feedback loop depends on the zone's traffic and the metric: a funnel step with thousands of users can close in ~3 days; deep in the product traffic is thinner; a **day-30 retention** target needs at least 30 days. Extra variants slow every test down. [L2 00:58–01:00]
- **Segments**: look at cuts (platform, region, screen size), but don't force each cut to significance. Extend if a cut looks suspicious. [W6 00:55] Define segments **before** the test, not after: a win in 1 segment of 20 is likely noise. [L7 01:11]
- **New vs existing users** — evaluate separately. New users get a clean slate. Existing users have habits: a "fixed" workaround can break their workflow; the novelty effect fades. [L5 00:33] [W6 01:21]

## Reading the result [W6 00:56–01:18]
- p-value: how likely a difference at least this large is if the change has no real effect. The threshold (α) is the false-positive rate you accept. The usual threshold is 5% (1% when the success rate is low, 10% when high).
  - W6 described power confusingly ("power 20%"). The standard is power 0.8, i.e. a 20% false-negative chance.
- **Peeking**: p-value wanders; deciding before the planned date inflates false wins. But **not watching at all is also a mistake**: monitor guardrails.
- Assumptions: independence of observations, stationarity (don't run for half a year; a traffic-mix shift breaks it).
- The usual calculators use the normal approximation: it fails below ~30 observations and near 0% or 100% conversion; rule of thumb np > 10 and n(1−p) > 10. [W6 p.31] With 100 views at a true 10% conversion, anything from 3 to 18 clicks is inside the 95% interval. [W6 p.27]
- **Never rerun a test because you dislike the result** — at 1 in 20 error, reruns eventually "win" by chance.
- **Multiple comparisons**: 5 test groups → 5%/5 = 1% (Bonferroni).
- **Neutral test → post-mortem**. Example: users spend 2 s on the page and can't read the copy. That could have been caught before the test.

Decision checklist [W6 01:16–01:18]:
1. Is the test **valid**? Independent groups, splitter OK. If not, the result is unusable.
2. Health metrics fine? Did **the whole funnel** move, or only the target step? Only one step moving can be volatility.
3. Cuts: a neutral total can hide +X in one segment and −X in another → follow-up test. Different product per segment only if the gap is large, the cause understood, and the segments truly differ.
4. What did we learn about users? What are the next hypotheses?
5. Final decision and next steps.

Outcome by test type [W6 01:34]:
- growth test with no gain → control;
- compliance → no difference is the goal;
- enabler → neutral may ship test.

## Mistakes [W6 01:18–01:23]
1. Many changes at once with possible synergy.
2. Too many related tests: one funnel change alters who enters another test.
3. Ignoring interaction between groups (marketplace, network).
4. Optimising an intermediate conversion and ignoring the final one: CTR up, payments flat.
5. Ignoring stationarity and seasonality.
6. A broken split.
7. Mixing new and existing users; novelty effect.
8. Peeking — or never looking.
9. Too little planning and no recorded conclusions.

## Pricing tests [W6 01:30–01:32] [PMF 01:08]
- The same product at different prices for different users is legally and ethically risky. Test a different price **with a different amount of value** (e.g. credit packs) instead.
- Move prices in bold steps (7 → 15 → 40), not +20%. A low price can read as low quality. [PMF]
