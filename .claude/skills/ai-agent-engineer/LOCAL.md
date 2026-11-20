# Local context: team copy for the hackathon

This is the team's copy of the `ai-agent-engineer` skill for the one-day hackathon on Sat 2026-11-21, 10:30–20:00. It lives in the team repo and is committed with it. It wins over the generic text in `SKILL.md`.

## Hackathon mode

- **There is no Jira and no existing agent.** What is being built is the idea in the **Project** section of the repo's `CLAUDE.md`. If a field there is still TODO, ask; do not guess.
- **Read `references/hackathon.md` first.** It says what to take from the other references in one day and holds the paste-ready prompts. The day's timeline is in `ai-product-engineer` `references/hackathon.md` §8.
- **The review is short, in chat, in Ukrainian.** No artifact, no Markdown report file. Verdict in up to three lines, then the checks from the end of `hackathon.md` (rung, golden set, limits in code, tokens and latency, brief + worktree + merger per task), each with `file:line`, then fixes ordered by what saves the demo.
- **Skip what needs production data or long runs**: production traces, 100-case sets, judge validation against human labels, prompt optimizers (GEPA, DSPy), durable workflows, always-on agents, tracing platforms. A JSONL log and a 10-case set are the bar for today.
- Running the golden set spends the team's tokens: say cases × runs × model and wait for a go.
- The repo's `CLAUDE.md` rules (demo path first, `main` always runs, `HACK:` marks, secrets in `.env`, ask before deleting or changing the stack) win over any advice in the references.

## The course

Genesis AI Product Engineering School, 2026-10-13 – 2026-11-26. The references are distilled from lecture notes (audio with timecodes, slides with page numbers); the notes are not in this repo. Tags this skill uses:

| Tag | Date | Lecture | Lecturer |
|---|---|---|---|
| L9 | 11-02 | Performance Marketing — MarTech (building AI tools fast, the stop bar) | Mykhailo Buslenko, AI Growth Engineer, Stay (6037) |
| L11 | 11-05 | Intro to AI-Assisted Development | Oleksii Rumiantsev, Head of Engineering, CopyMind |
| L12 | 11-09 | Workshop: AI Builder Battle (10-minute builds) | no slides or notes; lessons are tagged `(own, Battle)` |
| L13 | 11-19 | How we built an AI-native SDLC | Ihor Zakutynskyi, CTO, Universe (FORMA by Universe) |
| L14 | 11-12 | Engineering AI Agents: from LLMs to autonomous systems | Mark ⚠ (surname not in the recording), AI Lead, Genesis |
| L16 | 11-18 | Designing and Optimizing RAG Architectures | Pavlo Lysyi, ex-Machine Learning Team Lead, Universe |
| L17 | 11-20 | AI UX/UI for Engineers (`ai-product-engineer` `references/ux-design.md`) | Tamara Vitvitska, Product Design Lead, FORMA |
| CS146S | — | Stanford CS146S "How always-on agents work" (Grok Bot), from the L14 reading list | — |

The full course table (L1–L17) is in `../ai-product-engineer/LOCAL.md`. A ⚠ in a reference marks something the notes could not confirm; keep the mark when quoting it.
