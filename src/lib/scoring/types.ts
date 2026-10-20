export const DIMENSION_IDS = [
  "planning",
  "reasoning",
  "exploration",
  "execution",
  "riskApproach",
  "socialApproach",
] as const;

export type DimensionId = (typeof DIMENSION_IDS)[number];

export const ARCHETYPE_IDS = [
  "architect",
  "analyst",
  "explorer",
  "creator",
  "sentinel",
  "catalyst",
] as const;

export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];

export type QuestionDefinition = {
  id: string;
  dimension: DimensionId;
  /** Maps each answer option ID to its signed contribution to this dimension. */
  weights: Readonly<Record<string, number>>;
};

export type AssessmentDefinition = {
  scoringVersion: string;
  questions: readonly QuestionDefinition[];
};

export type SubmittedAnswer = {
  questionId: string;
  optionId: string;
};

export type ArchetypeAffinity = {
  archetypeId: ArchetypeId;
  score: number;
};

export type ScoringResult = {
  scoringVersion: string;
  dimensionScores: Record<DimensionId, number>;
  archetypeAffinities: ArchetypeAffinity[];
  primaryArchetypeId: ArchetypeId | null;
  secondaryArchetypeId: ArchetypeId | null;
};

export type ScoringErrorCode =
  | "invalid_definition"
  | "invalid_answers"
  | "duplicate_answer"
  | "unknown_question"
  | "unknown_option"
  | "missing_answer";

export class ScoringError extends Error {
  constructor(public readonly code: ScoringErrorCode, message: string) {
    super(message);
    this.name = "ScoringError";
  }
}
