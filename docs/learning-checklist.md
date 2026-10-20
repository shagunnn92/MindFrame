# MINDFRAME learning checklist

This checklist tracks understanding alongside the implementation. Items are marked complete only after you have had a chance to explain or apply the concept yourself.

## Foundation

- [ ] Explain what Node.js, npm, Next.js, React, and TypeScript each do in this project.
- [ ] Explain how a file under `src/app/` becomes a page in the browser.
- [x] Run the app locally and read the output of the development command.
- [ ] Explain the difference between type checking, linting, unit testing, and a production build.
- [ ] Make and review a small change to the landing page.

## Assessment and scoring

- [ ] Explain how question IDs and answer IDs are validated.
- [ ] Trace one answer through weight accumulation and normalization.
- [ ] Independently add a small test case with a known expected score.
- [ ] Explain archetype affinity, ties, and when a secondary archetype is omitted.
- [ ] Use a regression test to protect a scoring rule from accidental change.

## Server and PostgreSQL persistence

- [ ] Explain how `POST /api/assessments/submit` validates answers and recalculates the score.
- [ ] Explain what a parameterized SQL query protects against.
- [ ] Run the database migration and explain the results table constraints.
- [ ] Trace a saved public result through `GET /api/results/[publicId]` to the share page.

## Backend and database

- [ ] Explain why validation runs on the server even if the browser checks answers too.
- [ ] Read a SQL migration and explain its keys, constraints, and indexes.
- [ ] Explain why SQL queries use parameters and how migrations are applied.
- [ ] Trace submission and retrieval API requests, including one error path.
- [ ] Explain how a public result identifier differs from an internal database ID.

## Frontend, security, and delivery

- [ ] Explain which parts of the assessment need browser interactivity and why.
- [ ] Find and fix a frontend or API error using logs and browser tools.
- [ ] Explain how Google sign-in is verified on the server and how ownership is enforced.
- [ ] Run the relevant tests and interpret a failure without hiding it.
- [ ] Explain the deployment configuration and remaining operational risks.

## Future AI reports (optional, after core completion)

- [ ] Explain how a server-side report endpoint can read a saved result without changing scoring.
- [ ] Identify which result data should be sent to a provider and which should remain private.
- [ ] Explain output validation, provider failure handling, and report versioning.

## Learning progress so far

- **Practised with guidance:** started the local development server, recognized its ready message, opened the home page, followed the assessment link, and returned home.
- **Scoring practice:** correctly calculated the maximum absolute dimension total as `4 questions × 2 points = 8`.
- **Can do independently:** not confirmed yet; we will record this when you try a step without guidance.
- **Still to practise:** explain how `src/app/assessment/page.tsx` maps to `/assessment`, make a small page edit, and trace an answer through the scoring formula.
- **Scoring implementation status:** the scoring module and 24-question versioned content draft exist. Vitest was changed to use Vite 6 after the Vite 8/Rolldown native binding failed on this Windows setup. All 20 scoring/content tests pass when Vitest's temporary directory is set inside the project. You still need practice tracing an answer and reviewing the question wording.
- **Assessment flow status:** `/assessment` renders the versioned questions and keeps selected answers when navigating back. Final submission now sends answer IDs to the server; the browser no longer decides the saved scores. The interactive flow is a Client Component because it uses state and event handlers; the page wrapper stays a Server Component.
- **Server/API status:** submit and retrieve handlers, the parameterized Neon repository, a versioned Postgres migration, and automated validation/scoring tests are implemented. The migration and live persistence still need a real `DATABASE_URL` from a Neon project; the secret must stay in `.env.local` and must not be shared.
