# Unit economics and PMF

## Unit economics [UE 00:00–00:25] [PMF 01:12–01:21]
- A unit earns more than it costs. The unit can be a user, an order, a subscription or a ride.
- **Item-based**: a thing sold. **User-based**: acquisition cost vs what the user brings. [PMF]
- **CAC** = marketing spend / acquired (paying) users. It is the final CPA in the ad funnel. [UE 00:01, 00:35] The PMF slide counts marketing cost + sales cost. [PMF p.54]
- **LTV** = revenue from a unit over its life, on a fixed horizon (6 / 12 / **13 months** — 13 so that annual and 6-month plans rebill fully). [UE 00:01, 01:06] Its parts: number of transactions T, average order value AOV, average gross margin AGM. [PMF p.54, no formula shown]
- **LTV:CAC = 3:1** is the target [UE 00:19] [PMF 01:16]:
  - 3:1 leaves a margin for traffic price shocks and uncounted costs;
  - 2:1 is fragile;
  - ≥4:1 means under-investing in marketing;
  - 10:1 means competitors are coming.
  - Neither lecturer explained where 3 comes from.
- Levers: lower CAC; raise LTV through price or retention. [UE 00:24]
- Unit economics is a ratio; LTV is an absolute number. Always pair a ratio with the absolute volume. [L7 00:48] [L7 00:10]

## Gross vs net [UE 00:10–00:15]
- **LTV gross** = everything the user paid.
- **LTV net** = gross − revenue deductions:
  - store, bank and payment-gateway fees [UE p.15];
  - refunds and chargebacks (monitor the chargeback rate — card networks punish it);
  - sales tax, VAT, GST.
- Infrastructure, office and salaries sit in **neither** CAC nor LTV. They are overhead in the P&L.
- An effect on money is judged on **net**: refunds and fees can eat a gross gain. (Applying this to epics is own.)

## Cohort LTV [UE 00:25–00:31; 01:22]
- **Rebill rate** = paid again / the cohort's **initial** base (not last month).
- LTV per user = initial price + Σ (rebill rate_m × future price_m) over the horizon.
- Count per calendar cohort: cohorts behave differently, and LTV dynamics by cohort show when something changed.
- Only actual payments count. Cancelled after payment 2 → 2 payments, even if access remains.
- Upsells and upgrades bought later belong to the acquisition cohort's LTV. [UE 00:53]
- A user who left and came back counts as a **new unit**: they were re-acquired. This also exposes refund → return → refund abuse. [UE 00:37]
- Forecast with no history: extrapolate the week-over-week usage decline. "The simplest method, usually the most accurate." [PMF 01:36]

## Ad funnel as a diagnostic [UE 00:30–00:37]
- All four costs are computed from the same budget.
  - **CPM** — budget / impressions × 1000;
  - **CPC** — budget / clicks;
  - **CPI** — budget / installs;
  - **CPA** — budget / target actions.
- The step whose cost jumps is where the problem is. Cheap clicks but expensive installs → the gap between click and store.
- The chain [L8 p.56–57]: CPM $10 → CTR 1% → CPC $1 → CR 2% → CPA $50. A better creative (CTR 2%) or a better funnel (CR 4%) each halves CPA to $25; both → $12.50. The product engineer owns CR.

## Financial model and scaling [UE 00:40–01:13]
- **P&L**, line by line:
  - gross revenue;
  - − deductions = net revenue;
  - − opex (marketing, content);
  - − staff;
  - − overhead;
  - = net profit.
- Assumptions come from history, competitors and market data (e.g. RevenueCat), and a sanity check. "Any forecast beats none."
- Cohort triangle: the diagonal sums give calendar revenue.
- **If unit economics doesn't converge, don't scale marketing.** Good economics + scaling shows a P&L loss now and revenue later; that is fine.
- (own) For an epic: don't roll an A/B to 100% until the branch's economics hold.

## PMF [PMF 00:51–01:12]
- After market research has validated the market, the PMF stage builds a product that satisfies it (3–6 months). PMF can be lost and refound (Netflix, Amazon).
- **Sign**: the weekly retention curve plateaus. The higher the plateau, the higher the value. A curve falling to zero = leaky bucket.
- When retention leaks, check that the **core value** is right before touching UI, colour or price. Look at the last events before churn.
- Market alive, competitors growing, you're not → the problem is your product, not the market.
- MVP goal: minimise time to market and validate on real data. Track from day one. The MVP is one courier carrying one thing from A to B — not a set of half-features.
- Focus: one market, one localisation; "many focuses = none done".

## Market criteria [PMF 00:12–00:16]
Competitive (demand proven), large (≥100M/year possible), growing, not a monopoly, the team has relevant knowledge. New players appearing while total revenue grows = a healthy, growing market.

## Marketing view of the same money [L8 00:42–00:56] [L9 00:06–00:09]
- **ROMI** in percent: 100% = break-even on marketing, above = profit. The slide defines ROMI = LTV / CAC, with CPA ≈ CAC when the target action is the purchase. [L8 p.55] "A good one ≈ 130–140%" is oral only [L8 00:45]; the slides use 140% just as a reading example ($1 in → $1.40 back). [L8 p.53] 130–140% is far below the 3:1 LTV:CAC target above and the lectures did not reconcile the two: ask which bar the team uses.
- **100% ROMI is an operating loss**: ROMI is not ROI — product, office and staff costs sit outside it. [L8 00:47]
- **EGP** (expected gross profit) = (ROMI − 100%) × monthly spend. ROMI 120% on 100k spend → 20k (L9 slide: $100k × 140% → $40k [L9 p.11]). Marketing's "most important metric"; L9 sizes every tool and initiative in it. The L8 slide writes ROMI × monthly spend = EGP without subtracting 100% [L8 p.52]; use the L9 form and say which one a quoted number used.
- **A ratio doesn't survive scale**: a profitable ROMI at $1k/day says nothing about $100k/day — the audience widens and metrics fall. So monthly spend (volume) is "the second most important metric". (Same rule as L7: pair a ratio with its absolute volume.)
- **The product engineer moves CR and LTV**: funnel conversion and what the user gets after paying. "Numbers add up only when product and marketing are aligned"; the product must deliver what the ads promise. [L8 00:51, 01:00]
- (own) The lectures' businesses are B2C apps bought through paid ads. When the epic's segment is not acquired through ad spend (see GTM motion in `SKILL.md`), EGP via ROMI doesn't apply directly. Keep the structure — value in money, divided by effort (`business-case.md`) — and ask the PM for the numbers.

## B2B gaps (own)
UE and PMF covered B2C subscriptions only. Open for B2B: LTV per seat vs per org, plan upgrades, multi-seat expansion, payback period (UE didn't cover it).
