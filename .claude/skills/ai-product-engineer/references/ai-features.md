# AI features: product checks for epics that build an LLM feature or an agent

Use when the epic builds something with an LLM inside: a classifier, a chat assistant, an agent, a RAG search, an "AI reviewer". Only the checks that decide whether the epic holds up live here. Engineering depth — eval design, judges, tracing, context engineering, tool design, how to enforce limits — is in the `ai-agent-engineer` skill. Tags: `[L14 hh:mm]` = lecture timecode, `[L14 p.N]` = slide page, `[L14 read]` = the lecturer's reading list.

## 1. Does it need to be an agent at all? [L14 00:12–00:29] [L14 02:16]
Ask in this order; stop at the first "yes": a ready tool (Claude with a skill and a small CLI, a connector) → a decision on unstructured data (a cheap classifier or decision API) → a workflow (fixed steps with gates) → an agent (steps can't be known in advance). "Very often you don't need to build your own agent… focus on the product, not the technical details." [L14 02:16] An epic that says "agent" when a lower rung would do is a finding (ties to Build vs buy in `business-case.md`).

A RAG search fits a large, often-updated corpus of independent documents where answers need citations. Exact facts → SQL or a tool; behaviour or style → fine-tuning; state between sessions → agent memory. [L16 p.33] Long, interdependent documents (one function described over a hundred pages, half of it screenshots) are where RAG failed in practice. [L16 00:40–00:42] The retrieval review is `ai-agent-engineer` `references/rag.md`.

## 2. Evals are the success metric [L14 00:32–00:55]
- Likes alone don't work: fixing one complaint broke old answers, and nobody could tell whether the system was improving. Feedback is a source of eval cases, not the metric. [L14 00:33–00:35]
- The epic names the eval set, its size, the pass rate that counts as "done" (stop bar, `business-case.md`) and who keeps the set current. [L14 01:38]
- Before/after uses the same set. (own) The lecturer's "2.2x" compared an 11-case run with a ~33-row run [L14 p.46, p.110–111]. Ask which set a claimed gain was measured on.
- Every production failure becomes an eval case. [L14 read: CS146S 36:06]

## 3. Cost and latency [L14 00:54] [L14 p.82, p.106–109]
A user-facing feature names time-to-answer and cost per request as guardrails (`metrics.md`); an internal tool can focus on accuracy. Token use grows with autonomy — ask for a cost-per-request estimate and a cap. Prompt caching changes unit economics (cached input ≈5 % of the price).

## 4. Data and security questions for the PM [L14 01:52–02:04] [L14 00:23–00:25]
- What data does the LLM see, and can a user reach through it anything they couldn't reach without it? Rights must be enforced in the tools, never in the prompt. [L14 p.116]
- Every way the feature can send data out (lethal trifecta: private data + untrusted content + external communication). [L14 p.121–128]
- Irreversible actions (sending an email or a message) go out only after the user approves a draft. [L14 read: CS146S 19:49]
- Where the model runs and whether prompts are retained (cloud provider with zero retention vs self-hosted). [L14 00:23–00:25]

Review check: the epic answers sections 1–4, or each gap is a question for the PM. Hand the engineering review to `ai-agent-engineer`.
