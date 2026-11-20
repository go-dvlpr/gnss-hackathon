# Team practice: agents in an engineering team

## 1. The baseline of an AI-first company [L14 01:48–01:52]
1. **AI code review** on 100 % of PRs — a faster cycle without engineers' time.
2. **A tool for the product manager** that connects to the database and GitHub and answers questions.
3. Between the minimum and the "luxury maximum": a **Slack agent**. It watches channels; a classifier labels a message as bug, question or idea; if actionable, it runs Claude in GitHub Actions with access to the repo, database and a browser (screenshots), opens a PR and comments in the tracker. For engineers and small point fixes, not for non-technical users. "A kind of virtual employee" — takes time to set up.

## 2. The Slack agent in practice [L14 02:07–02:12]
- A colleague writes "bug" → Slack gets "already fixed, here is the PR" with an OK button. The agent looks for a similar ticket, creates one if none, adds technical details, checks itself with Chrome automation and screenshots.
- It works because the requests are internal, already filtered by colleagues, the flow is small, and they must be answered anyway. On all support requests "it would be a mess": cluster requests and act when a cluster crosses a threshold ("10 % of users say this").
- The "luxury maximum": a product analytics tool records sessions, AI reviews the interactions and opens PRs for problems. [L14 02:11–02:12]

## 3. Choosing an AI reviewer [L14 02:13–02:16]
- Take **historical bugs**: restore the main branch and the PR that introduced each bug, and see which reviewer finds it (CodeRabbit, Greptile, others).
- Only Claude Code caught them: CodeRabbit read the diff statically and didn't check that a called function exists; Claude Code followed dependencies (a type mismatch in a project without TypeScript).
- An agentic reviewer costs more per run "but catches far more". They kept both: CodeRabbit is almost free.

## 4. Working with coding agents [L14 01:44–01:48]
- Superpowers was useful for greenfield: spec → plan → code → tests → another agent reviews; "give it a task and leave, it implements it over days". It is needed less now: recent models handle this well themselves.
- Benchmarks of methodologies and skills show they help in some cases and not in others (tokens, speed, cost, quality) — take a scientific approach, measure.
- The most useful skill named in the lecture is **handoff**: a Markdown file for the next agent, so you don't re-explain and don't lose context.
- See also `context.md` §8 (MCP hygiene, syncing skills, several repos with grep).

## 5. Where development with agents is going [CS146S 02:38–05:30, 38:40–43:20]
- Four eras: copy code from ChatGPT → agent in the terminal → many parallel agents with a person reviewing every command (the bottleneck) → always-on agents with their own computer and memory that learn skills on the job.
- In 6–12 months: agents working weeks and months, better recall, all tools given like to a new hire, voice, companies writing processes down for agents to read.
- Open problems: evaluating an agent that runs for a month while models ship monthly; memory; harness security; when to stay quiet; many more tokens, so token efficiency becomes key.
- New primitives: durable workflows, sandboxes, cloud computers, memory, skills, connectors, voice, payments, identity, evals, observability. Every product gets an agent part or becomes "a headless piece of data for another agent".
- Training flywheel: SFT teaches the model this harness and its tools; RL teaches following instructions, picking one skill among hundreds, clicking right; inference is tuned too (low latency for the main agent, helpers can be slower). [CS146S 34:28–37:41]

## 6. An agent-driven SDLC in a product company [L13]
A CTO on moving a product organisation (60–70 people in the change) to agent-driven delivery. The numbers are the company's own.
- Not autonomy but **controlled acceleration**: a person frames the problem, gives context, decides and owns quality; a system of narrow agents, not one top-level prompt ("make me a whole game" is vibe coding, not an SDLC). [L13 00:05–00:07] [L13 p.4–5]
- Pipeline [p.10, p.23]: an agent shapes the task → GitHub Issue → trigger comment → an agent implements → PR → CI → preview deploy on its own subdomain → tracker status sync → a person (PM, QA, engineer) tests. Feedback is an Issue comment tagging the agent; the chain runs again.
- **The Issue is the agents' log**: author, reviewer and tester agents comment there, so every run has a history — the usual "something happened and there is no log" is gone. The tracker keeps only the high-level description and status. [L13 00:12–00:14]
- Non-technical owners (marketing, legal, payments) check the preview in 5–10 minutes. **The developer joins last, as the mandatory review before main, and whoever merges owns it.** [L13 00:15–00:20] [p.25]
- Adoption [p.21–28]: one product as a pilot zone → the real backlog → owners test on branches → developer review as the quality gate → measure the share of tasks going through the agent flow (14% at the start, 81–87% in recent weeks, peak 92%; product tasks only — R&D runs a lighter process). [L13 00:29, 01:04]
- Tracker policy: the agent is the default assignee; assigning a person requires a "why not AI" field, which doubles as a backlog of pipeline gaps. [L13 01:03] [p.27]
- Quality: the share of PRs merged on the first pass wasn't measured ("under half, by feel"). Returns are mostly about **missing context, not code quality**: the agent read the country from the request IP while the infrastructure passes it in a cookie set at the CDN. Review feedback goes back into context by hand, through a tracker board. [L13 00:18–00:35]
- Context: QA user-flow descriptions, moved from documents into Markdown files, became the agents' product context. Skills hold architecture rules (event-driven; files processed for up to 10 minutes → gRPC and queues), memory-leak and concurrency checks, API-contract checks between back end and front end, and a mandatory rollback plan (database and external-service changes can't be reverted with code). "What is in the engineers' heads has to be written down for the agents." [L13 00:25–00:45] [p.16–17]
- Testing: without automated tests the speed-up is impossible — "the system is measured by its slowest link". Scripted tests break on anything unexpected, such as a new A/B variant; a QA agent with product context walks the product, runs every A/B group in an isolated environment, takes screenshots and files bugs. It starts only after merge conflicts are resolved. [L13 00:45–00:59] [p.19]
- Architecture stays with developers: handed architectural control, "the system collapses in a few iterations". [L13 00:56–00:58]
- Downsides [p.37]: needs human review; tech debt piles up fast; not every task fits; a bad task gives a bad result; needs strong CI/CD and preview infrastructure; over-automation; culture has to change. Review volume grows well past the old two or three a day. [L13 01:10–01:12]
- Cost control: weekly usage exports per person; look at heavy spenders (an analyst feeding a whole analytics base to an expensive model) and at non-users alike. [L13 01:25–01:27]

## 7. Where the speed-up goes [L11]
- Developers write code ~16% of their time (IDC 2024). By Amdahl's law even instant code speeds delivery by at most ~16%: the gain comes from removing process, not from the agent's speed. [L11 p.31–34]
- Capability grows fast: SWE-bench Verified went 2% → 49% → 81% → 88% [p.9]; the length of task an agent finishes half the time (METR) doubles every ~4 months (the audio said "every half year"). [L11 p.14]
- "Write the agent only what it can't learn by itself": instructions help when they describe non-standard practice — the design system, analytics-event rules, local conventions. [L11 p.39] Architecture decisions live as ADRs the agent follows. [L11 p.41–42]
- People own four things [p.60]: framing the task, decisions, architecture ("ask why"), challenging the agent. Whatever can be checked by an algorithm is: linters and types, unit tests, e2e in CI with video, a manual look at a preview only sometimes. The agent writes tests through TDD; a person spot-checks that the cases are real. [L11 p.61–63]
- Spend freed capacity on monitoring and early detection in production, not on polishing AI-written code. [L11 p.64] Parallel agents work in separate worktrees. [L11 p.52]
