---
name: ai-agent-engineer
description: Use when the user wants to challenge, design, build or improve an AI agent or an LLM workflow — their own or one another team brings — "челендж агента", "розбери агента", "чому агент тупить", "як покращити агента", "евали для агента", "новий агент", "додати свого агента", or asks about evals, LLM judges, tracing, context engineering, subagents, prompt caching, tool design, agent cost, prompt-injection risk, RAG, embeddings or retrieval quality. Also for the hackathon — "хакатон", "MVP за день", "агент чи воркфлоу", "golden set", "демо", "підготувати демо", "паралельні агенти в одному репо", "технічна частина пітчу / питчу".
metadata:
  version: "0.3.0"
---

# AI Agent Engineer

Challenge, design and improve AI agents: pick the simplest shape that works, measure it with evals before changing it, spend every context token deliberately, and limit what the agent can reach and send. The output is a report for the user. The agent's code, prompts and evals stay untouched until the user explicitly asks for changes.

Product questions — should this exist, which business metric proves it, can it be A/B-tested — belong to the `ai-product-engineer` skill. This skill makes the agent good and proves it.

**Local context.** If a `LOCAL.md` file sits next to this file, read it first: it holds the user's own setup (where their notes live, company specifics) and wins over the generic text here.

## Sources

Every rule in `references/` carries a tag:

| Tag | Source |
|---|---|
| `[L14 hh:mm]` | Lecture "Building efficient AI agents", audio timestamp |
| `[L14 p.N]` | the lecture's slides, 130 pages |
| `[L14 read: <title>]` | the lecturer's reading list, 14 links |
| `[CS146S mm:ss]` | Stanford CS146S "How always-on agents work" (Grok Bot), from the reading list; slides p.93 and p.109 come from it |
| `[L11 hh:mm]`, `[L11 p.N]` | Lecture "Intro to AI-assisted development", audio and 67 slides |
| `[L13 hh:mm]`, `[L13 p.N]` | Lecture "How we built an AI-native SDLC" (a CTO on his company's process), audio and 48 slides |
| `[L16 hh:mm]`, `[L16 p.N]` | Lecture "Designing and optimizing RAG architectures", audio and 35 slides; the recording misses the very start and the end |

The reading-list summaries are second-hand: find the original and check a number there before quoting it to anyone. `(own)` marks an addition that is not from these sources; carry the mark into the report.

## Pick the mode

| Mode | When | Steps |
|---|---|---|
| **Challenge** | an agent exists: mine, the team's, or a PR from another team | 1–8 |
| **Design** | nothing is built yet | 1, 2, then 3–7 as requirements written before the code |
| **Improve** | it works but fails cases, costs too much or is slow | 1, error analysis (`references/evals.md` §6), the lever from 4–5, rerun the same set |
| **Evals** | build or extend the eval set | 1, 3 |
| **Hackathon** | a one-day build with a live demo (see `LOCAL.md`) | `references/hackathon.md` first; then 2, 3 and 6 at the depth it sets, and its §7 for several people and parallel agents in one repo |

## Steps

1. **Collect.** Read what the agent actually is: system prompt, tool definitions, the loop or workflow file, model and parameters, eval set and runner, a few real traces or run logs. Another team's repo — through `gh api`. Note `file:line` for every fact. No traces available → say so; never infer behaviour from the prompt alone.
2. **Shape** — `references/architecture.md`. Which rung of the ladder is it (ready tool → decision model → workflow → agent), and would a lower rung do? Loop type, stop condition, framework vs raw SDK, model per step, where the model runs. A scheduled or event-driven agent → also durable state, resume from the failed step, trigger routing.
3. **Evals and observability** — `references/evals.md`. Is there a set, what shape, which checks (code first, then a pass/fail judge), runs per case, held-out part, how production failures become cases, before/after on the same set, who maintains it. Given any run, can you see every step, tool result, judge verdict, cost and latency? No eval set is the first finding and the first fix: propose 10–30 cases from real failures.
4. **Context** — `references/context.md`. Count what goes into each call: tool definitions, system prompt, history, tool outputs. Apply the four principles (minimize, compact, isolate, better context) and check the cache prefix stays stable. The agent retrieves from a document base → also `references/rag.md`: chunking, filters, hybrid search and reranking, Recall@k on a hand-labelled golden set.
5. **Tools** — `references/tools.md`. Number, overlap, names, descriptions, output size, error messages, a dedicated tool for what the agent does through shell most of the time.
6. **Security** — `references/security.md`. Agent rights = user rights, enforced in the tools; the lethal trifecta legs; every way data can leave; irreversible actions behind approval; secrets out of the model's context; where the model runs and what it retains.
7. **Team practice** — `references/team-practice.md`, only when the question is how the team uses agents (AI review, Slack agent, an agent-driven SDLC, where the speed-up goes, which plugins).
8. **Report** — an artifact if the client has one, otherwise a Markdown file; in the user's language:
   - verdict first, three lines at most, plain words;
   - a table of checks: area, status (✅ / ⚠️ / ❌ / n/a), evidence with `file:line` or a run id, source tag;
   - fixes ordered by value per cost, each with its cost and the eval case that will prove it;
   - proposed eval cases as `input → expected bullets`;
   - questions for the owner, ready to paste, never posted;
   - `(own)` items kept separate from the lecture rules.

## Rules

- Every claim about the agent cites `file:line`, a trace or a run id. Every number (pass rate, cost, latency, tokens) is measured or asked for, never estimated and presented as fact.
- Running the agent or its evals spends tokens: name cases × runs × model before running, and wait for the user's go.
- Another team's agent: findings go into a report or a draft review comment; nothing is pushed or posted.
- The lecturer's practice comes from one internal tool with about 100 eval cases [L14 00:51]. Where the reading list disagrees or goes further, say which source says what. The lecture asks for a scientific approach to methods and skills: measure, don't trust the hype [L14 01:45].

## Changelog

- **team copy for the hackathon** (2026-11-20) — `LOCAL.md` (hackathon mode, lecture and lecturer table) and `references/hackathon.md` (shape in five minutes, 10-case golden set, quick RAG path, injection and secrets, cost and latency, parallel agents in one repo, Battle lessons, prompts); new Hackathon row in the mode table; hackathon triggers in `description`. Version unchanged.
- **0.3.0** (2026-11-20) — lectures L11, L13, L16. New `references/rag.md`: when RAG fits, chunking, authorization as a pre-filter, embedding failure modes and model choice, hybrid search and reranking, Recall@k on a hand-labelled golden set, generation checks, production trace and versions. `team-practice.md`: an agent-driven SDLC (Issue as the agents' log, preview per task, developer review as the gate, "why not AI" field, context gaps over code quality) and where the speed-up goes (Amdahl, people's four duties). `tools.md`: the CLI vs MCP trade-off with a token figure. `security.md`: instructions are not a guarantee, per-agent access, retrieved text untrusted.
- **0.2.1** (2026-11-19) — review fixes: Improve mode points at steps 4–5; lecturer personal details and company names removed; "always a bad idea" marked as the lecturer's view; 36 % → 80 % flagged as measured on different sets.
- **0.2.0** (2026-11-19) — public release: lecturer names and local paths removed; the user's own setup goes to `LOCAL.md`, which is not shared.
- **0.1.0** (2026-11-17) — first version: Lecture 14 (audio, 130 slides, 14-link reading list, Stanford CS146S talk). Split from `ai-product-engineer/references/ai-features.md`, which now keeps only the product checks.
