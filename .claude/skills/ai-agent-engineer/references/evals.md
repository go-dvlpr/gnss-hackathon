# Measuring: evals and observability

Checkpoint [L14 p.51]: "Any performance improvements of AI systems should be guided by evals"; "Keep eval cases simple"; "Use temperature & seed for better reproducibility"; "Set up observability for faster iteration speeds".

## 1. Why likes don't work [L14 00:32–00:35] [L14 p.33–36]
- After the MVP they collected in-product feedback: a 1–10 rating, reason chips ("not true", "too long", "not useful", "didn't follow instructions", "answered when it shouldn't"), free text → Google Sheets → fixes.
- "Not sustainable": fixing one complaint broke what used to work, and nobody could tell whether the system was improving.
- Root cause: deterministic software → probabilistic system. The output space is unbounded, and the same question twice gives different answers. [L14 00:34–00:35] [L14 p.36]
- Feedback is a source of eval cases and of traces to read, not the metric. [L14 00:43] [L14 read: Evals FAQ]

## 2. The eval set [L14 00:35–00:44] [L14 00:50–00:52] [L14 01:38–01:40] [L14 p.37–46]
- Ground truth: a table of inputs and expected outputs. "Evals are surprisingly often all you need" (Greg Brockman). [L14 p.37–38]
- Their tool: a Google Sheet and about 100 lines of TypeScript. Ready tools (mlflow, promptfoo, Langfuse, LangSmith, trulens, traceloop) are "complex for a simple task" and their abstractions hide what happens — "own the process". [L14 00:42–00:44] [L14 p.44]
- Case columns: what is tested (search, calculation, lookup inside a contract), the input, the **expected output as bullet points** ("found the contract with this ID and mentioned these points"). The judge checks that the answer covers the bullets. [L14 00:43]
- Results columns: date, eval id, score 0/1, run scores (each case run 2–3 times), average, run id that opens the trace in Phoenix. [L14 01:39] [L14 p.46, p.111]
- Where to get cases: team complaints turned into clear scenarios, the most-failing cases first plus general ones. [L14 00:43–00:44] Ground truth from history where it exists: legal had "contract received → what we sent back" in the CRM; the diff is the expected highlight. [L14 00:52]
- A low first score is good — it shows what to fix. Theirs was 36 %. [L14 00:44]
- Size and cost: about 100 independent cases, run 10 in parallel; it gets expensive only if you run it 20 times a day. [L14 00:51]
- The set grows, and static cases go stale: a newly signed contract changes the right answer. Someone owns keeping it current. [L14 01:38]
- Never put eval cases into the prompt. Pasting test cases into the agent's prompt is "a bad idea". Prompt tuning can overfit to the set: keep a held-out part. [L14 01:40] [L14 read: Writing tools for agents]
- Before/after must use the same set (own). The lecture's 36.36 % was 11 cases with 2 runs; the 79.39 % "2.2x" was ~33 rows with 3 runs. [L14 p.46, p.110–111] Ask which set a claimed gain was measured on.

## 3. Checks, cheapest first [L14 00:36–00:39] [L14 00:52–00:54] [L14 p.39–42]
1. **Heuristics**: bounded output checked by code like a unit test — `expect(isCompliant(post)).toBe('YES')`, `toBeGreaterThan(0.7)`. [L14 p.39]
2. **LLM-as-judge** for free-form output: another LLM call (the same model with another prompt, no tools) returns **pass/fail**, not 1–10. The judge runs only in evals, not on every production answer. It sees the request, the final answer and the expected bullets — not the agent's steps; "not even an agent, just an LLM call" with structured output.
3. **Pairwise comparison by a person** when "good" is hard to describe (summaries). [L14 p.42]

From the lecture's reading list [L14 read: Evals FAQ]:
- Code assertions wherever a rule can check it. One judge per failure type; one judge for many failure types is "the most common mistake". Give a judge only the parts of the trace its failure needs. Start with a strong judge model, then test cheaper ones and measure the loss.
- **Validate the judge**: true positive rate (catches bad answers) and true negative rate (passes good ones) against human labels on a held-out split; read disagreements before tuning. The lecture never said how its judge was validated — ask the owner.
- Binary, not Likert. Gradual progress = several binary sub-checks ("4 of 5 expected facts"). Combine as "pass all"; no weighted composite score. The Mastra context-relevance score (weighted levels, hand-set penalties) is the counter-example. [L14 read: Mastra]
- Generic metrics (helpfulness, coherence, ROUGE, BERTScore) don't measure quality; use them only to pick traces to read.

## 4. Taming non-determinism [L14 00:39–00:42] [L14 00:48–00:49] [L14 p.43]
- `temperature = 0` changes only sampling (always take the most likely token), not how the model computes the distribution.
- `seed` fixes the sampler's random generator. OpenAI supported it (GPT-4); newer models may not, and some models may not accept temperature at all. Check the provider.
- Pass/fail removes the inherent "7 or 6?" noise.
- Run each case several times and average; the eval is a script, you pay only for tokens. [L14 00:41–00:42] A stricter alternative is pass^k — all k runs pass. [L14 read: think tool]

## 5. When to run [L14 00:50–00:51] [CS146S 36:06]
- After a change, not on a schedule. Working on specific cases → run only those. Before shipping to users → the full set, to catch regressions. "Smoke and a full run before release — globally, yes."
- The daily inner loop: the agent fails in production → the failure becomes an eval case → fix the harness, prompt or inference → check on evals → ship. [CS146S 36:06–37:41]
- Record the effect of each change separately; that's how they learned subagents and per-interaction summaries gave the most. [L14 01:39]

## 6. Error analysis before fixes [L14 read: Evals FAQ]
- "The most important activity in evals." Read at least 30 traces yourself; write down the **first** failure in each; group the notes into categories and **count** them; continue to ~100 diverse traces. Fix the biggest category first.
- Don't write a rubric before looking at data. Record every problem, even when the model isn't at fault.
- Trace sampling: random first, then clusters, outliers, traces a classifier flags, negative user feedback; always keep some random ones.
- Agents: end-to-end task success first, then step diagnostics — tool choice, arguments, error handling, context retention, efficiency. Multi-turn: find the first upstream failure and reproduce it in the simplest single turn.
- Abstention: include questions with no answer (false premises, missing context); an invented answer is a failure.
- Synthetic data: define dimensions, hand-write ~20 tuples, generate more tuples, turn them into text in a separate step. Synthetic data can't tell how common a failure is.
- CI = small curated set with deterministic checks; production = sampled live traces. Guardrails (inline, fast, deterministic) are not evaluators (async).
- An eval that always passes: run it less or retire it. Switch models only after error analysis.
- RAG: measure retrieval (Recall@k, MRR) separately from generation.
- Tool evals: realistic tasks needing many tool calls, a verifiable outcome that isn't too strict about format; track accuracy, runtime, number of tool calls, tokens, tool errors; read raw transcripts. [L14 read: Writing tools for agents]
- Authors spent 60–80 % of development time on error analysis and evaluation; "a 70 % pass rate can indicate a more useful eval" than 100 %.

## 7. Metrics besides accuracy [L14 00:54–00:55] [L14 p.82]
- An internal tool can focus on accuracy. A user-facing feature also tracks time to answer and cost per request; they stored time and tokens anyway.
- Autonomy grows fast, and so do token use and cost. [L14 01:14] [L14 p.82]

## 8. Observability [L14 00:44–00:47] [L14 00:49–00:50] [L14 p.47–50]
- "LLMs are black boxes. But AI agents must never be": given any run, find out exactly what happened and when — every decision, tool call and tool result.
- Don't build it. Phoenix (Arize): one Docker container, SQLite, a UI over all traces, plugs into LangGraph, Pi or any SDK. Others: Langfuse, LangSmith, Helicone, OpenLLMetry.
- It speaks OpenTelemetry, so add your own spans — put the judge's verdict in the same trace: request → agent steps → verdict. The trace shows the step where the agent went wrong.
- Works for Claude Code or Pi too, e.g. when Claude Code runs in GitHub Actions or on a server.

## 9. What the lecturer did not say [L14]
No latency or cost numbers for the lecture's assistant, no usage or business-metric change (only the eval score), how the "good" threshold was chosen, or whether the judge was checked against human labels. Ask the owner these about any agent.
