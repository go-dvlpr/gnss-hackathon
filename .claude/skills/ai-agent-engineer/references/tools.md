# Tools: the contract between code and the agent

"Tools are contracts between deterministic software and non-deterministic agents." [L14 read: Writing tools for agents] Invest in tool definitions as much as in prompts. [L14 read: Building effective agents]

## 1. Fewer tools [L14 01:05–01:08] [L14 p.72–76]
- Models are trained separately for tool use (Berkeley Function-Calling Leaderboard); tool definitions are the biggest part of any agent's system prompt. [p.72–73]
- "Be sceptical about the tools an agent has and minimize their number" — every tool loads the choice. [L14 01:07–01:08]
- With hundreds of tools or a very small model — **RAG over tools**: the LLM first describes the ideal tool, semantic search returns the closest ones (Less is More: big gains on Phi3-8b; reducing 46 → 19 tools turned a failure into a success). [L14 01:06–01:07] [p.74–76] [L14 read: Less is More] It transfers weakly to Sonnet-class models; the lesson is "fewer tools in context".
- Progressive loading: only tool names go into the prompt; the full description is read on demand (Claude Code tool search; Grok Bot "files and a file system all the way down"). [L14 01:08–01:11] [p.78] [CS146S 20:04–21:30]
- "More tools don't always lead to better outcomes." Don't wrap every API endpoint; consolidate (`schedule_event`, not list + create; `search_logs`, not `read_logs`; `search_contacts`, not `list_contacts`). [L14 read: Writing tools for agents]

## 2. CLI and skills over MCP [L14 01:09–01:12] [L14 p.79]
- "Always CLI." A CLI composes: pipes through bash and jq between tools. For agents that run on a computer, skills are more efficient than MCP and also load dynamically.
- MCP's one advantage is portability — in web Claude a link to the server is enough.
- L11 is softer — "choose at your discretion": a CLI barely uses context (the agent reads `--help` when needed) but needs a terminal and machine access; MCP brings ready descriptions and auth and works without a terminal (web, desktop, cloud agents), but its tool descriptions cost context — Chrome DevTools MCP ≈ 18,000 tokens. [L11 p.51]
- Code Mode makes MCP tools callable from code, so data moves between them outside the model's context. [L14 00:18] [p.24]

## 3. Outputs [L14 01:09–01:10] [L14 p.77] [CS146S 28:56–29:51]
- Push long outputs to a file: the context gets a truncated version with "full output is in this file" and the agent reads only what it needs (Pi: `seq 1 100000` → 2000 lines + file path).
- Return high-signal fields (names, not UUIDs; resolving UUIDs to names reduced hallucination); a `response_format` CONCISE/DETAILED (concise used ~1/3 of the tokens); pagination, filtering, truncation with sensible defaults (Claude Code caps tool responses at 25k tokens); when truncating, steer toward many small targeted searches. [L14 read: Writing tools for agents]
- Screens, cheapest first: accessibility tree, then HTML, then screenshot; click by pixels only for modals; ask a person for 2FA or captcha. [CS146S 22:35–23:29]

## 4. Descriptions, names, arguments [L14 read: Writing tools for agents] [L14 read: Building effective agents]
- Write descriptions like docs for a new hire: examples, edge cases, the boundary between similar tools; make implicit context and niche terms explicit. Small description tweaks gave large gains.
- Unambiguous parameter names (`user_id`, not `user`); strict data models; poka-yoke the arguments ("we changed the tool to always require absolute filepaths").
- Namespacing by service or resource (`asana_projects_search`); prefix vs suffix changes results — test it.
- Formats the model sees often in natural text; avoid formatting overhead (line counting, string escaping); give it room to think before committing.
- Trim long tool descriptions and schemas. [CS146S 25:17–26:29]

## 5. Errors [CS146S 26:13–26:29] [L14 read: Writing tools for agents]
- Write errors for the agent the way you would for a person: what failed and what to do next. "There is some DX in designing good error messages for agents too." Not opaque codes or tracebacks.
- An unavailable tool returns an error instead of disappearing from the list (cache). [L14 p.109]

## 6. When to add a dedicated tool [CS146S 25:47–26:11]
- "One tool = shell" works, but if the model spends 90 % of its time running shell for one thing, make a dedicated tool: more efficient, and clearer to the people reading traces.
- Cheapest source first: what's already in the conversation → plugin, MCP or API → web search → browser on the VM → the whole desktop → only then ask the user. [CS146S 21:30–22:35]

## 7. Thinking between tool calls [L14 read: think tool]
- A no-op "think" tool gives the model a place to reason about tool outputs mid-chain; the gain came from a domain prompt with examples of how to think, not the tool alone. Anthropic now recommends extended thinking instead in most cases. Use it for policy-heavy, sequential, costly decisions; not for simple or parallel calls.

## 8. Building tools with an agent [L14 read: Writing tools for agents]
Prototype (give Claude Code the API docs) → eval with realistic tasks → paste transcripts back into Claude Code to refine → check on a held-out set. Redundant calls hint at pagination or token limits; many invalid-parameter errors hint at unclear descriptions.
