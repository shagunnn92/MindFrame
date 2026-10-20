import { randomUUID } from "node:crypto";
import { getSql } from "./neon";
import type { NewAssessmentResult, PublicAssessmentResult } from "@/lib/results/types";
import type { DimensionId } from "@/lib/scoring/types";

function dateToIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function saveAssessmentResult(
  result: Omit<NewAssessmentResult, "createdAt">,
): Promise<PublicAssessmentResult> {
  const sql = getSql();
  const internalId = randomUUID();
  const [row] = await sql`
    INSERT INTO assessment_results (
      id,
      public_id,
      assessment_version,
      scoring_version,
      primary_archetype_id,
      secondary_archetype_id,
      dimension_scores,
      archetype_affinities,
      answers
    ) VALUES (
      ${internalId}::uuid,
      ${result.publicId}::uuid,
      ${result.assessmentVersion},
      ${result.scoringVersion},
      ${result.primaryArchetypeId},
      ${result.secondaryArchetypeId},
      ${JSON.stringify(result.dimensionScores)}::jsonb,
      ${JSON.stringify(result.archetypeAffinities)}::jsonb,
      ${JSON.stringify(result.answers)}::jsonb
    )
    RETURNING created_at
  `;

  return { ...result, createdAt: dateToIso(row.created_at) };
}

type DatabaseResultRow = {
  publicId: string;
  assessmentVersion: string;
  scoringVersion: string;
  primaryArchetypeId: PublicAssessmentResult["primaryArchetypeId"];
  secondaryArchetypeId: PublicAssessmentResult["secondaryArchetypeId"];
  dimensionScores: Record<DimensionId, number>;
  archetypeAffinities: PublicAssessmentResult["archetypeAffinities"];
  createdAt: Date | string;
};

export async function findPublicAssessmentResult(
  publicId: string,
): Promise<PublicAssessmentResult | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      public_id AS "publicId",
      assessment_version AS "assessmentVersion",
      scoring_version AS "scoringVersion",
      primary_archetype_id AS "primaryArchetypeId",
      secondary_archetype_id AS "secondaryArchetypeId",
      dimension_scores AS "dimensionScores",
      archetype_affinities AS "archetypeAffinities",
      created_at AS "createdAt"
    FROM assessment_results
    WHERE public_id = ${publicId}::uuid
    LIMIT 1
  `;
  const row = rows[0] as unknown as DatabaseResultRow | undefined;

  if (!row) return null;
  return { ...row, createdAt: dateToIso(row.createdAt) };
}
