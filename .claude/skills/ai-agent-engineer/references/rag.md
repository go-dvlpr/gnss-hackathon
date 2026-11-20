# RAG: retrieval before generation

Use when the agent answers from a document base: a knowledge-base chat, docs search, support answers with citations. Source: L16 (audio and 35 slides). Several slide rules were skipped in the audio; they carry only `p.N`.

## 1. Does it need RAG? [L16 00:38–00:40] [L16 p.33]
- Fits: a large corpus; documents updated and deleted often; documents independent of each other; answers that need citations and provenance.
- Another mechanism fits better: exact facts → SQL or a tool; behaviour or style → fine-tuning; state between sessions → agent memory. "RAG finds evidence; it doesn't run transactions, teach behaviour or own a memory lifecycle." [p.33]
- On memory the lecturer disagreed with his slide: RAG can serve memory, but one task's context is narrow and alike, so plain Markdown memory files you can read and edit work best. [L16 00:45–00:47]
- A failed case: thousands of pages of accounting-system docs, one function described over a hundred pages, half of it screenshots, all functions alike in embedding space. The team gave up. Long interdependent documents are a warning sign. [L16 00:40–00:42]

## 2. Every step can lose the answer [L16 00:00–00:02, 00:27–00:30] [L16 p.2–3, p.27]
- "Answer quality is bounded by the quality of the evidence found"; "prompt engineering won't bring back evidence that isn't in the context." [p.2–3] If the needed chunk isn't in the top 5, the RAG is built badly. [L16 00:01]
- **Offline**, once per corpus update: sources → parse/OCR → chunking (+ LLM rewrite, metadata) → embeddings → BM25 + vector index.
- **Online**, per query: query prep (rewrite + filters) → BM25 + dense retrieval → rerank → top chunks → LLM → answer + citations. The LLM gets chunk texts, not vectors.
- One document changed → re-chunk and re-embed only its chunks; many changes → re-run everything, it is cheap. [L16 00:40]

## 3. Chunking [L16 00:02–00:06] [L16 p.5–10]
- A whole long document embeds into a vector "close to everything and far from everything"; cut it into chunks. [L16 00:01–00:02] "Chunking is a relevance decision, not preprocessing." [p.5]
- Fixed windows split a claim from its evidence; overlap is a baseline that costs more vectors and duplicates in top-k. [p.6–7] The lecturer: overlap plus an LLM rewrite into logical blocks is "more than enough" in industry. [L16 00:05]
- Independent pages (a business knowledge base): one page = one chunk — the best case. [L16 00:03–00:04]
- Coherent text: parent–child — rank by the precise child, give the LLM the parent: "separate the unit of ranking from the unit the LLM reads." [L16 00:04–00:05] [p.9] Structure-aware chunking (section → paragraph → sentence; never break tables, lists, code) needs less overlap. [p.8]
- Measure, don't guess [p.10]: small without overlap → medium with 10–20% overlap → structure-aware + parent expansion; compare answer-bearing Recall@k, duplicate rate and context waste, sliced by text, tables, code and lists; take the cheapest configuration that steadily returns the full evidence. "There is no universal 500-token rule." The lecturer admits teams usually just eyeball the answers. [L16 00:06]

## 4. Filter before searching [L16 00:06–00:13] [L16 p.11]
- Hard constraints — tenant, ACL, language, product, version, date range, validity window — go through a metadata **pre-filter**: SQL the LLM writes against a known schema, or self-query that pulls filters out of natural language. Semantic search then runs on the subset.
- Why: embeddings don't order numbers ("from 2000" pulls 1999 and 2001) and blur near-identical items (docs for two adjacent phone models). [L16 00:07–00:12]
- **"Authorization is a pre-filter, not an instruction in the prompt and not a post-filter after the leak."** [p.11] Same rule as `security.md` §1.

## 5. Embeddings and the model [L16 00:08–00:21] [L16 p.13–19]
- An embedding helps only when its distance matches your definition of relevance; it is not a dictionary and doesn't guarantee facts. [p.13–14]
- Typical misses: negation ("do not delete" ≈ "delete"), versions and dates (2024 policy ≈ 2026 policy), numbers ($15 ≈ $150), near entities (EU ≈ US branch). Protect critical differences with metadata, BM25, reranking and separate eval slices. [p.18] [L16 00:19]
- Cosine similarity is the default. [L16 00:15] [p.16]
- Dimensions: the lecturer calls the cost negligible (768 or 1536 work; 3072 adds a few percent). The slide counts memory — 1M float32 vectors: 384 ≈ 1.5 GB, 768 ≈ 3.1 GB, 1536 ≈ 6.1 GB, plus the index — and says more dimensions don't guarantee better retrieval. [L16 00:13–00:14] [p.15] Decide by Recall@k, latency and budget.
- Choosing a model [p.19]: filter by modality and languages → compare retrieval score, size, context length, licence → test 2–5 models on your own golden set → pick the balance of Recall@k, latency and cost. "MTEB gives a shortlist; your own queries pick the winner." Multimodal models put text and images in one space. [L16 00:20–00:21]
- Fine-tuning an embedding model for another language is "not a trivial task" the lecturer wouldn't take on. [L16 00:49] Lemmatisation and stop-word removal are not done by default; he would not strip word endings, since the models are trained on full text. [L16 00:43–00:44]
- Storage: any vector store works; a small base doesn't need a vector database. [L16 00:28, 00:47–00:48]

## 6. Lexical plus semantic, then rerank [L16 00:23–00:29] [L16 p.17, p.22–26]
- BM25 (TF-IDF family) wins on exact terms: error codes, IDs, names, versions, rare words. Dense retrieval wins on paraphrase and multilingual queries. "Don't make one model solve both exact identity and paraphrase." [p.17, p.23–24]
- **Hybrid**: BM25 top-50 + dense top-50 → fusion by rank, without mixing score scales → reranker → top-5. A document both lists found outranks one found by one list. "Production RAG usually starts with hybrid, then adds reranking." [L16 00:25–00:27] [p.22, p.25]
- **Reranker**: a cross-encoder reads query and chunk together over a short list. "The first stage protects recall, the reranker raises precision." It can lift a chunk from 15th to 10th place and into the context. [L16 00:29] [p.26]
- The lecturer also called the fusion step "a reranker"; in a review keep the two apart.

## 7. Measure retrieval apart from the answer [L16 00:30–00:37] [L16 p.28–31]
- Recall@k — did we find the evidence; Precision@k — how much of what we returned is useful; MRR — how high the first right result sits (1st → 1.0, 2nd → 0.5, 5th → 0.2); nDCG — how well the whole list is ordered. **Start with answer-bearing Recall@k.** Tune retrieval k and context k separately: a bigger k lifts recall and adds noise. [p.28–29]
- The lecturer has never seen a project compute these and never used MRR or nDCG himself, yet strongly recommends at least Recall@k, rechecked when chunking, the embedding model or the system prompt changes. [L16 00:31–00:34]
- Full evaluation [p.30]: golden queries (real user questions) → **hand-labelled** relevant chunks ("no way around manual work") → retrieval metrics → generation: faithfulness (every claim verifiable), relevance (answers the query), citations (the source really supports it) → product: task success, latency, cost. [L16 00:32–00:36] The generation checks are not retrieval metrics [p.31]; build them as in `evals.md` (pass/fail judge, validated).
- A wrong answer's trace must show where it broke: search, context or generation. [p.30]
- Bad signs: no "I don't know", an answer built from wrong documents; an LLM rewrite that made chunks too generic; documents that never help — remove them from the corpus. [L16 00:36–00:37] An off-corpus question gets an honest "I don't have this information", set in the system prompt. [L16 00:30]

## 8. Production [L16 00:37–00:40] [L16 p.32]
- Embeddings and search are cheap; the answering LLM is the main cost. Cutting context from top-10 to top-5 saves money and loses the answer that sat 6th. [L16 00:37–00:38]
- Like or dislike per answer, logged with the retrieved documents. [L16 00:37]
- Keep the golden set and rerun it on every redeploy; watch model retries, caches and load. [L16 00:38]
- Slide checklist, skipped in the audio [p.32]: ACL pre-filter + provenance; **retrieved text is untrusted data** (`security.md` §3); a degraded path (lexical-only or a safe refusal); a trace "query → candidates → ranks → context → answer"; versions of parser, chunker, embedding model, index and prompt; timeouts, retries, caches, fallbacks, atomic index swaps. "If an answer can't be reproduced from the trace, the system isn't operationally controlled yet."
- Conflicting documents (one says 1M users, another 2M): rewrite or deduplicate, prefer the current version, or add a TTL so stale documents lose weight or drop out. [L16 00:39]

Review check: the corpus and how it is chunked; the filters, and whether authorization is one of them; retrieval (BM25, dense or hybrid; reranker; k); the golden set and its Recall@k; the generation checks; what the trace shows for one wrong answer.
