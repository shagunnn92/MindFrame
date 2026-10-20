# Saving and sharing results

## Design

Question wording and weights remain versioned in `src/lib/assessment/v1.ts`. A submission includes the assessment version and answer IDs only. The API checks the version and answers, calls the deterministic scoring function on the server, and then stores the answer snapshot and canonical result. Browser-provided scores are rejected.

PostgreSQL stores one row per completed result. The internal UUID is separate from a random public UUID used in share links. Dimension scores, archetype affinities, and the 24-answer snapshot use `jsonb`: the complete versioned snapshot stays together, while database constraints enforce the score keys/range and expected array lengths. The public retrieval endpoint intentionally omits answers and internal IDs.

The question bank and algorithm are not duplicated in SQL. Each row records both `assessment_version` and `scoring_version`, so later question changes can coexist with existing saved results.

## Local setup

1. Create a Neon PostgreSQL project and copy its pooled connection string.
2. Copy `.env.example` to `.env.local`.
3. Put the connection string in `.env.local` as `DATABASE_URL=...`. Do not add `NEXT_PUBLIC_` to this secret and do not send it in chat or commit it.
4. Run `npm run db:migrate` from the project folder. It creates the results table and records the migration in `schema_migrations`; rerunning it safely skips an already applied migration.
5. Restart `npm run dev`, complete the assessment, and open the result URL. Refreshing or opening that URL in another browser should retrieve the same saved result.

## API contract

### `POST /api/assessments/submit`

Request:

```json
{
  "assessmentVersion": "mindframe-assessment-v1",
  "answers": [{ "questionId": "planning-01", "optionId": "planning-01-middle" }]
}
```

The actual `answers` array must include all 24 questions. A successful request returns `201`, a public result summary, and a path such as `/results/<public-uuid>`. Invalid JSON/answers return `400`; an oversized body returns `413`; missing database configuration or database errors return a safe `503` response. A result is only reported as created after PostgreSQL confirms the insert.

### `GET /api/results/[publicId]`

Returns dimension scores, archetype affinities, assessment/scoring versions, and creation time. Invalid and unknown IDs both return `404`. It never returns individual answers or internal database details.

## Current limitations

There is no account ownership or deletion flow yet. Anyone with a result link can view the permitted result summary, so users should share it only with people they choose. Production rate limiting and retention/deletion rules are still needed before a public launch. The `.env.local` database secret and the migration have not been configured/applied until a Neon database exists.
