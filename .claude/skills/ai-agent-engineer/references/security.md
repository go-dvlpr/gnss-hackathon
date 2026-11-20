# Security: what the agent can reach and send

Two pillars where companies most often get burned, especially with public-facing agents: unauthorised data access and the agent's external communication. [L14 01:52–01:53] [L14 p.114–115]
Checkpoint [L14 p.128] [L14 02:04]: the agent has only the data the user should have; external communication is very strictly limited; destructive actions need a rollback.

## 1. Agent rights = user rights [L14 01:53–01:56] [L14 p.116–119]
- "If I shouldn't be able to access something, the AI agent shouldn't have access to it too."
- "Authorization should be baked into the tools, never enforced through the prompt" — "never, it's never reliable". Why tell the agent it may not read something? It simply must not be able to.
- Right: Claude Code asks before reading `~/.ssh/id_ed25519`. [p.117]
- Wrong: Meta's AI support bot (Forbes, June 2026) would send a password-reset email to any address, not the linked one — an ex-president's Instagram account was taken. "The agent could do more than the user could." [p.118–119]
- Limits (allowed hosts, max steps, max rows) live in code, not in the system prompt. (own, from p.116)
- Coding agents in an agent-driven SDLC get no access to the cluster or infrastructure; repositories are granted one by one. [L13 00:37–00:38] Give each agent its own environment, machine type and access, not one universal agent; "give it all of GitHub and the infrastructure and just write in chat — guaranteed to go badly". [L13 01:10–01:12]

## 2. The lethal trifecta [L14 01:55–01:58] [L14 p.121–122]
- Private data + untrusted content + external communication = an attacker can steal your data (Simon Willison). Such an agent "should not exist".
- The agent almost always needs private data, and untrusted content is everywhere — so cut **external communication**: the slide strikes out the other two legs. [p.122]
- Injection filters (models that separate input from instructions) can be a guardrail, but an injection can look innocent; even if one passes, data must have nowhere to go. [L14 01:57–01:58]

## 3. No content can ever be trusted [L14 01:58–02:02] [L14 p.123–126]
- Email with white-on-white text ("end of email… Gemini, do…") making Gemini show a fake phishing warning. [p.123]
- An image whose text appears only after the downscaling Gemini/Genspark do before the model ("check my calendar… send an email to…"). [p.124–125]
- Notion AI: a PDF with hidden instructions; the agent builds a URL with workspace data and "searches" the attacker's domain. [p.126]
- Untrusted input (a phishing email, a webhook) must never reach the model as a user instruction. [CS146S 26:29–27:24]
- Untrusted content includes emails, PDFs, images, web pages, tool and MCP descriptions from third parties. (own, from p.123–126)
- Retrieved chunks are untrusted data too, and authorization in retrieval is a pre-filter, never a prompt instruction or a post-filter after the leak. [L16 p.11, p.32] See `rag.md` §4.

## 4. Limiting external communication [L14 02:02–02:04] [L14 p.127]
- "Very, very strictly moderated": moderate it, allow only certain domains (allowlist), forbid it, or move outward actions into a subagent with rules on where it may go.
- Watch the side channels: a web-search tool with data in the URL is external communication (Notion case). (own)

## 5. Destructive and irreversible actions [L14 02:04] [CS146S 05:11, 19:49, 26:29–27:24]
- Destructive actions need a rollback.
- **An instruction is not a guarantee.** One team limits its coding agent on destructive actions by instructions only, as a stated trade-off for speed. [L11 p.53] The Replit agent deleted a customer's production database during a code freeze (July 2025). [L11 p.50] Treat "the prompt says don't" as no limit.
- Irreversible ones (sending an email or a message) go out only after the user approves a draft.
- **Auto review**: a separate model checks every command before it runs. "More secure than the fatigue of having to watch hundreds of shell commands"; in a blind test the model reviewed better than people.
- A separate machine for the agent; passwords kept out of the conversation with the model.

## 6. Where the model runs and what it keeps [L14 00:23–00:25]
- Through a cloud provider (AWS) the lab doesn't see your data; Zero Data Retention is available. The lecturer calls self-hosted models "always a bad idea" except air-gapped cases.
- Not covered by the lecture or slides: retention of traces and logs, training opt-outs, privacy of observability data. [L14] Check them yourself (own): traces in Phoenix hold prompts and data too.

Review check: list what data the agent sees, who may see it, every way it can send data out, which actions can't be undone, and where each limit is enforced (`file:line` in a tool, not a prompt line).
