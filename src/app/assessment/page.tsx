import Link from "next/link";
import AssessmentFlow from "./assessment-flow";
import styles from "./page.module.css";

export default function AssessmentPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.wordmark} href="/">
        <span className={styles.mark} aria-hidden="true">M</span>
        <span>MINDFRAME</span>
      </Link>
      <AssessmentFlow />
    </main>
  );
}
