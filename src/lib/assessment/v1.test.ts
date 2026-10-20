import { describe, expect, it } from "vitest";
import { ASSESSMENT_V1 } from "./v1";
import { scoreAssessment } from "../scoring/score-assessment";
import { DIMENSION_IDS } from "../scoring/types";

describe("assessment version 1 content", () => {
  it("contains 24 original questions with two of each format per dimension", () => {
    expect(ASSESSMENT_V1.questions).toHaveLength(24);
    for (const dimension of DIMENSION_IDS) {
      const questions = ASSESSMENT_V1.questions.filter((q) => q.dimension === dimension);
      expect(questions).toHaveLength(4);
      expect(questions.filter((q) => q.kind === "scenario")).toHaveLength(2);
      expect(questions.filter((q) => q.kind === "rating")).toHaveLength(2);
    }
  });

  it("has unique question and option IDs and keeps scoring weights in range", () => {
    const questionIds = ASSESSMENT_V1.questions.map(({ id }) => id);
    const optionIds = ASSESSMENT_V1.questions.flatMap((q) => q.options.map(({ id }) => id));
    expect(new Set(questionIds).size).toBe(questionIds.length);
    expect(new Set(optionIds).size).toBe(optionIds.length);
    for (const question of ASSESSMENT_V1.questions) {
      expect(question.prompt.trim().length).toBeGreaterThan(0);
      expect(question.options.length).toBeGreaterThanOrEqual(3);
      expect(question.options.map(({ weight }) => weight)).toContain(-2);
      expect(question.options.map(({ weight }) => weight)).toContain(0);
      expect(question.options.map(({ weight }) => weight)).toContain(2);
      expect(Object.fromEntries(question.options.map(({ id, weight }) => [id, weight]))).toEqual(question.weights);
    }
  });

  it("can pass its answer-key structure directly to the deterministic scorer", () => {
    const answers = ASSESSMENT_V1.questions.map((question) => ({
      questionId: question.id,
      optionId: question.options[Math.floor(question.options.length / 2)].id,
    }));
    const result = scoreAssessment(ASSESSMENT_V1, answers);
    expect(result.scoringVersion).toBe(ASSESSMENT_V1.scoringVersion);
    expect(Object.keys(result.dimensionScores)).toHaveLength(6);
  });
});
