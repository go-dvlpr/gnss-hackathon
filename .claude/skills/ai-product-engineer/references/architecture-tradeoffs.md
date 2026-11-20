# Quality requirements and architecture trade-offs (ATAM)

Read this when an epic states quality requirements (latency, uptime, scaling, recovery, security response, "must be fast/flexible/reliable") or is a Tech epic. All rules are from L15 (ATAM) unless marked (own). `p.N` = slide page.

## A requirement without a measure is a finding [L15 p.21, p.41–42]
- Quality attribute = what we assess (availability, performance…). NFR = the level we demand, with a number, under stated conditions. "Fast", "reliable", "flexible to any change" cannot be built, prioritised or checked — ask for the scenario.
- Quality Attribute Scenario, six fields in this order [p.44]: **source of stimulus → stimulus → environment → artifact (part of the system) → response → response measure**. An empty field is a question for the PM or architect.
- The load profile is part of the environment: "100 RPS of what — reads, writes, async?" Writes usually need idempotency [00:43:53–00:44:53].

## Measure at the right level [L15 p.24–25, p.46]
- Availability (share of valid requests that succeed), reliability (failures over a period), durability (confirmed data survives a failure) are three different checks; one incident can break one and keep another.
- SLI measured, SLO the team's target with headroom, SLA the promise to the customer.
- A green load test does not prove 99.99 % over 30 days. Each measure names its tool (load test, prod metric, failure drill + ledger reconciliation).

## Business goal → approach is a hypothesis [L15 p.27, p.30, p.50]
- Chain: business goal → driver → attributes → requirement → candidate approach. The candidate needs evidence; "a row in the table is the start of a justification, not a guarantee".
- Every level of quality has a price (cost, upkeep, latency). Ask why the business needs 99.99 % before agreeing to it.

## Utility Tree: importance and difficulty, not likelihood [L15 p.48, p.69]
- Each leaf scenario gets (importance to the business, difficulty to achieve), H/M/L. (H,H) leaves are analysed first.
- Likelihood of an incident is not one of the two ratings; it belongs to the risk register's priority.

## Sensitivity and tradeoff points [L15 p.64–66]
- Sensitivity point: one architectural parameter is critical for one quality requirement (failure-detection time → recovery time). Not a defect — a place to fix a value and test it.
- Tradeoff point: the same parameter is critical for several attributes (key-rotation window → security and availability). Name both attributes and check both.

## Risks [L15 p.67–70]
- Risk = decision + scenario + consequence + basis. Non-risk only with evidence under explicit conditions.
- Register: decision and scenario, consequence, justification, priority, next action (owner, deadline, check or accept). Zero risks is not the goal; unwritten risks are.

## ATAM steps 7–8 [L15 p.73–74]
- Wider stakeholders add and vote on scenarios; a leader that disagrees with the tree changes priorities. Voting never deletes a mandatory requirement (compliance, money correctness).
- New leaders → rerun the analysis; go back to ATAM steps 4–6 if needed.

## In the epic review (own)
- Tech epic: list its quality requirements as QAS; every missing measure is a ⚠️ row.
- Bet epic with a latency or uptime promise: the promise is a guardrail; ask for the QAS and who proves it.
