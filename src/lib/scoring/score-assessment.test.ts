import { describe, expect, it } from "vitest";
import { scoreAssessment } from "./score-assessment";
import {
  DIMENSION_IDS,
  ScoringError,
  type AssessmentDefinition,
  type DimensionId,
  type SubmittedAnswer,
} from "./types";

const OPTION_IDS_BY_WEIGHT: Record<number, string> = {
  [-2]: "strongly-first-pole",
  [-1]: "somewhat-first-pole",
  0: "balanced",
  1: "somewhat-second-pole",
  2: "strongly-second-pole",
};

const definition: AssessmentDefinition = {
  scoringVersion: "test-v1",
  questions: DIMENSION_IDS.flatMap((dimension) =>
    Array.from({ length: 4 }, (_, index) => ({
      id: `${dimension}-${index + 1}`,
      dimension,
      weights: {
        "strongly-first-pole": -2,
        "somewhat-first-pole": -1,
        balanced: 0,
        "somewhat-second-pole": 1,
        "strongly-second-pole": 2,
      },
    })),
  ),
};

function answersWith(
  selectedWeights: Partial<Record<DimensionId, readonly number[]>> = {},
): SubmittedAnswer[] {
  return definition.questions.map((question, index) => {
    const weight = selectedWeights[question.dimension]?.[index % 4] ?? 0;
    return {
      questionId: question.id,
      optionId: OPTION_IDS_BY_WEIGHT[weight],
    };
  });
}

describe("scoreAssessment", () => {
  it("normalizes a known set of answers to the expected dimension scores", () => {
    const result = scoreAssessment(
      definition,
      answersWith({
        planning: [2, 1, 0, -1],
        reasoning: [-2, -2, -2, -2],
        exploration: [2, 2, 2, 2],
      }),
    );

    expect(result.dimensionScores).toEqual({
      planning: 25,
      reasoning: -100,
      exploration: 100,
      execution: 0,
      riskApproach: 0,
      socialApproach: 0,
    });
    expect(result.scoringVersion).toBe("test-v1");
  });

  it("returns a neutral profile when all answers are balanced", () => {
    const result = scoreAssessment(definition, answersWith());

    expect(Object.values(result.dimensionScores)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(result.archetypeAffinities.map(({ score }) => score)).toEqual([
      50, 50, 50, 50, 50, 50,
    ]);
    expect(result.primaryArchetypeId).toBeNull();
    expect(result.secondaryArchetypeId).toBeNull();
    expect(result.archetypeAffinities.map(({ archetypeId }) => archetypeId)).toEqual([
      "analyst",
      "architect",
      "catalyst",
      "creator",
      "explorer",
      "sentinel",
    ]);
  });

  it("selects a primary and a close secondary for the documented Explorer profile", () => {
    const result = scoreAssessment(
      definition,
      answersWith({
        exploration: [2, 2, 2, 2],
        execution: [2, 2, 2, 2],
        riskApproach: [2, 2, 2, 2],
        socialApproach: [2, 2, 0, 0],
      }),
    );

    expect(result.dimensionScores).toMatchObject({
      exploration: 100,
      execution: 100,
      riskApproach: 100,
      socialApproach: 50,
    });
    expect(result.archetypeAffinities.slice(0, 3)).toEqual([
      { archetypeId: "explorer", score: 98 },
      { archetypeId: "catalyst", score: 93 },
      { archetypeId: "creator", score: 71 },
    ]);
    expect(result.primaryArchetypeId).toBe("explorer");
    expect(result.secondaryArchetypeId).toBe("catalyst");
  });

  it.each([
    ["architect", { planning: [2, 2, 2, 2], reasoning: [2, 2, 2, 2], exploration: [-2, -2, -2, -2], riskApproach: [-2, -2, -2, -2] }],
    ["analyst", { reasoning: [2, 2, 2, 2], execution: [-2, -2, -2, -2], riskApproach: [-2, -2, -2, -2] }],
    ["explorer", { exploration: [2, 2, 2, 2], execution: [2, 2, 2, 2], riskApproach: [2, 2, 2, 2] }],
    ["creator", { planning: [-2, -2, -2, -2], reasoning: [-2, -2, -2, -2], exploration: [2, 2, 2, 2], socialApproach: [2, 2, 2, 2] }],
    ["sentinel", { planning: [2, 2, 2, 2], exploration: [-2, -2, -2, -2], execution: [-2, -2, -2, -2], riskApproach: [-2, -2, -2, -2], socialApproach: [2, 2, 2, 2] }],
    ["catalyst", { planning: [-2, -2, -2, -2], exploration: [2, 2, 2, 2], execution: [2, 2, 2, 2], riskApproach: [2, 2, 2, 2], socialApproach: [2, 2, 2, 2] }],
  ] as const)("lets a matching %s profile lead", (expectedArchetype, selectedWeights) => {
    const result = scoreAssessment(definition, answersWith(selectedWeights));

    expect(result.primaryArchetypeId).toBe(expectedArchetype);
    expect(result.archetypeAffinities[0].score).toBe(100);
  });

  it("does not assign an archetype from one isolated dimension", () => {
    const result = scoreAssessment(
      definition,
      answersWith({ exploration: [2, 2, 2, 2] }),
    );

    expect(result.archetypeAffinities[0].score).toBeLessThan(80);
    expect(result.primaryArchetypeId).toBeNull();
  });

  it("returns the same result for the same answers", () => {
    const answers = answersWith({ planning: [2, 1, 0, -1] });

    expect(scoreAssessment(definition, answers)).toEqual(
      scoreAssessment(definition, answers),
    );
  });

  it("rejects a missing answer", () => {
    const answers = answersWith();

    expect(() => scoreAssessment(definition, answers.slice(1))).toThrowError(
      expect.objectContaining({ code: "missing_answer" }),
    );
  });

  it("rejects duplicate answers", () => {
    const answers = answersWith();

    expect(() => scoreAssessment(definition, [...answers, answers[0]])).toThrowError(
      expect.objectContaining({ code: "duplicate_answer" }),
    );
  });

  it("rejects an unknown question", () => {
    const answers = answersWith();
    answers[0] = { questionId: "not-a-question", optionId: "balanced" };

    expect(() => scoreAssessment(definition, answers)).toThrowError(
      expect.objectContaining({ code: "unknown_question" }),
    );
  });

  it("rejects an unknown answer option", () => {
    const answers = answersWith();
    answers[0] = { ...answers[0], optionId: "not-an-option" };

    expect(() => scoreAssessment(definition, answers)).toThrowError(
      expect.objectContaining({ code: "unknown_option" }),
    );
  });

  it("rejects a dimension that cannot vary", () => {
    const zeroVarianceDefinition: AssessmentDefinition = {
      ...definition,
      questions: definition.questions.map((question) =>
        question.dimension === "planning"
          ? { ...question, weights: { fixed: 0 } }
          : question,
      ),
    };
    const answers = answersWith();
    for (let index = 0; index < answers.length; index += 1) {
      if (answers[index].questionId.startsWith("planning-")) {
        answers[index] = { ...answers[index], optionId: "fixed" };
      }
    }

    expect(() => scoreAssessment(zeroVarianceDefinition, answers)).toThrowError(
      expect.objectContaining({ code: "invalid_definition" }),
    );
  });

  it("uses a specific scoring error type for invalid input", () => {
    try {
      scoreAssessment(definition, answersWith().slice(1));
    } catch (error) {
      expect(error).toBeInstanceOf(ScoringError);
      return;
    }

    throw new Error("Expected scoring to reject the missing answer.");
  });
});
