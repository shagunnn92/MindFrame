import {
  ARCHETYPE_IDS,
  DIMENSION_IDS,
  ScoringError,
  type ArchetypeAffinity,
  type ArchetypeId,
  type AssessmentDefinition,
  type DimensionId,
  type ScoringResult,
  type SubmittedAnswer,
} from "./types";

const ARCHETYPE_SIGNATURES: Record<
  ArchetypeId,
  Partial<Record<DimensionId, -1 | 0 | 1>>
> = {
  architect: {
    planning: 1,
    reasoning: 1,
    exploration: -1,
    riskApproach: -1,
  },
  analyst: { reasoning: 1, execution: -1, riskApproach: -1 },
  explorer: { exploration: 1, execution: 1, riskApproach: 1 },
  creator: {
    planning: -1,
    reasoning: -1,
    exploration: 1,
    socialApproach: 1,
  },
  sentinel: {
    planning: 1,
    exploration: -1,
    execution: -1,
    riskApproach: -1,
    socialApproach: 1,
  },
  catalyst: {
    planning: -1,
    exploration: 1,
    execution: 1,
    riskApproach: 1,
    socialApproach: 1,
  },
};

const MINIMUM_PRIMARY_AFFINITY = 80;
const MINIMUM_SECONDARY_AFFINITY = 75;
const MAXIMUM_SECONDARY_GAP = 15;

function isDimensionId(value: string): value is DimensionId {
  return DIMENSION_IDS.some((dimensionId) => dimensionId === value);
}

function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

function validateDefinition(definition: AssessmentDefinition): void {
  if (
    typeof definition.scoringVersion !== "string" ||
    definition.scoringVersion.trim().length === 0 ||
    !Array.isArray(definition.questions) ||
    definition.questions.length === 0
  ) {
    throw new ScoringError(
      "invalid_definition",
      "The assessment definition needs a scoring version and at least one question.",
    );
  }

  const questionIds = new Set<string>();

  for (const question of definition.questions) {
    if (
      typeof question.id !== "string" ||
      question.id.trim().length === 0 ||
      questionIds.has(question.id) ||
      !isDimensionId(question.dimension) ||
      question.weights === null ||
      typeof question.weights !== "object" ||
      Object.keys(question.weights).length === 0
    ) {
      throw new ScoringError(
        "invalid_definition",
        "Each question needs a unique ID, a known dimension, and answer weights.",
      );
    }

    questionIds.add(question.id);

    for (const weight of Object.values(question.weights)) {
      if (
        typeof weight !== "number" ||
        !Number.isInteger(weight) ||
        Math.abs(weight) > 2
      ) {
        throw new ScoringError(
          "invalid_definition",
          `Question ${question.id} has a weight outside the allowed integer range -2 to +2.`,
        );
      }
    }
  }
}

function calculateArchetypeAffinities(
  dimensionScores: Record<DimensionId, number>,
): ArchetypeAffinity[] {
  const profile = DIMENSION_IDS.map((dimensionId) => dimensionScores[dimensionId] / 100);
  const profileLength = Math.sqrt(profile.reduce((sum, score) => sum + score ** 2, 0));

  return ARCHETYPE_IDS.map((archetypeId) => {
    const signature = ARCHETYPE_SIGNATURES[archetypeId];
    const signatureVector = DIMENSION_IDS.map((dimensionId) =>
      signature[dimensionId] ?? 0,
    );
    const signatureLength = Math.sqrt(
      signatureVector.reduce<number>(
        (sum, direction) => sum + direction ** 2,
        0,
      ),
    );
    const dotProduct = profile.reduce(
      (total, score, index) => total + score * signatureVector[index],
      0,
    );
    const similarity =
      profileLength === 0 || signatureLength === 0
        ? 0
        : Math.max(-1, Math.min(1, dotProduct / (profileLength * signatureLength)));

    return {
      archetypeId,
      score: Math.round(50 * (1 + similarity)),
    };
  }).sort(
    (left, right) =>
      right.score - left.score ||
      (left.archetypeId < right.archetypeId ? -1 : 1),
  );
}

function selectArchetypes(affinities: ArchetypeAffinity[]): {
  primaryArchetypeId: ArchetypeId | null;
  secondaryArchetypeId: ArchetypeId | null;
} {
  const [top, second] = affinities;

  if (
    !top ||
    top.score < MINIMUM_PRIMARY_AFFINITY ||
    top.score === second?.score
  ) {
    return { primaryArchetypeId: null, secondaryArchetypeId: null };
  }

  const hasSecondary =
    second !== undefined &&
    second.score >= MINIMUM_SECONDARY_AFFINITY &&
    top.score - second.score <= MAXIMUM_SECONDARY_GAP;

  return {
    primaryArchetypeId: top.archetypeId,
    secondaryArchetypeId: hasSecondary ? second.archetypeId : null,
  };
}

/** Scores a complete answer set without reading from or writing to the database. */
export function scoreAssessment(
  definition: AssessmentDefinition,
  answers: readonly SubmittedAnswer[],
): ScoringResult {
  validateDefinition(definition);

  if (!Array.isArray(answers)) {
    throw new ScoringError("invalid_answers", "Answers must be provided as a list.");
  }

  const questionsById = new Map(
    definition.questions.map((question) => [question.id, question]),
  );
  const answersByQuestionId = new Map<string, SubmittedAnswer>();

  for (const answer of answers) {
    if (
      answer === null ||
      typeof answer !== "object" ||
      typeof answer.questionId !== "string" ||
      typeof answer.optionId !== "string" ||
      Object.keys(answer).some(
        (key) => key !== "questionId" && key !== "optionId",
      )
    ) {
      throw new ScoringError(
        "invalid_answers",
        "Each answer must contain only a question ID and an option ID.",
      );
    }

    if (!questionsById.has(answer.questionId)) {
      throw new ScoringError(
        "unknown_question",
        `Answer refers to unknown question ${answer.questionId}.`,
      );
    }

    if (answersByQuestionId.has(answer.questionId)) {
      throw new ScoringError(
        "duplicate_answer",
        `Question ${answer.questionId} has more than one answer.`,
      );
    }

    answersByQuestionId.set(answer.questionId, answer);
  }

  for (const question of definition.questions) {
    if (!answersByQuestionId.has(question.id)) {
      throw new ScoringError(
        "missing_answer",
        `Question ${question.id} has not been answered.`,
      );
    }
  }

  const totals = Object.fromEntries(
    DIMENSION_IDS.map((dimensionId) => [dimensionId, 0]),
  ) as Record<DimensionId, number>;
  const possibleTotals = Object.fromEntries(
    DIMENSION_IDS.map((dimensionId) => [dimensionId, 0]),
  ) as Record<DimensionId, number>;

  for (const question of definition.questions) {
    const optionWeights = Object.values(question.weights);
    const maximumForQuestion = Math.max(...optionWeights.map(Math.abs));

    if (maximumForQuestion === 0) {
      throw new ScoringError(
        "invalid_definition",
        `Question ${question.id} cannot change its dimension score.`,
      );
    }

    possibleTotals[question.dimension] += maximumForQuestion;

    const answer = answersByQuestionId.get(question.id);
    const answerWeight = answer ? question.weights[answer.optionId] : undefined;

    if (answerWeight === undefined) {
      throw new ScoringError(
        "unknown_option",
        `Question ${question.id} has no option ${answer?.optionId ?? ""}.`,
      );
    }

    totals[question.dimension] += answerWeight;
  }

  const dimensionScores = Object.fromEntries(
    DIMENSION_IDS.map((dimensionId) => {
      const maximum = possibleTotals[dimensionId];
      if (maximum === 0) {
        throw new ScoringError(
          "invalid_definition",
          `Dimension ${dimensionId} has no possible score variation.`,
        );
      }

      return [
        dimensionId,
        roundHalfAwayFromZero((100 * totals[dimensionId]) / maximum),
      ];
    }),
  ) as Record<DimensionId, number>;

  const archetypeAffinities = calculateArchetypeAffinities(dimensionScores);
  const { primaryArchetypeId, secondaryArchetypeId } =
    selectArchetypes(archetypeAffinities);

  return {
    scoringVersion: definition.scoringVersion,
    dimensionScores,
    archetypeAffinities,
    primaryArchetypeId,
    secondaryArchetypeId,
  };
}
