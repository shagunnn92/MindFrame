import { randomUUID } from "node:crypto";
import { ASSESSMENT_V1 } from "../assessment/v1";
import { ScoringError, type SubmittedAnswer } from "../scoring/types";
import { scoreAssessment } from "../scoring/score-assessment";
import type { NewAssessmentResult, PublicAssessmentResult } from "./types";

export class AssessmentSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssessmentSubmissionError";
  }
}

type SaveResult = (
  result: Omit<NewAssessmentResult, "createdAt">,
) => Promise<PublicAssessmentResult>;

function readSubmission(input: unknown): SubmittedAnswer[] {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => key !== "assessmentVersion" && key !== "answers")
  ) {
    throw new AssessmentSubmissionError("The submission format is invalid.");
  }

  const request = input as Record<string, unknown>;
  if (request.assessmentVersion !== ASSESSMENT_V1.assessmentVersion) {
    throw new AssessmentSubmissionError("This assessment version is not supported.");
  }
  if (!Array.isArray(request.answers) || request.answers.length !== ASSESSMENT_V1.questions.length) {
    throw new AssessmentSubmissionError("Please answer every question before submitting.");
  }
  return request.answers as SubmittedAnswer[];
}

/** Validates and scores on the server, then persists only the canonical result. */
export async function submitAssessment(
  input: unknown,
  saveResult: SaveResult,
  createPublicId: () => string = randomUUID,
): Promise<PublicAssessmentResult> {
  const answers = readSubmission(input);
  let score;
  try {
    score = scoreAssessment(ASSESSMENT_V1, answers);
  } catch (error) {
    if (error instanceof ScoringError) {
      throw new AssessmentSubmissionError("One or more answers are invalid. Please review them and try again.");
    }
    throw error;
  }

  return saveResult({
    publicId: createPublicId(),
    assessmentVersion: ASSESSMENT_V1.assessmentVersion,
    scoringVersion: score.scoringVersion,
    primaryArchetypeId: score.primaryArchetypeId,
    secondaryArchetypeId: score.secondaryArchetypeId,
    dimensionScores: score.dimensionScores,
    archetypeAffinities: score.archetypeAffinities,
    answers,
  });
}
