import type { AssessmentDefinition, DimensionId } from "../scoring/types";

export type AssessmentOption = {
  id: string;
  label: string;
  /** Contribution to the question's single assigned dimension (-2 to +2). */
  weight: number;
};

export type AssessmentQuestion = {
  id: string;
  dimension: DimensionId;
  kind: "scenario" | "rating";
  prompt: string;
  helperText?: string;
  options: readonly AssessmentOption[];
  /** Scoring-compatible view of the options; the scorer never reads display text. */
  weights: Readonly<Record<string, number>>;
};

export type AssessmentContent = Omit<AssessmentDefinition, "questions"> & {
  assessmentVersion: string;
  title: string;
  questions: readonly AssessmentQuestion[];
};

function scenario(
  id: string,
  dimension: DimensionId,
  prompt: string,
  firstPole: string,
  middle: string,
  secondPole: string,
): AssessmentQuestion {
  const options = [
    { id: `${id}-first`, label: firstPole, weight: -2 },
    { id: `${id}-middle`, label: middle, weight: 0 },
    { id: `${id}-second`, label: secondPole, weight: 2 },
  ] as const;
  return {
    id,
    dimension,
    kind: "scenario",
    prompt,
    helperText: "Choose what you would most likely do first. There is no right answer.",
    options,
    weights: Object.fromEntries(options.map(({ id: optionId, weight }) => [optionId, weight])),
  };
}

function rating(
  id: string,
  dimension: DimensionId,
  prompt: string,
  statementLeans: "first" | "second",
): AssessmentQuestion {
  const agreement = [
    { id: "strongly-disagree", label: "Strongly disagree", magnitude: -2 },
    { id: "somewhat-disagree", label: "Somewhat disagree", magnitude: -1 },
    { id: "neither", label: "Neither agree nor disagree", magnitude: 0 },
    { id: "somewhat-agree", label: "Somewhat agree", magnitude: 1 },
    { id: "strongly-agree", label: "Strongly agree", magnitude: 2 },
  ] as const;
  const options = agreement.map(({ id: optionId, label, magnitude }) => ({
    id: `${id}-${optionId}`,
    label,
    weight: statementLeans === "second" ? magnitude : -magnitude,
  }));
  return {
    id,
    dimension,
    kind: "rating",
    prompt,
    helperText: "Answer based on what is usually true for you, not what you think should be true.",
    options,
    weights: Object.fromEntries(options.map(({ id: optionId, weight }) => [optionId, weight])),
  };
}

/**
 * Versioned source-of-truth for the initial 24-question assessment.
 * Each dimension has two scenarios and two ratings; each question scores only that dimension.
 */
export const ASSESSMENT_V1: AssessmentContent = {
  assessmentVersion: "mindframe-assessment-v1",
  scoringVersion: "mindframe-scoring-v1",
  title: "How do you approach decisions?",
  questions: [
    scenario("planning-01", "planning", "A project changes direction halfway through. What is your first move?", "Set aside the old plan and adapt as you go.", "Keep useful parts and adjust the plan where needed.", "Rework the plan before taking the next step."),
    scenario("planning-02", "planning", "You have a free afternoon and several things you could do. How do you begin?", "Pick based on how I feel in the moment.", "Choose one priority, while leaving room to change.", "Decide an order and make a rough schedule."),
    rating("planning-03", "planning", "I feel more comfortable when the steps of a task are mapped out in advance.", "second"),
    rating("planning-04", "planning", "I prefer to keep my plans flexible until I know what the situation requires.", "first"),

    scenario("reasoning-01", "reasoning", "A claim sounds convincing, but you are unsure whether it is accurate. What do you do first?", "Notice my initial sense of whether it rings true.", "Compare it with what I already know and check one source.", "Look for evidence and examine how the claim was reached."),
    scenario("reasoning-02", "reasoning", "You need to choose between two unfamiliar options. What guides you most?", "My overall impression and instinct.", "A mix of intuition and a few useful facts.", "A careful comparison of evidence and trade-offs."),
    rating("reasoning-03", "reasoning", "Before accepting an explanation, I want to understand the evidence behind it.", "second"),
    rating("reasoning-04", "reasoning", "My first impression often tells me enough to make an everyday choice.", "first"),

    scenario("exploration-01", "exploration", "You arrive somewhere with an hour to spare. How do you spend it?", "Return to a familiar place or activity I know I enjoy.", "Mix something familiar with a small detour.", "Explore somewhere or something I have not tried before."),
    scenario("exploration-02", "exploration", "A familiar way of doing a task works reasonably well. What are you most likely to do?", "Keep using it because it is dependable.", "Try a small change if there is a clear benefit.", "Experiment with a different approach to see what happens."),
    rating("exploration-03", "exploration", "I enjoy looking into topics simply because they are unfamiliar to me.", "second"),
    rating("exploration-04", "exploration", "When choosing an activity, I often prefer options I already know.", "first"),

    scenario("execution-01", "execution", "A useful idea comes up, but the details are not settled. What do you usually do?", "Think it through more before beginning.", "Clarify the next step, then start when it feels workable.", "Take a small first action and learn from what happens."),
    scenario("execution-02", "execution", "You are given a task with a clear deadline but no required process. How do you approach it?", "Pause to consider the approach before acting.", "Make a quick outline and begin.", "Start with the most actionable part and refine along the way."),
    rating("execution-03", "execution", "I would rather try a workable first step than wait for every detail to be settled.", "second"),
    rating("execution-04", "execution", "I usually take time to reflect before turning a decision into action.", "first"),

    scenario("risk-01", "riskApproach", "You are considering an optional change that could help but may cause a setback. What do you do?", "Avoid the change unless the downside is very small.", "Try it after setting a limit on possible losses.", "Accept some uncertainty if the possible learning or gain is worthwhile."),
    scenario("risk-02", "riskApproach", "A new method has promising early results but little track record. How do you respond?", "Wait until there is more evidence it is dependable.", "Test it on a small, low-impact task.", "Use it where the potential upside makes the uncertainty worthwhile."),
    rating("risk-03", "riskApproach", "I am willing to try an unproven approach when the possible benefit is meaningful.", "second"),
    rating("risk-04", "riskApproach", "I prefer to choose an option with a dependable outcome, even if another could offer more.", "first"),

    scenario("social-01", "socialApproach", "You are beginning a task that could be done alone or with others. What do you prefer?", "Start independently and ask for input when useful.", "Work alone on some parts and coordinate on others.", "Bring people together early to exchange ideas and divide the work."),
    scenario("social-02", "socialApproach", "A decision affects a group, and time is limited. What is your first instinct?", "Form my view independently, then share it.", "Get a little input, then weigh it alongside my own view.", "Invite the group to discuss and shape a decision together."),
    rating("social-03", "socialApproach", "Talking an idea through with others often helps me develop it.", "second"),
    rating("social-04", "socialApproach", "I am comfortable making progress on important tasks without frequent collaboration.", "first"),
  ],
};
