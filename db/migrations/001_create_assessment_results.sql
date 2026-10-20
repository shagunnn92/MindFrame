CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY,
  public_id uuid NOT NULL UNIQUE,
  assessment_version text NOT NULL,
  scoring_version text NOT NULL,
  primary_archetype_id text NULL CHECK (
    primary_archetype_id IS NULL OR primary_archetype_id IN (
      'architect', 'analyst', 'explorer', 'creator', 'sentinel', 'catalyst'
    )
  ),
  secondary_archetype_id text NULL CHECK (
    secondary_archetype_id IS NULL OR secondary_archetype_id IN (
      'architect', 'analyst', 'explorer', 'creator', 'sentinel', 'catalyst'
    )
  ),
  dimension_scores jsonb NOT NULL CHECK (
    jsonb_typeof(dimension_scores) = 'object'
    AND dimension_scores ?& ARRAY[
      'planning', 'reasoning', 'exploration', 'execution', 'riskApproach', 'socialApproach'
    ]
    AND jsonb_typeof(dimension_scores->'planning') = 'number'
    AND jsonb_typeof(dimension_scores->'reasoning') = 'number'
    AND jsonb_typeof(dimension_scores->'exploration') = 'number'
    AND jsonb_typeof(dimension_scores->'execution') = 'number'
    AND jsonb_typeof(dimension_scores->'riskApproach') = 'number'
    AND jsonb_typeof(dimension_scores->'socialApproach') = 'number'
    AND (dimension_scores->>'planning') ~ '^-?[0-9]+$'
    AND (dimension_scores->>'reasoning') ~ '^-?[0-9]+$'
    AND (dimension_scores->>'exploration') ~ '^-?[0-9]+$'
    AND (dimension_scores->>'execution') ~ '^-?[0-9]+$'
    AND (dimension_scores->>'riskApproach') ~ '^-?[0-9]+$'
    AND (dimension_scores->>'socialApproach') ~ '^-?[0-9]+$'
    AND (dimension_scores->>'planning')::integer BETWEEN -100 AND 100
    AND (dimension_scores->>'reasoning')::integer BETWEEN -100 AND 100
    AND (dimension_scores->>'exploration')::integer BETWEEN -100 AND 100
    AND (dimension_scores->>'execution')::integer BETWEEN -100 AND 100
    AND (dimension_scores->>'riskApproach')::integer BETWEEN -100 AND 100
    AND (dimension_scores->>'socialApproach')::integer BETWEEN -100 AND 100
    AND (dimension_scores - ARRAY[
      'planning', 'reasoning', 'exploration', 'execution', 'riskApproach', 'socialApproach'
    ]) = '{}'::jsonb
  ),
  archetype_affinities jsonb NOT NULL CHECK (
    jsonb_typeof(archetype_affinities) = 'array'
    AND jsonb_array_length(archetype_affinities) = 6
  ),
  answers jsonb NOT NULL CHECK (
    jsonb_typeof(answers) = 'array'
    AND jsonb_array_length(answers) = 24
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    secondary_archetype_id IS NULL
    OR secondary_archetype_id <> primary_archetype_id
  ),
  CHECK (
    secondary_archetype_id IS NULL
    OR primary_archetype_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS assessment_results_created_at_idx
  ON assessment_results (created_at DESC);
