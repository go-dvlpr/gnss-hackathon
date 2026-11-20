# Local context: team copy for the hackathon

This is the team's copy of the `ai-product-engineer` skill for the one-day hackathon on Sat 2026-11-21, 10:30–20:00. It lives in the team repo and is committed with it. It wins over the generic text in `SKILL.md`.

## Hackathon mode

- **There is no Jira.** "The epic" is the idea in the **Project** section of the repo's `CLAUDE.md` (idea, hypothesis and success metric, demo path). If a field there is still TODO, the review says so and asks; it does not guess.
- **Read `references/hackathon.md` first.** It says what to take from the other references in one day and holds the timeline and paste-ready prompts.
- **The review is short, in chat, in Ukrainian.** No artifact, no Markdown report file. Verdict in up to three lines, then at most seven checks (problem with evidence, hypothesis slots, one metric, demo path = Must, stop bar, money line, pitch order), then the questions for the team.
- **Skip what needs production data or a long A/B test**: sample size and duration, split unit, overlapping experiments, cohort LTV, retention curves, payment guardrails, B2B translation. Mention the cheapest next check in one line instead.
- The epic class is always **Bet**. Steps 5 and 7 of `SKILL.md` shrink to one line each: the next validation rung, and the strongest reason the idea fails.
- The repo's `CLAUDE.md` rules (demo path first, `main` always runs, `HACK:` marks, secrets in `.env`) win over any advice in the references.
- Never invent a number, a pain or a quote for the pitch. A missing number is a question or an explicit assumption.

## The course

Genesis AI Product Engineering School (academy.gen.tech), 2026-10-13 – 2026-11-26. The references are distilled from lecture notes (audio with timecodes, slides with page numbers). The notes themselves are not in this repo.

| Tag | Date | Lecture | Lecturer |
|---|---|---|---|
| L1 | 10-13 | Introduction to Genesis and product-based IT | Petro Budzan (Education Project Specialist, Genesis), Oleksii Nishchyk (Chief Growth Officer, Genesis) |
| L2 | 10-16 | The Product-Minded Software Engineer | Oleksandr Shepel, Product Engineer, CopyMind |
| PMF | 10-19 | From market research to MVP, product-market fit and unit economics (lecture 3) | Volodymyr Alieksieichenko, CEO & Founder, Kinvel by SKELAR; case product AlphaNovel |
| UE | 10-21 | Unit economics: LTV, CAC, metric funnel, financial model (lecture 4) | Andrii Dukhovnyi, Investment Associate, SKELAR |
| L5 | 10-23 | Product Hypothesis Generation | Dmytro Huliai, Quarks |
| W6 | 10-26 | Workshop: Product Analytics — A/B testing and experiments | Oleh Parandii, Chief Analyst, TENTENS Tech |
| L7 | recording | Analytics in product-based IT (a recording from the spring 2026 school) | Dmytro Kanievskyi, FORMA |
| L8 | 10-30 | Performance Marketing — Intro | Mykhailo Buslenko, AI Growth Engineer, Stay (6037); the L8 slide says "Ex" |
| L9 | 11-02 | Performance Marketing — MarTech | Mykhailo Buslenko |
| L10 | 11-03 | Payments & Payment Systems | Artem Sadurskyy, CPO, Solidgate |
| L11 | 11-05 | Intro to AI-Assisted Development | Oleksii Rumiantsev, Head of Engineering, CopyMind |
| L12 | 11-09 | Workshop: AI Builder Battle (10-minute builds) | no slides or notes; lessons are tagged `(own, Battle)` |
| L13 | 11-19 | How we built an AI-native SDLC | Ihor Zakutynskyi, CTO, Universe (FORMA by Universe) |
| L14 | 11-12 | Engineering AI Agents: from LLMs to autonomous systems | Mark ⚠ (surname not in the recording), AI Lead, Genesis |
| L15 | 11-17 | Infrastructure Trade-offs for Product Engineers (ATAM) | Oleksandr Molochko, Tech Lead, FORMA (slide; the course chat says Senior Product Engineer, FORMA by Universe) |
| L16 | 11-18 | Designing and Optimizing RAG Architectures | Pavlo Lysyi, ex-Machine Learning Team Lead, Universe |
| L17 | 11-20 | AI UX/UI for Engineers | Tamara Vitvitska, Product Design Lead, FORMA |

`[Lnn hh:mm]` = audio timecode, `[Lnn p.N]` = slide page, `[L14 read: …]` = the L14 reading list, `[CS146S mm:ss]` = the Stanford talk from that list, `(own)` = not from a lecture. A ⚠ in a reference marks something the notes could not confirm; keep the mark when quoting it.
