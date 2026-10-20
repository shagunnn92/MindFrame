"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ASSESSMENT_V1 } from "@/lib/assessment/v1";
import styles from "./page.module.css";

const DIMENSIONS = {
  planning: { label: "Planning", first: "Adaptive", second: "Structured" },
  reasoning: { label: "Reasoning", first: "Intuitive", second: "Analytical" },
  exploration: { label: "Exploration", first: "Familiarity-seeking", second: "Novelty-seeking" },
  execution: { label: "Execution", first: "Reflective", second: "Action-oriented" },
  riskApproach: { label: "Risk approach", first: "Cautious", second: "Experimental" },
  socialApproach: { label: "Social approach", first: "Independent", second: "Collaborative" },
} as const;

export default function AssessmentFlow() {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const question = ASSESSMENT_V1.questions[questionIndex];
  const selectedOptionId = question ? answers[question.id] : undefined;

  function chooseOption(optionId: string) {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
  }

  function goBack() {
    setQuestionIndex((current) => Math.max(0, current - 1));
  }

  async function goForward() {
    if (!selectedOptionId || isSubmitting) return;
    if (questionIndex < ASSESSMENT_V1.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    const answerList = ASSESSMENT_V1.questions.map((item) => ({
      questionId: item.id,
      optionId: answers[item.id],
    }));

    try {
      const response = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentVersion: ASSESSMENT_V1.assessmentVersion,
          answers: answerList,
        }),
      });
      const payload = (await response.json()) as {
        sharePath?: unknown;
        error?: { message?: unknown };
      };

      if (!response.ok) {
        const message = typeof payload.error?.message === "string"
          ? payload.error.message
          : "We could not save your result. Please try again.";
        throw new Error(message);
      }
      if (typeof payload.sharePath !== "string" || !payload.sharePath.startsWith("/results/")) {
        throw new Error("The server response was incomplete. Please try again.");
      }
      router.push(payload.sharePath);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "We could not save your result. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  if (!question) return null;

  const questionNumber = questionIndex + 1;
  const progress = (questionNumber / ASSESSMENT_V1.questions.length) * 100;

  return (
    <section className={styles.flow} aria-labelledby="question-title" aria-busy={isSubmitting}>
      <div className={styles.progressHeader}>
        <div>
          <p className={styles.eyebrow}>SELF-REFLECTION / {question.kind.toUpperCase()}</p>
          <p className={styles.progressCount}>
            Question <span>{questionNumber}</span> of {ASSESSMENT_V1.questions.length}
          </p>
        </div>
        <span className={styles.dimensionTag}>{DIMENSIONS[question.dimension].label}</span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="Assessment progress"
        aria-valuemin={1}
        aria-valuemax={ASSESSMENT_V1.questions.length}
        aria-valuenow={questionNumber}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <h1 className={styles.title} id="question-title">{question.prompt}</h1>
      {question.helperText && <p className={styles.description}>{question.helperText}</p>}

      <fieldset className={styles.options} disabled={isSubmitting}>
        <legend className={styles.visuallyHidden}>Choose the answer that fits you best</legend>
        {question.options.map((option, optionIndex) => (
          <label
            className={`${styles.option} ${selectedOptionId === option.id ? styles.optionSelected : ""}`}
            key={option.id}
          >
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={selectedOptionId === option.id}
              onChange={() => chooseOption(option.id)}
            />
            <span className={styles.optionMarker} aria-hidden="true">
              {question.kind === "rating" ? optionIndex + 1 : ""}
            </span>
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      {submissionError && <p className={styles.errorMessage} role="alert">{submissionError}</p>}

      <div className={styles.navigation}>
        <button className={styles.backButton} disabled={questionIndex === 0 || isSubmitting} onClick={goBack} type="button">
          Back
        </button>
        <button className={styles.primaryButton} disabled={!selectedOptionId || isSubmitting} onClick={goForward} type="button">
          {isSubmitting
            ? "Saving result…"
            : questionNumber === ASSESSMENT_V1.questions.length
              ? "Save and view result"
              : "Continue"}
          {!isSubmitting && <span aria-hidden="true">→</span>}
        </button>
      </div>
      <p className={styles.privacyNote}>
        Your answers are sent to MINDFRAME to calculate and save your result. The shareable page shows your scores, not your individual answers.
      </p>
    </section>
  );
}
