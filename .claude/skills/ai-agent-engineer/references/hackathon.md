# Hackathon: building the LLM part in one day

Use on the hackathon day (Sat 2026-11-21, 10:30–20:00): four people and several Claude Code sessions in one repo, a live demo at the end. The team's rules are in the repo's `CLAUDE.md`; they win over anything here. The product side (idea, MVP cut, metric, pitch) and the day's timeline are in `ai-product-engineer` `references/hackathon.md`. The other files in this folder hold the full rules; this file says what to take from them in a day.

Tags are as in `SKILL.md`; `L9` and other tags missing from its Sources table are in `LOCAL.md`. `(own)` = not from a lecture. `(own, Battle)` = the rules written for the 10-minute AI Builder Battle (L12, no slides or notes).

## 1. Pick the shape in five minutes

Walk the ladder and stop at the first rung that works (`architecture.md` §2):

| The core step is… | Build | Source |
|---|---|---|
| something Claude with a skill and a small CLI already does | no custom agent; show the skill | [L14 00:28–00:29] |
| a decision on text or an image (classify, extract, route) | **one LLM call with structured output** (JSON Schema or Zod) | [L14 00:08–00:12] |
| a fixed sequence (extract → check → write) | **a workflow**: chained calls with gates in code | [L14 00:10–00:11] |
| a task whose steps cannot be known in advance | an agent: tools in a loop, with a max step count | [L14 00:14] [L14 p.19, p.30] |

- Default for the day is the second or third row. An agent costs more and compounds errors [L14 read: Building effective agents]; on stage a fixed path is also a predictable one. (own)
- "Very often you don't need to build your own agent… focus on the product, not the technical details." [L14 02:16]
- Start with the raw SDK; frameworks hide prompts and responses. [L14 read: Building effective agents] A chat UI does not need building: OpenWebUI gives streaming out of the box. [L14 00:05–00:06]
- Use a hosted model. In the lecturer's view local models are "always a bad idea" outside air-gapped cases. [L14 00:23–00:25]
- If one agent must read several long documents, give each to a subagent-as-a-tool and keep only the short answers in the main context. [L14 01:20–01:21] Only if the idea needs it.

## 2. Thin slice first, then many short iterations

- First a version that runs end to end with fake data, then improve it in small steps. (own, Battle: first working version in ≤4 of 10 minutes; repo `CLAUDE.md` priority 1)
- AI features are not deterministic and "there are no super-guidelines"; changing one word in a prompt can flip the result. "The winner is not who wrote the perfect prompt first, but who made the most iterations in the same time." [L9 00:42–00:44]
- Aim for a feedback loop under an hour per iteration. [L9 p.39] (⚠ in the audio this was another startup's goal; the slide gives it as the lecturer's own team's.)
- The six-step pipeline for a hard feature [L9 p.57]: technical research with Claude (you own the result) → a structured prompt with business context and your technical view → an optional brainstorm → a hypothesis of how it will work, before code → implementation with tests → review.
- Talk to the agent like a colleague: short lines, not page-long prompts. [L11 p.44] Write it only what it cannot learn from the code. [L11 p.39] For today that is the Project section of `CLAUDE.md`, the API shape between parts, and `DESIGN.md` if there is a UI. (own)
- No questions, no plans, no subagents was the Battle rule for a 10-minute build. (own, Battle) Today the repo's rule is different: if a Project field is TODO, ask instead of guessing.

## 3. Minimum eval: a 10-case golden set

"Any performance improvements of AI systems should be guided by evals." [L14 p.51] Without a set, fixing one answer breaks another and nobody can tell whether the system improved. [L14 00:33–00:35] Full rules: `evals.md`.

1. **Write 10 cases before tuning the prompt.** A table: what is tested, the input, the expected output as bullet points. [L14 00:43] The lecture's first set was 11 cases run twice [L14 p.46]; 10 is our floor for the day (own).
2. **Mix** (own, from `evals.md`): 6 cases on the demo path, 2 hard or ugly inputs, 1 question that has no answer — an invented answer is a failure [L14 read: Evals FAQ] — and 1 prompt-injection case (§5).
3. **Check with code where the output is bounded** (a label, a number, a JSON field). [L14 p.39] Free text → an LLM judge that returns **pass/fail**, sees the request, the answer and the expected bullets, and has no tools. [L14 00:36–00:39]
4. **Run each case 2–3 times** and average; set temperature to 0 where the provider allows it. [L14 00:39–00:42]
5. **The runner is a file and a script.** The lecturer's was a Google Sheet and about 100 lines of TypeScript; ready eval platforms are "complex for a simple task". [L14 00:42–00:44]
6. **Never paste the cases into the agent's prompt.** [L14 01:40] Before and after a change, run the same set. (own, `evals.md` §2)
7. A low first score is useful: theirs was 36%. [L14 00:44] Record the score with the set size and runs; it goes into the pitch.
8. A failure seen during a rehearsal becomes case 11. [CS146S 36:06]
9. No time for Phoenix today (own): log every call to a JSONL file — input, output, tool calls, tokens, latency. "LLMs are black boxes. But AI agents must never be." [L14 00:44–00:47]

Judge prompt to paste (own, built from [L14 00:36–00:39]):
> You are grading one answer. Request: {input}. Answer: {answer}. Expected points: {bullets}. Return JSON {"pass": true|false, "missing": [..]}. Pass only if the answer covers every expected point and states nothing that contradicts them. If the expected point is "says it does not know", any invented answer fails. Do not grade style.

Running the set spends tokens: name cases × runs × model before running (rule in `SKILL.md`).

## 4. A quick RAG path, if the idea needs a document base

Full rules: `rag.md`. For one day, in this order:

1. **Does it need RAG at all?** A base under ~200k tokens (about 500 pages) goes whole into the prompt with caching. [L14 read: Contextual Retrieval] Exact facts → SQL or a tool. [L16 p.33]
2. Still RAG → keep it small: "a small base doesn't need a vector database", any store works. [L16 00:28, 00:47–00:48]
3. **One page = one chunk** when pages are independent — the best case. [L16 00:03–00:04] Otherwise chunks with overlap; "there is no universal 500-token rule". [L16 p.10]
4. Hard constraints (user, language, date) are a metadata filter before the search, not a line in the prompt. [L16 p.11]
5. Exact terms (codes, names, IDs) → add BM25 next to embeddings; hybrid plus a reranker is where production starts, and is a Could for today. [L16 p.22–25]
6. The system prompt says: answer only from the given chunks, cite them, and say "I don't have this information" otherwise. [L16 00:30] Show the citation in the UI: every fact links to its source paragraph. [L14 00:04–00:05]
7. **Minimum check**: for each golden question, mark by hand which chunk holds the answer and count how often it is in the top k (Recall@k). "No way around manual work." [L16 p.28–30] If the chunk is not retrieved, no prompt will fix the answer. [L16 p.2–3]
8. Avoid the known failure: long, interdependent documents that look alike in embedding space. A team gave up on that case. [L16 00:40–00:42]

## 5. Prompt injection and secrets

Full rules: `security.md`. The day's minimum:

- **Secrets**: keys in `.env`, names in `.env.example`, never in a prompt, a commit, a log or a screenshot for the pitch (repo `CLAUDE.md`). Keep passwords out of the conversation with the model. [CS146S 26:29–27:24] Give agents dev values only: the lecture's team lets the agent clone dev variables and see only that a prod variable exists. [L11 01:30]
- **Rights live in the tool code, never in the prompt** — "never, it's never reliable". [L14 01:53–01:56] The agent gets only the data the current user may see.
- **Lethal trifecta**: private data + untrusted content + a way to send data out. Cut the third leg: no free-form URL fetch, no email or message sent without the user approving a draft. [L14 p.121–122] [CS146S 19:49]
- **Everything read is untrusted**: uploaded PDFs, web pages, retrieved chunks, third-party tool descriptions. It enters the model as data, never as an instruction. [L14 p.123–126] [L16 p.32]
- **"An instruction is not a guarantee."** [L11 p.53] The Replit agent deleted a customer's production database during a code freeze. [L11 p.50] Today: coding agents get no production database and no force-push; a database change comes as a migration or SQL a person runs. [L11 01:39]
- A jury member will type "ignore your instructions and…". Put that case in the golden set and decide what the product answers. (own)
- No real personal data in fixtures or demo accounts (repo `CLAUDE.md`).

## 6. Cost and latency

- Log tokens and time per request from the first run; the lecture's team stored both anyway. [L14 00:54–00:55] The pitch needs cost per request, and the stage needs the latency.
- Keep the prefix stable — system prompt and tool definitions first, in a fixed order, the changing part last: cached input costs about 5% of the price in the lecture's price table. [L14 p.107] "Avoid cache misses at all cost." [L14 p.106]
- Route by difficulty: a cheap model for easy steps, a strong one where the eval shows it matters. [L14 00:10–00:11] Check the swap on the golden set, not by feel.
- Fewer tokens in context is both cheaper and better: fewer tools, long tool outputs to a file, a shorter top-k. [L14 00:58–00:59] [L14 p.77] But cutting top-10 to top-5 loses the answer that sat 6th. [L16 00:37–00:38]
- An agent loop has a max step count in code. [L14 p.30]
- Turn off MCP servers you do not use in your coding session; their descriptions cost context — Chrome DevTools MCP is about 18,000 tokens. [L14 01:08–01:11] [L11 p.51]
- Watch the spend during the day: one analyst feeding a whole base to an expensive model cost "a couple of thousand dollars" in a day. [L13 01:25–01:27]
- On stage (own): stream the answer or show a loading state (`ux-design.md` §3), and keep a recorded run as a fallback for a provider outage.

## 7. Four people and parallel agents in one repo

- **One worktree per parallel task**: each branch is its own folder, so sessions do not overwrite each other. "Strongly recommended" for parallel features. [L11 01:37–01:38] [L11 p.52] `git worktree add ../gnss-<feature> -b <name>/<feature>`; branch rules are in the repo's `CLAUDE.md`.
- **Narrow agents, not one big prompt.** "A system of narrowly specialised agents", not "build me the whole game" — that is vibe coding. [L13 00:05–00:07] One agent session = one task touching one area of the code. (own)
- **A bad task gives a bad result.** [L13 p.37] PRs come back mostly for missing context, not for code quality. [L13 00:33] Use the task brief below.
- **Agree the contract first.** The classic pain is back end and front end describing one interface differently; the lecture's pipeline has a separate check for it. [L13 00:41–00:43] Write the API shape and env var names into `CLAUDE.md` before splitting.
- **Review is the gate, and whoever merges owns it.** Anyone may open a PR; the person who merges answers for it. [L13 00:19–00:20] [L13 p.25] "The agent writes the code. A person answers for it." [L11 p.59]
- **Review structure, not every line** [L11 p.57] [L11 01:40–01:42]: did only the expected places change; does it fit the agreed architecture; look twice at the thin spots (for us: the LLM call, parsing, anything that touches keys).
- **Check behaviour, not code**: run it and click the demo path. [L11 p.62] Whatever a machine can check, it checks: types, linters, a test for parsing. [L11 p.61] Tests are written by the agent; a person spot-checks that the cases are real, "not mocks on mocks". [L11 01:53]
- **Do not let PRs pile up.** Ten PRs you did not start are ten PRs nobody really checks. [L11 01:27–01:28] Merge within an hour or two (repo rule).
- **Resolve conflicts before testing**: in the lecture's pipeline test agents start only after conflicts are resolved, so what is tested is what lands on `main`. [L13 00:55]
- **A log per task.** Agents write what they did into the Issue, which solves "something happened and there is no log". [L13 00:12–00:14] Today the PR description is enough. (own) When a session ends unfinished, leave a handoff file for the next one. [L14 01:44–01:48]
- **Architecture stays with people.** Hand it to the agents and "the system collapses in a few iterations". [L13 00:56–00:58] You must be able to explain every decision the code makes: "at three in the morning you must explain any function you deployed". [L9 p.59] The jury's questions are the 3 a.m. of the day. (own)
- Each agent gets its own access, not everything: "give it all of GitHub and the infrastructure and just write in chat — guaranteed to go badly". [L13 01:10–01:12]

Task brief for a parallel agent (own, built from [L9 p.57] and [L13 p.37]):
> Read CLAUDE.md first. Task: [one sentence]. Why: [which step of the demo path it serves]. Touch only: [files or folder]. Contract you must keep: [API shape, env vars]. Done when: [what I will click or run to check]. Do not: add dependencies, reformat, rename or move files. Mark shortcuts with `HACK:`. At the end say what you changed, what you skipped and how to run it.

Review prompt for a fresh session (own, built from [L11 p.57]):
> Review branch [name] against main. Do not read every line. Report: files changed outside [expected area]; anything that breaks the contract in CLAUDE.md; secrets or real personal data in the diff; places where the demo path can fail silently (parsing, empty LLM answer, timeout). Run the app and the demo path if you can. Findings by priority, each with file:line.

## 8. Before the demo (own, Battle)

- Demo data is inline and deterministic: no randomness on load, so the stage shows what the rehearsal showed.
- The app opens with one command or one URL; no build step that can fail on stage if it can be avoided.
- Run the app after every change, not at the end.
- Polish counts: a clean layout, a clear title, one "wow" interaction on the demo path.
- Freeze features, then code, at the times in the product file's timeline; after the freeze fix only what breaks the path.

Review check for the day: the rung is named and no higher than needed; a golden set of ≥10 cases with a recorded pass rate; rights and outward actions limited in code; tokens and latency logged; each parallel task has a brief, a worktree and a person who merges it.
