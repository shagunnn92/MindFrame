# MINDFRAME

**Understand the patterns behind your decisions.**

MINDFRAME is a behavioral self-reflection assessment. It translates a person's answers into six decision-making dimensions and a set of archetype affinities. Results are intended as prompts for reflection, not as psychological diagnoses or scientifically validated measurements.

## Features

- 24-question assessment covering planning, reasoning, exploration, execution, risk approach, and social approach.
- Deterministic, server-side scoring. The same valid answers always produce the same result.
- Six archetype affinities, with a neutral **Balanced profile** when answers do not strongly match one archetype.
- PostgreSQL persistence through Neon, with versioned migrations and versioned assessment/scoring data.
- UUID-based result links. The public result response includes scores and archetype affinities, but omits individual answers and internal database IDs.
- Responsive assessment and result pages.

## Technology

- Next.js, React, and TypeScript
- Neon serverless PostgreSQL
- Vitest for unit tests

## Run locally

### Requirements

- Node.js and npm
- A Neon PostgreSQL database

### Setup

```powershell
npm ci
Copy-Item .env.example .env.local
```

Add your Neon connection string to `.env.local`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

Keep `.env.local` private. It is excluded from Git.

Create the database tables and start the development server:

```powershell
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run db:migrate` | Apply database migrations |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run build` | Create a production build |

## Architecture

- `src/lib/assessment/v1.ts` contains the versioned questions and answer weights.
- `src/lib/scoring/score-assessment.ts` implements the deterministic scoring rules independently of the UI and database.
- `src/app/api/assessments/submit/route.ts` validates submitted answers and calculates scores on the server.
- `src/lib/db/` contains the Neon database access and result persistence code.
- `src/app/api/results/[publicId]/route.ts` retrieves the public fields for a share link.
- `db/migrations/` contains the PostgreSQL schema migrations.

## Privacy and limitations

The result link is public to anyone who has it. The results API intentionally excludes the original answers, but account ownership and result deletion are not currently available. Avoid including identifying information in assessment responses, and share result links only with people you choose.

The scoring model and assessment content are product drafts for reflection. They are not clinical or diagnostic tools. An optional AI-assisted insight report is a possible future enhancement; it is not part of the current scoring or results flow.

## Project status

The assessment, deterministic scoring, Neon persistence, and shareable result pages are implemented and working locally. Production deployment is the next milestone.
