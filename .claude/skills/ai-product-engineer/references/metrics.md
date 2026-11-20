# Metrics

## Reporting vs analytics [L7 00:06–00:09]
- A report says **what** happened; analytics digs into **how** it happened. Dashboards are reporting.
- Product analytics = decomposing a product decision into data you can verify. It starts when you've decided what you'll do if the metric drops.
- Analytics answers "how"; UX research answers "why": interviews, surveys, usability tests. [L7 01:13]

## A good metric [L7 00:10–00:14]
1. Simple — everyone on the team knows how it's counted.
2. **Paired**: relative + absolute. "Unit economics 3" on $100 spend means nothing. Always ask what absolute volume a ratio stands on.
3. Reliable. [L7 p.16] Orally the lecturer also asked for a metric volatile enough to move but not so volatile it's noise: six traits in the audio, five on the slide.
4. Business-oriented — ultimately leads to money.
5. **Actionable** — if it drops and you can do nothing, don't track it.

More rules:
- **Leading vs lagging.** Trial conversion leads; revenue, quarterly LTV and retention lag. Work with metrics that are both informative and actionable.
- **Tracking quality**: missing, misnamed or mis-tracked events make a metric useless. Check the events exist and are named right.
- Decompose in steps: a team rarely moves LTV directly. It moves trial conversion; payments moves the success rate; all roll up to LTV, revenue and retention.

## Frameworks [L7 00:14–00:21]
- **AARRR**: acquisition, activation, retention, revenue (+ referral).
- **HEART** (Google): Happiness (NPS, CSAT), Engagement, Adoption, Retention, Task success.
- The framework only lays the user flow out end to end and **splits metrics between teams**. Pick one, assign owners, move on.
- Attribute a drop by zone: clicked the ad, never started → marketing; bought, then left → product; failed to pay → payments. [L7 00:19]

## North Star [L7 00:23–00:29]
- **NSM** is a product metric, not revenue. Examples: Spotify — time listening; Airbnb — nights booked; Uber — rides per week; Slack — DAU.
- NSM properties: expresses value, guides the team, actionable. A raw user count is not value if users do nothing.
- One metric distorts: transactions grow while sellers leave. Use a **North Star Set** of 2–4 metrics:
  - each covers a separate critical dimension;
  - no duplicates;
  - a clear hierarchy;
  - **an owner for each**.
- **Metric tree**: business goal → sub-goals → team metric (e.g. trial conversion) → what one person can change → the A/B tests that move it. Every experiment should link straight to a business goal. [L7 00:30]

## Primary + guardrails [L7 00:31–00:33; 01:16–01:19]
1. **Primary** — what success is.
2. **Guardrails** — they block bad wins. Example: a $0 first payment instead of $10 raises subscription starts, but refunds, chargebacks and bank complaints follow.
3. **An owner for every metric.**
4. **Time horizon** to decide, set before launch.

The slide calls these the **decision rule — before launch, not after** [L7 p.32]: one primary metric, never changed post hoc; guardrail **thresholds** (e.g. retention −5% → stop, refunds 20% → stop); a **decision owner** who settles the trade-off when the primary goes up and a guardrail goes down, named in advance, not in chat on launch day; the time horizon (month-2 retention rarely shows in a week). Thresholds and the decision owner are on the slide only.

Payments guardrails: fraud rate and the card-network risk rate (VAMP) are top; refund and chargeback rates come next. Tempting guardrail breakers: hiding "recurring" on the paywall, removing the close button. L10's six payment metrics and why chargebacks are existential: `payments.md`.

Rules against local optimisation [L7 01:18]:
- every team has a line to the North Star Set;
- every team knows which metrics stop it from wrong moves;
- **the team owner is not the guardrail owner**.

Revenue up while month-2 retention and refund quality go down is not a win: revenue is a cumulative lagging metric. [L7 00:30]

## Value moments [L7 00:33–00:43]
- **Engagement = repeated value.** Logins are not value: "30 value actions" beats "30 visits". Track the value action.
- **Aha moment** — when a user first gets the value. Users who hit it retain and pay better. Tinder: 3 messages in 7 days. Find it by correlating product events with financial metrics. It focuses a team: "move this event", not "grow revenue". Onboarding pushes towards it; users who haven't reached it by day N get targeted.
- Slide formulas [L7 p.36]: Facebook — 7 friends in 10 days; Slack — 2,000 messages in the team; Twitter — 30 follows in the first week; Pinterest — 1 pin in 7 days; Airbnb host — first booking within 30 days, rated 4+★; Tinder — 3 messages in 7 days. Method: target action → behaviour X → quantify (count + time window) → check with an A/B. "Publicly cited examples, not benchmarks — find your own formula in the data."
- **Habit moment** — the user returns without nudges. Slides [L7 p.37]: Pinterest — 4 repins of the first 28 pins; Airbnb guest — 2 bookings in a year; Slack-style — 1+ message on 4 of the first 7 days; Meetup host — 4 meetups in 28 days. "Aha is the first value, habit the repeated one"; **PMF = habit reached at scale**. Aha and habit formulas are leading indicators of the North Star.
- Normal return frequency depends on the niche: music daily, utilities weekly or monthly. Fewer returns ≠ a worse product.
- Prove aha is causal, not correlation: analysis with stated confidence, plus common sense. [L7 01:27]

## Retention [L7 00:43–00:47] [PMF 00:54]
- **Day-N classic** (cohort) — returned on day N / cohort size. **Rolling** — active on day N or any later day. Rolling suits products with no reason to return on a given day. **Bounded / N-day** — active on specific days (D1, D7, D30): early experience. [L7 p.33]
- Curves:
  - smiling or network-effect — users discover more over time;
  - **flattening** — stabilises at 30–50%: part of the users found value, healthy, scale it [L7 p.34] (the audio transcript heard "fluttering");
  - declining to zero — little value, maybe no PMF.
- **PMF sign**: the weekly retention curve flattens into a plateau. A curve falling to zero = leaky bucket, no PMF. [PMF]
- Retention up? Check every segment — the audience mix may simply have shifted. [L7 00:46]

## Segments and Simpson's paradox [L7 00:48–01:13]
- **Segment** = a split by a known attribute: device, country, plan, funnel, payment method.
- **Cluster** = a group found from behaviour. Keep only clusters with a business reading.
- "When a metric's quality changes, often it's because the segments changed."
- **Simpson's paradox.** The total LTV grows with feature use, yet **in every segment** LTV falls. The mix shifted: rich users use the feature more. Users with the feature having higher LTV may be "good users anyway", not caused by the feature. If it drops in every segment, that is the feature's effect.
- Rules:
  - not everything that correlates with LTV drives it;
  - aggregate charts can lie;
  - **segment before the change or test, not after**.
- To prove impact: an A/B where half the users **in every segment** get the feature pushed to them proactively; test LTV ≥ control (with guardrails) → a driver, otherwise motivational bias. No A/B possible → a look-alike cohort comparison (same starting traits, different usage), or quasi-experiments. [L7 01:12] [L7 p.57]
- "There is no average user": an average LTV of 20 = some at 200, many near 0. [L7 01:23]
- B2B: a listener said "this doesn't fit B2B, no such data"; the lecturer answered only "it's all about data volume". [L7 01:12]

## Relative vs absolute [L7 01:14]
Provider A has a higher payment success rate; provider B brings more money in absolute terms. When users pay different amounts, watch both.

## Funnels [L7 01:16] [PMF 01:18]
- Email: sent → delivered → opened → clicked → target action. Optimise all steps, not one. An aggressive blast lifts sales now and costs later.
- Product funnel [PMF p.65–73]: Awareness → **Consideration** (the audio has "Inspiration"): the ad must match the offer, a quiz raises purchase intent, onboarding explains the product → Conversion → Loyalty: retention is the main decision metric and the cheapest acquisition, "hard to build & easy to lose".

## Question checklist for any product question [L7 01:19–01:23]
1. Which product decision will I make with this?
2. Which user behaviour do I want to change? Which metric reflects it?
3. Input or output metric? Does it explain behaviour? Is it actionable?
4. Check by segments; alternative explanations; correlation vs causation; biases.
5. Which experiment tests it? Is Simpson's paradox hiding something?

The slides expand it to 12 steps in four phases [L7 p.66–68]: **question** (decision, behaviour, metric) → **classify** (output or input, leading or lagging, actionable or vanity) → **check** (segments: channel, intent, country, lifecycle; alternative explanations: mix shift, seasonality; correlation vs causation; selection and motivational bias; Simpson's paradox) → **act** (the experiment, its guardrails, the risk of local optimisation).

## Biases [L7 01:20–01:25]
- **Motivation**: arguing for the wanted conclusion.
- **Confirmation**: seeking proof I'm right.
- **Availability**: overweighting what's easy to recall.
- **Survivorship**: only the survivors are analysed.
- **Halo**: one good trait colours the rest.
- **Selection**: the sample isn't representative.
- **IKEA effect**: overvaluing what you built yourself.

Only selection and motivational bias are on the slides [L7 p.57, p.68]; there, motivational bias is the Simpson case — motivated users both use the feature and pay more. The other definitions come from the audio.
