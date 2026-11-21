# gnss-hackathon

This is a one-day hackathon on Saturday, 2026-11-21, from 10:30 to 20:00. Several people and AI sessions share the repository. Build a thin end-to-end slice of the live demo first and keep `main` runnable.

## Project context

Read the Project section of [CLAUDE.md](CLAUDE.md) for the idea, hypothesis, success metric, demo steps, stack, local run command, and demo URL. Read [PLAN.md](PLAN.md) for the day plan: timeline, roles, judging criteria, the mandatory pitch slides, evals, and the README sections required at code freeze. Ask the team when a decision marked TODO blocks your task. Update the shared instructions in the same commit when changing the API, environment variables, or run command that teammates rely on.

## Changes and collaboration

- Read the files you intend to change. Keep diffs small and scoped, and avoid unrelated formatting, renames, and moves.
- Use a short-lived branch for each feature and sync with `main` before starting and before merging. Make small commits with clear messages. Never force-push to `main` or rewrite shared history.
- Use mock data and temporary shortcuts where they help the demo. Mark shortcuts with `HACK:` comments. Add dependencies only when they save meaningful time. Ask the team before adding a framework or paid service, changing the stack, or deleting files.
- Work on the backend by default. Before frontend edits, tests, builds, or Git operations, describe the scope and wait for explicit frontend approval. For approved UI work, read `DESIGN.md` if it exists and record accepted design decisions there.
- If working in Go, favor idiomatic code, focused functions, explicit errors, and the standard library where it suffices. Reuse existing code and introduce interfaces where they help isolate meaningful dependencies.

## Secrets and verification

- Keep local secrets in a Git-ignored `.env` and list variable names in `.env.example`. Keep API keys, tokens, and real personal data out of commits, repository prompts, and logs.
- Before merging an app change to `main`, run the app and walk through the demo path. For documentation-only changes, verify the diff and referenced paths.
- Cover important behavior and edge cases that could fail silently, such as parsing and calculations. Report which checks you ran and which you skipped.

## Repository skills

Read the relevant `SKILL.md` and its `LOCAL.md` when present. The two course skills use short, in-chat responses in Ukrainian in hackathon mode.

- [ai-product-engineer](.claude/skills/ai-product-engineer/SKILL.md) covers the idea, MVP scope, demo metric, business case, and pitch. See the [hackathon timeline](.claude/skills/ai-product-engineer/references/hackathon.md) and [UX design notes](.claude/skills/ai-product-engineer/references/ux-design.md).
- [ai-agent-engineer](.claude/skills/ai-agent-engineer/SKILL.md) covers choosing an agent or workflow, building a 10-case evaluation set, RAG, security, and working in a shared repository.
- [Design skills](.claude/skills/DESIGN-SKILLS.md) lists the course's design resources. Use `heuristic-review` or `design-critique` for UI reviews and `slides` for the pitch deck.
