import type {
  ArchetypeAffinity,
  ArchetypeId,
  DimensionId,
  SubmittedAnswer,
} from "@/lib/scoring/types";

export type PublicAssessmentResult = {
  publicId: string;
  assessmentVersion: string;
  scoringVersion: string;
  primaryArchetypeId: ArchetypeId | null;
  secondaryArchetypeId: ArchetypeId | null;
  dimensionScores: Record<DimensionId, number>;
  archetypeAffinities: ArchetypeAffinity[];
  createdAt: string;
};

export type NewAssessmentResult = PublicAssessmentResult & {
  answers: readonly SubmittedAnswer[];
};
