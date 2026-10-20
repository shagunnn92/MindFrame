# MINDFRAME

**Understand the patterns behind your decisions.**

MINDFRAME is a learning-first full-stack project for a behavioral self-reflection assessment. Its results will come from a deterministic, documented scoring engine. They are product language for reflection, not a psychological diagnosis or scientifically validated measurement.

## Project status

Milestone 2 is in progress: establishing the Next.js foundation, development checks, design tokens, and project structure. Assessment questions, scoring, database access, authentication, and AI reports are not implemented yet. The planned AI-assisted insight report is a separate future milestone; it will not participate in assessment scoring.

## Run locally

Prerequisites: Node.js 24 (or a compatible supported Node version) and npm.

```powershell
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Stop the development server with `Ctrl+C`.

In this Windows workspace, Next.js's native SWC compiler binary does not load. The project runs Next through `scripts/next.mjs`, which directs the compiler cache to the writable `work/next-swc` folder. `next.config.ts` selects Webpack and a single build worker because Next.js requires native SWC bindings for Turbopack.

Useful checks:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

`typecheck` asks TypeScript to find type errors. `lint` checks code patterns. Vitest will run focused unit tests as project logic is added. Next.js’s build checks whether the app can be prepared for production. These commands are explained and introduced as they become relevant; they are not interchangeable.

## Planned project structure

```text
src/
  app/                    Pages, layouts, and Route Handlers
  components/              Shared interface components
  features/assessment/     Assessment UI and flow
  data/                    Versioned question and archetype definitions
  lib/scoring/             Framework-independent scoring functions
  server/                  Validation, database, and auth-only modules
tests/
  integration/             API and persistence checks
  e2e/                     Browser user journeys
docs/
  learning-checklist.md    Learning progress and practice goals
  decisions/               Important architecture decisions
```

Folders will be introduced as the project needs them; the scoring engine will stay independent from React and database code.

## Milestones

1. Blueprint and approval — complete.
2. Project foundation — in progress.
3. Assessment definitions and deterministic scoring.
4. PostgreSQL schema, migrations, and backend APIs.
5. Assessment and results interface.
6. End-to-end integration and shareable results.
7. Optional Google sign-in.
8. Quality review and deployment preparation.
9. Optional AI-assisted insight reports, proposed after the core application and tests are complete.

## Learning approach

Each major milestone will include a small project-specific exercise for you to attempt, review of your implementation, an explanation of important data flow and design choices, and a short understanding check before moving on. The [learning checklist](docs/learning-checklist.md) records what you have practised and what remains to learn.

## Environment variables

No database or authentication credentials are needed for the current foundation. Later milestones will add a placeholder-only `.env.example` and document each variable before connecting external services. Never commit real credentials.
