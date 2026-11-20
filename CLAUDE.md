# gnss-hackathon

One-day hackathon project (Sat 2026-11-21, 10:30–20:00). Several people and several AI sessions write to this repo at the same time. The goal is a live demo at the end, not production code.

## Project

- **Idea:** TODO — one sentence: who has what problem, what we build.
- **Hypothesis and success metric:** TODO — what the demo should prove and how we would measure it.
- **Demo path:** TODO — the exact steps shown on stage. Everything else is optional.
- **Stack:** TODO
- **Run locally:** TODO (one command)
- **Deploy / demo URL:** TODO

Fill these in as soon as they are decided; agents read this file first.

## Priorities

1. The demo path works end to end. Build a thin vertical slice first, then improve it.
2. `main` always runs. Never push a broken `main` — the demo can start from whatever is there.
3. Speed over polish: hardcoded config, mock data and shortcuts are fine. Mark each shortcut with a `HACK:` comment so it is easy to find.
4. No new dependency unless it saves real time; ask the team before adding a framework or a paid service.

## Working together

- One feature = one short-lived branch (`<name>/<feature>`), merged within an hour or two. Pull `main` before you start and before you merge.
- Small commits with clear messages. Touch only the files your task needs: no mass reformatting, renames or moving files around — that causes merge conflicts for everyone else.
- Never force-push to `main`, never rewrite shared history.
- If you change something others depend on (API shape, env vars, the run command), update this file in the same commit.

## Secrets

- Keys go in `.env` (git-ignored); list the variable names in `.env.example`.
- Never commit API keys, tokens or real personal data, and never paste them into prompts that end up in the repo.

## Checks

- Before merging to `main`: run the app and click through the demo path.
- Tests only for logic that would break the demo silently (parsing, calculations). No coverage goals.

## For AI agents

- Read this file and the code you are about to change before writing anything.
- Keep diffs minimal and scoped to the task; say what you skipped.
- Ask before deleting files, changing the stack, or anything that touches `main` history.
- If something in "Project" above is still TODO and you need it, ask instead of guessing.
