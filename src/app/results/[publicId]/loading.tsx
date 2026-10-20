import styles from "../../assessment/page.module.css";

export default function LoadingResultPage() {
  return (
    <main className={styles.page}>
      <section className={styles.flow} aria-live="polite">
        <p className={styles.eyebrow}>MINDFRAME / RESULT</p>
        <p className={styles.description}>Loading the saved result…</p>
      </section>
    </main>
  );
}
