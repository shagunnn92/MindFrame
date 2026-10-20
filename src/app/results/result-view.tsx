"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ArchetypeId, DimensionId } from "@/lib/scoring/types";
import type { PublicAssessmentResult } from "@/lib/results/types";
import styles from "../assessment/page.module.css";

const ARCHETYPE_NAMES: Record<ArchetypeId, string> = {
  architect: "The Architect",
  analyst: "The Analyst",
  explorer: "The Explorer",
  creator: "The Creator",
  sentinel: "The Sentinel",
  catalyst: "The Catalyst",
};

const DIMENSIONS: Record<DimensionId, { label: string; first: string; second: string }> = {
  planning: { label: "Planning", first: "Adaptive", second: "Structured" },
  reasoning: { label: "Reasoning", first: "Intuitive", second: "Analytical" },
  exploration: { label: "Exploration", first: "Familiarity-seeking", second: "Novelty-seeking" },
  execution: { label: "Execution", first: "Reflective", second: "Action-oriented" },
  riskApproach: { label: "Risk approach", first: "Cautious", second: "Experimental" },
  socialApproach: { label: "Social approach", first: "Independent", second: "Collaborative" },
};

export default function ResultView({ publicId }: { publicId: string }) {
  const [result, setResult] = useState<PublicAssessmentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);
    async function loadResult() {
      try {
        const response = await fetch(`/api/results/${encodeURIComponent(publicId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          result?: PublicAssessmentResult;
          error?: { message?: string };
        };
        if (!response.ok || !payload.result) {
          throw new Error(payload.error?.message ?? "This result is temporarily unavailable.");
        }
        setResult(payload.result);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setErrorMessage(error instanceof Error ? error.message : "This result is temporarily unavailable.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadResult();
    return () => controller.abort();
  }, [publicId]);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setShareMessage("Share link copied to your clipboard.");
    } catch {
      setShareMessage("Copying was blocked by the browser. You can copy the link from the address bar.");
    }
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.flow} aria-live="polite">Loading your saved result…</section>
      </main>
    );
  }

  if (errorMessage || !result) {
    return (
      <main className={styles.page}>
        <section className={styles.flow} aria-labelledby="result-error-title">
          <p className={styles.eyebrow}>MINDFRAME / RESULT</p>
          <h1 className={styles.title} id="result-error-title">We couldn’t load this result.</h1>
          <p className={styles.description} role="alert">{errorMessage ?? "This result could not be found."}</p>
          <Link className={styles.primaryButton} href="/assessment">Start a new assessment</Link>
        </section>
      </main>
    );
  }

  const primary = result.primaryArchetypeId;
  const secondary = result.secondaryArchetypeId;

  return (
    <main className={styles.page}>
      <Link className={styles.wordmark} href="/">
        <span className={styles.mark} aria-hidden="true">M</span>
        <span>MINDFRAME</span>
      </Link>
      <section className={styles.flow} aria-labelledby="result-title">
        <p className={styles.eyebrow}>ASSESSMENT / SAVED RESULT</p>
        <h1 className={styles.title} id="result-title">
          {primary ? ARCHETYPE_NAMES[primary] : "Balanced profile"}
        </h1>
        <p className={styles.description}>
          {primary
            ? "This reflects the choices made in this assessment. It is a prompt for reflection, not a fixed label."
            : "Your answers did not point strongly to one profile. Individual dimensions can still lean in a direction."}
          {secondary ? ` There is also some affinity with ${ARCHETYPE_NAMES[secondary]}.` : ""}
        </p>

        <div className={styles.results} aria-label="Dimension scores">
          {(Object.keys(DIMENSIONS) as DimensionId[]).map((dimension) => {
            const score = result.dimensionScores[dimension];
            const labels = DIMENSIONS[dimension];
            return (
              <div className={styles.resultRow} key={dimension}>
                <div className={styles.resultLabel}>
                  <span>{labels.label}</span>
                  <span>{score > 0 ? `+${score}` : score}</span>
                </div>
                <div
                  className={styles.scoreTrack}
                  role="meter"
                  aria-label={`${labels.label} score`}
                  aria-valuemin={-100}
                  aria-valuemax={100}
                  aria-valuenow={score}
                >
                  <span className={styles.scoreCenter} />
                  <span
                    className={`${styles.scoreFill} ${score < 0 ? styles.scoreNegative : styles.scorePositive}`}
                    style={{ width: `${Math.abs(score) / 2}%` }}
                  />
                </div>
                <div className={styles.poleLabels}>
                  <span>{labels.first}</span>
                  <span>{labels.second}</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className={styles.privacyNote}>
          This shareable page shows your scores and archetype affinities. It does not include your individual answers or personal identity.
        </p>
        <p className={styles.privacyNote}>Completed {new Date(result.createdAt).toLocaleDateString()}.</p>
        <div className={styles.shareActions}>
          <button className={styles.primaryButton} onClick={copyShareLink} type="button">
            {linkCopied ? "Link copied" : "Copy share link"}
          </button>
          <Link className={styles.backButton} href="/assessment">Take the assessment</Link>
        </div>
        {shareMessage && <p className={styles.privacyNote} role="status">{shareMessage}</p>}
      </section>
    </main>
  );
}
