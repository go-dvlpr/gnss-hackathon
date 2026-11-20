---
name: ai-product-engineer
description: Use when the user brings a Jira epic (key, link or pasted text) or a feature idea and wants a product review of it — "розбери епік", "продуктовий розбір", "яка тут гіпотеза", "що тут міряти", "чи є сенс це AB-тестити", "чи має цей епік сенс" — or asks whether an epic's hypothesis, success metric, experiment design or unit-economics impact holds up. Also for the hackathon — "хакатон", "ідея для хакатону", "MVP за день", "що показати на демо", "демо", "пітч", "питч", "юніт-економіка для пітчу".
metadata:
  version: "0.9.0"
---

# AI Product Engineer: epic review

Review an epic the way a product-engineering course teaches it: hypothesis → metric → cheapest honest validation → decision agreed before data. The output is a report for the user. Jira, the experiment platform and everything else stay untouched.

**Local context.** If a `LOCAL.md` file sits next to this file, read it first: it holds the user's own setup (company, product, where their notes live) and wins over the generic text here.

## Sources

The frameworks live in `references/`. Every rule there carries a tag pointing at the lecture it came from:

| Tag | Lecture |
|---|---|
| L1 | Introduction to product-based IT |
| L2 | The product-minded software engineer |
| PMF | Market research → MVP → PMF |
| UE | Unit economics: LTV, CAC, financial model |
| L5 | Product hypothesis generation |
| W6 | Workshop: A/B testing and experiments |
| L7 | Analytics in product-based IT |
| L8 | Performance marketing — intro |
| L9 | Performance marketing — MarTech |
| L10 | Payments and payment systems |
| L11 | Intro to AI-assisted development |
| L13 | How we built an AI-native SDLC |
| L14 | Building efficient AI agents; `read` = the lecturer's reading list |
| L15 | Infrastructure trade-offs, ATAM |
| L16 | Designing and optimizing RAG architectures |
| L17 | AI UX/UI for engineers |

A timecode tag (`[L7 00:33]`) points at the audio, `p.N` at that lecture's slide page. Where the slides and the audio disagree, the reference keeps both and says which is which.

Read the reference a step names before doing that step. `(own)` marks an addition that is not from the lectures; carry that mark into the report.

## Steps

1. **Collect.** Fetch the epic, its description, child stories and linked docs (a Jira connector if there is one). If Jira is unreachable, ask the user to paste the epic. Note each fact's source (field, comment, link). **Hackathon mode** (see `LOCAL.md`): the epic is the Project section of the repo's `CLAUDE.md`; read `references/hackathon.md` first and apply the later steps only at the depth it sets — idea filter, MVP cut to one demo path, one demo metric, money line, pitch order, timeline.
2. **Classify the epic** — this decides how much of the rest applies:
   - **Bet** — a change expected to move a metric. Run every step.
   - **Must-do** — compliance, legal, contract, security. Nobody will reject it on metrics (L5 "тест, який не можна не прийняти"). Skip the "should we" debate; keep step 4 (guardrails, measure the hit) and step 5 only to size the damage.
   - **Enabler** — prepares later bets (W6). Name the bet it enables; a neutral result is acceptable.
   - **Tech** — debt, infra, refactoring. Not a product hypothesis; do not invent one. Check guardrails and rollout only, and name the user-visible effect (latency, errors, failed payments) — every tech decision is a product decision (L1, `references/business-case.md`).
   - **Delivery for another team** (own) — another team (Sales, Marketing, Sales Ops) asked for it and we ship only the plumbing: a signal, an event, an integration. There is nothing to compare "before" with, and the hypothesis and its metric belong to the requester; do not write them. Skip steps 3–7. Check only: the ACs match the latest decisions; delivery can be verified end to end (sent vs received on the other side); there is a way to switch it off. The requester's open questions go in one line. Example: lead-scoring triggers sent to the sales CRM.

   The full review (steps 3–7) is for epics that change an existing user workflow, where a new version competes with the current one.
3. **Hypothesis** — `references/hypotheses.md`. Rewrite it into the four-slot template. Fill a slot only from the sources; an empty slot is a finding plus a question for the PM. Run the three filters and the OST link to the goal. Then the business case — `references/business-case.md`: the seven parts of a problem statement, value in money divided by effort, build vs buy when the epic builds a tool (L9, L11).
4. **Metrics** — `references/metrics.md`. One target, guardrails with owners, leading or lagging, net not gross for money (`references/economics.md`). Name how the target could be gamed. Epic touches checkout, subscriptions, cancellation or refunds → also `references/payments.md`: the six payment metrics are guardrails (L10). Epic builds an LLM feature or an agent → also `references/ai-features.md`: agent vs workflow vs ready tool, the eval set as the success metric, cost and latency, data and security questions (L14). The engineering review of the agent itself is the `ai-agent-engineer` skill. Epic states quality requirements (latency, uptime, scaling, recovery, security response) or is a Tech epic → also `references/architecture-tradeoffs.md`: each requirement as a six-field QAS with a measure, importance/difficulty, sensitivity and tradeoff points, risks with evidence (L15). Epic changes a screen, a flow, onboarding, a paywall or a form → also `references/ux-design.md`: one main action and all four states per screen, the metric each visible change should move and why, both variants kept (L17).
5. **Experiment** — `references/experiments.md`. Can an A/B detect the expected effect with the traffic this flow gets? Estimate sample size and duration. If it can't, propose a cheaper rung of the validation ladder. Check the split unit, overlapping experiments, new vs existing accounts, and whether the decision for every outcome is written down before launch.
6. **Scope** — one hypothesis, one change, one metric (L5). A package of changes in one test → propose the split. Mark Must vs Could (PMF MoSCoW) with the cost of each cut. Check there is a stop bar written before the work (L9), and that tracking was not cut "to save time" (L11) — `references/business-case.md`.
7. **Devil's advocate** (L5). Why will this fail? Look for Simpson's paradox, novelty effect, selection bias, a metric that grows only because the audience mix changed.
8. **Report** — an artifact if the client has one, otherwise a Markdown file; in the user's language:
   - verdict first, three lines at most, plain words;
   - a table of checks: step, status (✅ / ⚠️ / ❌ / n/a), evidence with its source;
   - the hypothesis in template form, with empty slots marked;
   - questions for the PM, ready to paste, but never posted;
   - the cheaper validation, if one fits;
   - `(own)` items kept separate from lecture rules.

   For **Delivery for another team**, the report is the verdict and the three checks only.

## B2B translation (own)

The lectures use B2C apps with large traffic. When the product is B2B SaaS:
- Check traffic before anything else. PMF and W6 both say A/B is useless when the volume can't reach significance.
- The split unit may need to be the organization, not the user. Users of one org talk to each other, which is the W6 network-effect problem.
- Business cycles run monthly and quarterly, not only weekly. A test should cover at least one cycle (W6).
- LTV comes per seat or per org, with plan upgrades. UE only covered B2C subscriptions.
- **GTM (go-to-market)**: how the change reaches paying customers — segment (ICP), positioning, price and plan, channel. Name the **GTM motion** of the segment the hypothesis targets, because it decides how the change can be tested:
  - *product-led* (self-serve: sign up, try, pay) — users find the change in the product; a user- or org-level A/B fits;
  - *sales-led* (enterprise, account managers) — the change reaches accounts through sales or CS, often by contract; a silent split is rarely possible, so validate with pilots or a cheaper rung, and ask who tells the customers;
  - *partner-led* (API, ISV) — partners pick it up through docs and releases; the effect lags and is measured per partner.
  An epic with no answer to "who learns about this, and how" is a finding: question for the PM. Do not confuse GTM with *time to market* (speed to first version).

## Rules

- Never invent a user pain, a number or a source (L5: an LLM "hallucinates to be helpful"). Every number in the report cites where it came from; a missing number is a question, not an estimate dressed as fact.
- Traffic, conversion and baseline numbers come from the epic, past experiment reports or the user. Never query a database; if a number needs a query, write the SQL for the user.
- No sycophancy. If the epic has no hypothesis, the verdict says so.

## Changelog

- **team copy for the hackathon** (2026-11-20) — `LOCAL.md` (hackathon mode, course and lecturer table) and `references/hackathon.md` (idea filter, MVP cut, demo metric, money line, pitch order, timeline, prompts); step 1 points at it; hackathon triggers in `description`. Version unchanged.
- **0.9.0** (2026-11-20) — every lecture checked against its slides. Fixes: flattening (not "fluttering") retention curve; Consideration stage of the funnel; OST levels goal → opportunities → solutions → tests; the L8 slide's EGP formula differs from L9 and the homework; 130–140% ROMI is oral only, the slide defines ROMI = LTV / CAC; payment states on the slide differ from the audio. Added from slides: decision rule with thresholds and a decision owner, aha and habit formulas, bounded retention, three ways to prove impact, the 12-step question checklist, LTV and CAC parts, gateway fees, the CPM → CPA chain, ICE 1–10, ladder of cheapness, success rates 10% and 34%, calculators and the np > 10 rule, authorisation-rate levers, dispute timeline, problem statement vs pitch, Amdahl's law for AI speed-up claims. New tags L13 (developer asks which metric a task moves) and L16 (when RAG fits, in `ai-features.md`).
- **0.8.1** (2026-11-19) — review fixes: p-value definition, absolute MDE, ROMI vs LTV:CAC flagged as unreconciled, report vs analytics, aha moment no longer "proven", ATAM step names; note-taker remarks and a company name removed.
- **0.8.0** (2026-11-19) — public release: lecturer names, company specifics and local paths removed; the user's own setup goes to `LOCAL.md`, which is not shared. Broken tails of `payments.md` and `business-case.md` cleaned.
- **0.7.0** (2026-11-18) — lecture L15 (ATAM, lecture + slides). New `references/architecture-tradeoffs.md`: requirement without a measure is a finding, six-field QAS, availability/reliability/durability, Utility Tree ratings (importance, difficulty — not likelihood), sensitivity vs tradeoff points, risk = decision + scenario + consequence + basis, ATAM steps 7–8. Step 4 points at it.
- **0.6.0** (2026-11-17) — `ai-features.md` keeps only the product checks (agent or not, evals as the success metric, cost and latency, data and security questions). Engineering depth from L14 — eval design, observability, context engineering, tools, security enforcement — moved to the new `ai-agent-engineer` skill.
- **0.5.1** (2026-11-17) — `ai-features.md`: three rules from the Stanford CS146S talk on Grok Bot (reading list of L14): production failure → eval case; irreversible actions behind a draft and approval, auto review; cache miss = bug.
- **0.5.0** (2026-11-17) — lecture L14 (lecture, slides, reading list). New `references/ai-features.md`: agent vs workflow vs ready tool, evals as the success metric (pass/fail judge, runs, same set before/after, judge validation, error analysis), observability, cost and latency, context levers, security (agent rights = user rights, lethal trifecta, retention). Step 4 points at it.
- **0.4.0** (2026-11-08) — lectures L1, L2, L8–L11 added. New `references/business-case.md` (problem statement, value / effort, build vs buy, stop bar, tech = product decision, hypothesis portfolio, tracking not cut) and `references/payments.md` (three entities, billing complexity, payment funnel and six metrics, fraud and chargebacks). Marketing money (ROMI, EGP, ratio vs scale) in `economics.md`; experiment feedback loop by zone in `experiments.md`. Steps 2–4 and 6 point at them.
- **0.3.1** (2026-11-08) — tag L10 renamed to L7 to match the lecture order.
- **0.3.0** (2026-11-03) — B2B translation: GTM and GTM motion (product-led / sales-led / partner-led) decide how a change can be tested; no GTM answer = question for the PM. (own), from the course glossary.
- **0.2.0** (2026-10-27) — new epic class "Delivery for another team": skip steps 3–7, check ACs, end-to-end delivery and an off switch; short report. From a test run.
- **0.1.0** (2026-10-27) — first version: steps 1–8, references from L5, W6, L10 (now L7), PMF, UE.
