# Payments and billing

Read this when an epic touches checkout, subscriptions, plans, cancellation, refunds or anything that charges a card. All rules are from L10 unless marked (own).

## Three entities [L10 00:32–00:36]
- **Payment** — the high-level object with states: created → processing → (failed) → 3DS → authorisation → reversal → capture → clearing. The slide's list differs: it has void_ok, partially_captured and refunded, and no clearing. [L10 p.12] Ask which state model the system really uses.
- **Transaction** — the lower level with simple statuses: authorisation, capture, refund. Authorisation is only a **hold**: the money hasn't moved yet.
- **Chargeback (dispute)** — a card-network process: issuer and acquirer exchange documents, possibly arbitration. Not "filed = refunded".
- (own) For an epic: which of the three does it touch? An epic that adds a payment state but says nothing about refunds and chargebacks of that payment has a gap.

## Billing complexity by model [L10 01:09–01:15]
- **One-off purchase** — simplest; "conversion is everything".
- **Subscription** — fixed per period, or **consumption-based** (units, tokens, seats). Choosing it means "much more logic, now or later": tiers, discounts, invoices, coupons, upsells, retries. "Your subscription becomes a full billing system." Plus: predictable revenue.
- **Involuntary churn** — users lost to failed charges; reduced with retries. A billing epic should say what happens on a failed renewal.
- **Marketplace / platform** — more and different logic: onboarding sellers, payouts, AML screening.

## Payment funnel and metrics [L10 01:21–01:26]
- Look at a payment as a funnel: data collection → pre-authorisation → authentication (3DS) → authorisation → post-authorisation. Break the total conversion into steps.
- Many payments never reach the bank: users are lost on the form. Track field errors, load speed, **number of attempts**.
- **Six metrics cover ~80%**: checkout conversion, authorisation rate, decline reasons, chargeback rate, fraud rate, effective rate.
- **Authorisation rate = revenue**: of everyone who pressed Pay, how many were approved; when it drops, check seven levers — technical errors, antifraud, 3DS, declines, country, PSP, BIN/issuer. [L10 p.31]
- (own) Use them as guardrails for any epic that changes checkout or renewal; the target metric may be elsewhere, but none of the six may drop.
- **Processing ≠ cash flow**: reserves and lags mean processed money isn't money in the account yet. A dispute runs 45–75 days, arbitration 120+. [L10 p.32]
- **Effective processing rate** = total payment costs / total processed volume × 100%. [L10 p.33] Compare providers on it, not on the quoted price (flat vs IC+).

## Fraud and chargebacks are existential [L10 01:15–01:21]
- Types: **third-party** (stolen card, account takeover — using you as the merchant), **first-party** (the real cardholder files a baseless chargeback), and business-specific fraud (audio: fraud by the business itself; slide: triangulation, industry patterns [L10 p.24]).
- Fraud and chargeback rates **relative to transactions** have thresholds set by banks and card networks. Exceed them and providers may drop you as high-risk. The lecturer gave no numbers.
- **Support is fraud prevention**: ~80% of users try support first; if support doesn't answer, they go to the bank. An unclear **billing descriptor** and forgotten subscriptions produce chargebacks that support would have solved.
- (own) An epic that makes cancellation harder, hides "recurring", or slows support raises chargeback risk even if conversion grows. Pairs with the L7 guardrail rule in `metrics.md`.

## Payment stack [L10 01:26–01:34]
- Legal entity → bank account → choose PSP → merchant onboarding (the bank checks the business) → integration + **mandatory testing** → go-live → operational tuning.
- "No PSP in the world closes all your questions": stacks grow into several providers (cards, better local prices, APMs), then an orchestrator, bought or built.
- Missing local payment methods (APMs) lose revenue in markets where cards aren't the norm. [L10 00:30, 00:52]
