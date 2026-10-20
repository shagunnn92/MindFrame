import { describe, expect, it, vi } from "vitest";
import { ASSESSMENT_V1 } from "../assessment/v1";
import { submitAssessment, AssessmentSubmissionError } from "./submit-assessment";
import type { NewAssessmentResult, PublicAssessmentResult } from "./types";

const answers = ASSESSMENT_V1.questions.map((question) => ({
  questionId: question.id,
  optionId: question.options.find(({ weight }) => weight === 0)!.id,
}));

function submission(overrides: Record<string, unknown> = {}) {
  return { assessmentVersion: ASSESSMENT_V1.assessmentVersion, answers, ...overrides };
}

describe("server assessment submission", () => {
  it("validates, scores on the server, and saves a new public result", async () => {
    let saved: Omit<NewAssessmentResult, "createdAt"> | undefined;
    const save = vi.fn(async (record: Omit<NewAssessmentResult, "createdAt">) => {
      saved = record;
      return { ...record, createdAt: "2026-10-20T00:00:00.000Z" } satisfies PublicAssessmentResult;
    });

    const result = await submitAssessment(
      submission(),
      save,
      () => "70b2f806-3b6d-4f0e-9715-4a0e9133aabc",
    );

    expect(save).toHaveBeenCalledOnce();
    expect(saved?.publicId).toBe("70b2f806-3b6d-4f0e-9715-4a0e9133aabc");
    expect(result.dimensionScores).toEqual({
      planning: 0,
      reasoning: 0,
      exploration: 0,
      execution: 0,
      riskApproach: 0,
      socialApproach: 0,
    });
    expect(result.primaryArchetypeId).toBeNull();
  });

  it("rejects an unsupported assessment version before writing", async () => {
    const save = vi.fn();
    await expect(submitAssessment(submission({ assessmentVersion: "future-v9" }), save))
      .rejects.toBeInstanceOf(AssessmentSubmissionError);
    expect(save).not.toHaveBeenCalled();
  });

  it("rejects client-supplied calculated fields", async () => {
    const save = vi.fn();
    await expect(submitAssessment(submission({ dimensionScores: { planning: 100 } }), save))
      .rejects.toBeInstanceOf(AssessmentSubmissionError);
    expect(save).not.toHaveBeenCalled();
  });

  it("rejects incomplete or invalid answers before writing", async () => {
    const save = vi.fn();
    await expect(submitAssessment(submission({ answers: answers.slice(1) }), save))
      .rejects.toBeInstanceOf(AssessmentSubmissionError);
    const invalidAnswers = [...answers];
    invalidAnswers[0] = { ...invalidAnswers[0], optionId: "unknown-option" };
    await expect(submitAssessment(submission({ answers: invalidAnswers }), save))
      .rejects.toBeInstanceOf(AssessmentSubmissionError);
    expect(save).not.toHaveBeenCalled();
  });
});
