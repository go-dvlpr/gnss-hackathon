# Architecture: workflow or agent, loop, harness

## 1. The LLM as a building block [L14 00:07–00:12] [L14 p.10–12]
- Treat the LLM as a black-box node. It becomes useful when its output can be parsed and used: code, a DSL, a function call, structured output (Zod or JSON Schema). [L14 00:08–00:10]
- Before native tool calling, libraries like guidance forced structure even out of a 4B model through prompting and retries ("capital of Sweden, pick A–D"). [L14 00:08–00:09] [L14 p.11]
- Think of the LLM as a pure function: prompt (+ params) → result (+ logprobs). [L14 00:55] [L14 p.54]

## 2. The ladder: stop at the first rung that works
1. **A ready tool.** Claude or Claude Code with a skill and a small CLI, or a connector. About the lecture's contract-search assistant: "if we built it today, it would just be a skill with a small CLI" over the indexed Google Drive; no custom UI, the team already pays for Claude. Build your own only without a subscription or with special constraints. "Ready solutions are always better than reinventing the wheel." [L14 00:28–00:29] Last words of the lecture: very often you don't need your own agent; focus on the product, not the technical details. [L14 02:16]
2. **A decision on unstructured data.** "Very often we don't need an LLM; we just need a decision on unstructured data": cheap, fast decision models and APIs (OpenAI Decisions API, "System One" models) sit on the accuracy-vs-cost frontier. [L14 00:11–00:12] [L14 p.16–17] At very high volume (a million ad creatives) train a classifier or adapters on a foundation model (Qwen); the LLM at most prepares training data. [L14 00:30–00:31]
3. **A workflow.** LLM calls chained with static gates between them. [L14 00:10] Patterns: prompt chaining with a gate; a router that sends a request by complexity to an expensive or a cheap model; parallel models from different providers plus an aggregator (e.g. deep research: ask several providers, then merge). [L14 00:10–00:11] [L14 p.13–15] Anthropic adds orchestrator-workers and evaluator-optimizer, and says: find the simplest solution and add complexity only when needed. [L14 read: Building effective agents] A compliance classifier from the lecture is "not an agent, more a workflow". [L14 00:06]
4. **An agent.** "The same LLM, but it interacts with the environment in a loop until it decides the task is done." The key is autonomy: the execution path is not defined in advance. [L14 00:14] "Has tools" is not the definition: a workflow step can also emit code that we run. [L14 00:13] An agent needs a stop condition (a max step count), costs more and compounds errors; it fits open-ended problems whose number of steps can't be predicted. [L14 read: Building effective agents] [L14 p.19, p.30]

Review check: name the rung the system is on and whether a lower one would do. "Agent" where a workflow or a ready tool would do is a finding.

## 3. The loop [L14 00:15–00:19] [L14 00:26–00:29] [L14 p.19–25]
- **ReAct**: reasoning + action on every step. Downside, token-hungry: whatever it read stays in context for every later iteration, so both cost and quality suffer. [L14 00:15–00:16] [L14 p.20]
- **CodeAct** (paper, Wang et al. 2024): the action is code; only the code's output enters the context. Composable: 50 actions in one piece of code instead of 50 turns of the loop. Used by Manus; library: Hugging Face smolagents. [L14 00:16–00:17] [L14 p.21–23]
- **Code Mode** (Cloudflare): MCP tools become a TypeScript API; the agent writes code in an isolate that calls them and passes data between them without pulling it into the model's context. [L14 00:18] [L14 p.24]
- The action/feedback channel can be anything — code, JSON, a DSL. What matters is the loop with the environment. [L14 00:18–00:19] [L14 p.25]
- Claude Code is not CodeAct: it writes scripts but still calls MCP tools as tools. Pi has an experimental Code Mode. [L14 00:26–00:27] Inside Pi or Claude a plain ReAct with tools "works well enough"; the choice matters when you build the loop yourself. [L14 00:29]

## 4. Frameworks and harnesses [L14 00:19–00:22] [L14 p.26–29]
- Low level, when you control the loop: LangGraph (TypeScript and Python, Studio to see the graph and step through each node's state) — what they used most. Also crewAI, OpenAI Agents SDK.
- High level, "a strong LLM with skills and MCP tools running somewhere in the cloud": OpenCode, Pi (minimal coding agent, 1.0, plugin system that reaches down to what goes into the LLM).
- Frameworks hide prompts and responses; start with the raw API. [L14 read: Building effective agents]
- A chat UI doesn't need building: OpenWebUI gives streaming and a Completions connection. [L14 00:05–00:06]
- The contract-search assistant v1: chat history + user query → LLM ↔ tools (search contracts; search within a contract by keywords or semantically; web search) → response, on LangGraph for control. [L14 00:21–00:22] [L14 p.29] Every fact in the answer links to the exact paragraph in the source. [L14 00:04–00:05]

## 5. Where the model runs [L14 00:23–00:25]
- In the lecturer's view, local or self-hosted models are "always a bad idea", except an air-gapped server; in 99 % of cases it is hardware pain and much lower performance. Self-host only when the hosted model refuses the task or the case is special.
- Use Anthropic or OpenAI models through a cloud provider (AWS): a separate entity from the lab that does not share data with it; Zero Data Retention is available. If AWS fails, the database on AWS fails too — the risk is the same as for the rest of the infrastructure.

## 6. Always-on and server-side agents [CS146S]
- A harness is "a model calling tools in a loop"; on a laptop it dies when the lid closes. An always-on agent runs on a server, survives restarts, has its own computer (a cloud Linux VM with files, browser, desktop) and builds memory of how you work with it. [CS146S 00:21–01:13]
- It is woken by events, not only messages: Slack, email, meetings, routines (a prompt on a schedule, like cron). A router removes duplicates and decides whether to bother the user: "not everything is actually important". It "knows when to be quiet". [CS146S 01:21–01:52, 09:47, 11:15–12:19]
- Sleep and wake: state (conversation, memory, routines) lives in a database; the VM starts only when a computer is needed — for cost. [CS146S 10:13–11:12]
- Thin client, thick server: the loop and heavy tools run on the server; never put the agent loop on the VM, so the VM can be stopped or rebuilt on its own. [CS146S 13:33–15:24]
- Durable workflow, not a job queue: after a crash at step 3 it resumes from step 3 instead of repeating 1–3. They use Temporal rather than rebuilding it. Each helper is its own durable workflow. [CS146S 16:17–17:21, 23:29]
- Message priority: a direct message interrupts the current loop; group chats, threads and routines queue; several quick messages merge into one turn. [CS146S 17:22–18:06]
- One tool between client and server, `send_user`; the client decides how to render (a form, a payment, an email draft to approve before an irreversible action, an emoji). [CS146S 18:19–19:59]
- People steer the agent mid-task ("actually do that on Thursday") instead of queueing commands. [CS146S 04:30–04:56]

## 7. Build little [CS146S 37:44–38:34, 43:25–45:10]
- "The models today are the worst they'll ever be": build as little as possible for the next model generation and expect to redo the UI.
- System design and architecture matter more than ever; build your own harness once to understand the parts; learn how LLMs work the way engineers once learned how a database works.
