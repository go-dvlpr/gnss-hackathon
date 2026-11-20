# Improving: context engineering

"Very often, the problem of AI agent optimization is a problem of context token-efficiency maximization." Prompt engineering → **context engineering**. [L14 00:58–00:59] [L14 p.58] Context engineering is also called harness engineering. [CS146S 27:26]

## 1. Context is the "thinking juice" [L14 00:55–00:59] [L14 p.54–57]
- "The model's ability to think is its context window, and the fuller it is, the worse the model thinks."
- Evidence from the slides: Chroma "context rot" — the same simple question degrades with irrelevant text before it, to about 50 % at 10k extra tokens, even on Claude Sonnet 4 [p.55]; LangChain multi-needle — the fuller the context, the worse the model recalls facts, especially from the start [p.56]; LongMemEval focused vs full context — Opus 4 0.92 vs 0.38, Opus 4 with thinking 0.95 vs 0.72 [p.57].
- And every token is paid for. Every token "must earn its place". [L14 00:58–00:59]
- Everything that enters the LLM is context: tool definitions (name, description, schema), system prompt, rules, skills, message history. [L14 00:59–01:00] [L14 p.59]

## 2. The four principles [L14 01:00] [L14 p.60, p.112]
1. **Minimize** — RAG, context pruning, effective tool management.
2. **Compact** — ideally on every interaction.
3. **Isolate** — subagents.
4. **Give better context** — prompt optimization (GEPA, MIPROv2), and a stable cached prefix.
The lecture's example went 36 % → ~80 % on its evals (measured on different sets, see `evals.md`); the biggest wins were **context isolation with subagents** and **per-interaction summaries**; prompt tuning also helped a lot. [L14 01:35–01:36, 01:39–01:40] [L14 p.110–111]

## 3. Minimize
**RAG** [L14 01:01–01:03] [L14 p.64–65]
- Contextual retrieval: for each chunk an LLM writes a short note on how it relates to the whole document, prepended before embedding and before the BM25 index. Anthropic: failure rate 5.7 % → 3.7 % (contextual embeddings) → 2.9 % (+ contextual BM25) → 1.9 % (+ reranking top 150 → top 20); one-time cost ~$1 per million document tokens with prompt caching. [L14 read: Contextual Retrieval]
- BM25 for exact identifiers, numbers, company names; fuse dense (embedding) and sparse (BM25) results with reciprocal rank fusion.
- A small model generates, for each chunk, the questions it answers; at query time several rephrasings and BM25 keywords that use the document's terms. "At first RAG worked quite inefficiently" — this boosted it a lot.
- A knowledge base under ~200k tokens (~500 pages): put it all in the prompt with caching and skip RAG. [L14 read: Contextual Retrieval]
- Late chunking: embed the whole document with a long-context model, then pool per chunk, so chunks keep surrounding context; gains grow with document length. [L14 read: Late Chunking]

**Context pruning** [L14 01:03–01:05] [L14 p.66–70]
- A separate model gets the question and the context and drops irrelevant sentences (Provence, DeBERTa-based, rerank and prune in one pass): fewer tokens and higher quality, 50–80 % compression. Limits: QA over prose, English, single passage. [L14 read: Provence]
- "Any improvement is always more effective for smaller models." [L14 01:04]
- Caveman: a skill that makes the agent talk like a caveman — ~33 % fewer input tokens, ~54 % cheaper, but quality may drop: "this has to be tested". [L14 01:04–01:05] [L14 p.69–70]

**Tool management** [L14 01:05–01:12] [L14 p.71–79] — details in `tools.md`
- Tool definitions are the biggest block of a system prompt. [p.73]
- Minimize the number of tools; with hundreds of tools or a small model, RAG over tools. [p.76]
- Load tool definitions progressively. [p.78] [CS146S 20:04–21:30]
- Push long tool outputs to a file. [p.77]
- Prefer skills with CLIs to MCPs. [p.79]

## 4. Compact [L14 01:14–01:19] [L14 p.81–87] [CS146S 31:31–34:28]
- Each model generation works autonomously longer, but token use and cost grow exponentially too. [L14 01:14] [L14 p.82]
- **Trimming** (drop the oldest messages) is simple but breaks the cache. **Compaction** (summarize history into one message) as in Claude or Codex; can run before the limit. [L14 01:14–01:16]
- **What worked best for them**: a small model summarizes **every interaction** (user message + agent answer) into a dense 20–40-word factual bullet list, keeping key IDs; the summaries are cached. The agent gets all interaction summaries + the **last interaction in full** + the new request. Fewer tokens boosted performance even without hitting the window. [L14 01:16–01:17] Summarizer prompt (verbatim, [L14 p.85]):
  > Your task is to generate a very information-dense 20-40 words bullet-point chronological summary of the given conversation for the purposes of remembering it. 1. All the essential information about the interaction should be present in the summary. 2. If the interaction mentions contracts and their IDs are available, state contract IDs in the summary. If not, totally ignore this point. 3. Act as a reporter, only stating factual information about the interaction without making any summaries, conclusions, or inferences. Output only the bullet-point summary and nothing else. Start each line with '-'.

  Input: `<human>${human}</human> <assistant>${assistant}</assistant>`.
- Provider-specific: OpenAI returns encrypted compaction items (`/v1/responses/compact`). [L14 01:17–01:18] [L14 p.86]
- **Compact while the cache is warm** (10–60 min): it is cheap then, and the user returns to a summary. [L14 01:18–01:19] [L14 p.87] [CS146S 32:09–32:44] "All compression is lossy." [CS146S 31:31]
- Memory layers (Grok Bot): core facts about the user in every prompt; facts picked by an algorithm and garbage-collected; dated conversation logs; a scratchpad for 30–60 minutes; everything else found through files with grep. [CS146S 08:10–09:17, 32:51–34:28]
- Claude's memory, by contrast: on-demand search over raw history (`conversation_search`, `recent_chats`), no summaries or profile. [L14 read: How Claude memory works]

## 5. Isolate [L14 01:19–01:24] [L14 p.88–95] [CS146S 06:42–07:16, 23:29–25:12]
- Problem: "how did this contract change over the years?" pulled 5–10 contracts into one context.
- **Subagent as a tool**: the main LLM talks to the user and only knows which contracts exist; for details it calls a tool in which another LLM reads the contract and returns a focused answer. Context 1 = conversation, context 2 = reading. [L14 01:20–01:21] [p.90–91]
- Bonus: run subagents concurrently, one per contract. [L14 01:21] [p.92]
- Grok Bot: the main agent is an orchestrator that keeps the conversation sparse, answers quick questions itself, hands bigger work to helpers (computer use, video, coding) and gets back a short report; it keeps a to-do, can check on, message or stop a helper. Subagents with fresh working memory = "effectively an unlimited context". "Modeled after the ideal way you would scale a team of engineers." [L14 01:22] [p.93] [CS146S]
- Recursive Language Models: the root LM gets only the query; the long context is a variable in a Python REPL; it writes code to peek, grep, partition and calls sub-LMs. OOLONG 132k tokens: RLM(GPT-5 mini) 64.9 % vs GPT-5 30.3 %. The lecturer hadn't tested it: "experimental, for specific use cases"; most useful for small models. [L14 01:22–01:24] [p.94–95] [L14 read: Recursive Language Models]

## 6. Better context: prompt optimization [L14 01:24–01:31] [L14 01:40–01:43] [L14 p.96–104]
- Why does Claude Code beat Cursor, Cline, Copilot on the same models? Partly hyper-optimized prompts: Anthropic tunes the model to its own harness (tool names, call format). [L14 01:24–01:25] [p.97]
- Old advice ("shout at the LLM") goes the same way, but now it is automated: MIPROv2 and GEPA evolve a pool of candidate prompts — a stronger LLM reads the results, proposes mutations and merges, "while budget > 0" — **guided by the eval**. HotpotQA on GPT-4.1 Mini: baseline 38 %, MIPROv2 58 %, GEPA 69 %. [L14 01:26–01:28] [p.99–100] GEPA learns from natural-language traces and evaluator feedback, beats MIPROv2 with shorter prompts, and prompts transfer between models. [L14 read: GEPA]
- **DSPy**: describe the task declaratively (a Signature: sentence → sentiment) and let DSPy build the prompt; a few lines plug in an optimizer where a big model (GPT-5) tunes a small working model on the eval set; rerun when a new small model ships. [L14 01:28–01:31] [p.101–104] Data: ~30 examples give value, aim for 300; prompt optimizers overfit small train sets, so split 20 % train / 80 % validation (GEPA: standard split). [L14 read: DSPy]
- "Experimental, maybe even esoteric"; choose by constraints — model size and call frequency. [L14 01:31]
- Cheaper first steps: OpenAI Playground's prompt optimizer for a given model; each lab's prompt guide for each model; ask Claude for deep research over the guide and users' experience. For image generation "prompt optimization is everything". [L14 01:41–01:43]
- Risk: a prompt fine-tuned to your eval set; keep held-out cases. [L14 01:40]

## 7. Cache [L14 01:31–01:35] [L14 p.105–109] [CS146S 27:49–31:31]
- Intermediate computations are cached by **prefix**; change the prefix and you pay in full. [L14 01:31–01:32]
- Prices (OpenAI example per 1M tokens): input $2.00, cached input $0.10 (5 %), cache write $2.50, output $10. A loop with a stable prefix makes each next call much cheaper; affects input, not output. [L14 01:32–01:33] [p.107] Cache-hit charges are often a large share of agent cost; newer models shrink the KV cache (DeepSeek V4.1-Flash 890 bytes per token vs 389,120 for V1). [p.108]
- "Avoid cache misses at all cost." "If there's a cache miss, it's kind of like a bug in the system." [p.106] [CS146S 29:51]
- Grok Bot cache rules [p.109] [CS146S 25:17–31:19]:
  - until the next summary, the tools, system prompt and first message stay exactly the same;
  - a deploy that changes a tool description gives running conversations a note, not the new text;
  - everything is built in a fixed, sorted order;
  - tools are never added or removed for a single turn; an unavailable tool returns an error;
  - each prompt section is hashed separately, so you see which part changed (and an A/B test of one section doesn't break everyone's cache);
  - warm the cache when the user opens the chat or starts typing.
- Trimming old messages breaks the cache [L14 01:15]; compact while the cache is warm (§4).

## 8. Practical habits for coding agents [L14 01:08–01:13] [L14 01:44–01:48]
- Turn off MCPs you don't use; remove even unused default tools from the client config. Before progressive loading the first message cost ~20k tokens. [L14 01:08–01:11]
- Skills are Markdown files and hard to keep updated; a CLI that syncs skills across Claude, Codex and Cursor helps. [L14 01:12–01:13]
- Several repos: one folder with all projects, name the folders with @; codemap tools and semantic indexes "don't work well" — "just grep, Claude finds it fine". [L14 01:46–01:48]
