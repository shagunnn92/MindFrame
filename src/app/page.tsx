import Link from "next/link";
import styles from "./page.module.css";

const dimensions = [
  ["Planning", "Adaptive", "Structured"],
  ["Reasoning", "Intuitive", "Analytical"],
  ["Exploration", "Familiarity", "Novelty"],
  ["Execution", "Reflective", "Action-oriented"],
  ["Risk approach", "Cautious", "Experimental"],
  ["Social approach", "Independent", "Collaborative"],
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="MINDFRAME home">
          <span className={styles.mark} aria-hidden="true">M</span>
          <span>MINDFRAME</span>
        </Link>
        <a className={styles.navLink} href="#dimensions">The dimensions</a>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <p className={styles.eyebrow}><span className={styles.statusDot} /> A SELF-REFLECTION SYSTEM</p>
        <h1 id="hero-title">Understand the patterns behind your decisions.</h1>
        <p className={styles.lede}>
          Take a moment to explore how you approach plans, ideas, action, and the people around you.
          Your result is a prompt for reflection, not a label that defines you.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="/assessment">
            Start assessment <span aria-hidden="true">→</span>
          </Link>
          <span className={styles.actionNote}>No account required</span>
        </div>
        <div className={styles.heroMeta}>
          <span><span className={styles.metaIcon}>01</span> Six reflection dimensions</span>
          <span><span className={styles.metaIcon}>02</span> Clear, deterministic scoring</span>
          <span><span className={styles.metaIcon}>03</span> Your answers stay yours</span>
        </div>
      </section>

      <section className={styles.dimensions} id="dimensions" aria-labelledby="dimensions-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>A MAP, NOT A BOX</p>
          <h2 id="dimensions-title">Six ways to look at a decision.</h2>
          <p>People are more than one type. MINDFRAME looks at several tendencies together.</p>
        </div>
        <div className={styles.dimensionGrid}>
          {dimensions.map(([name, left, right], index) => (
            <article className={styles.dimensionCard} key={name}>
              <span className={styles.dimensionIndex}>0{index + 1}</span>
              <h3>{name}</h3>
              <div className={styles.poles}>
                <span>{left}</span><span className={styles.poleLine} aria-hidden="true" /><span>{right}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.note} aria-label="Important note">
        <span className={styles.noteMark} aria-hidden="true">i</span>
        <p>
          MINDFRAME is for self-reflection. It is not a clinical tool, diagnosis, or scientifically
          validated personality test. You can take the assessment without creating an account.
        </p>
      </section>

      <footer className={styles.footer}>
        <span>MINDFRAME <span className={styles.footerDivider}>/</span> REFLECT WITH CURIOSITY</span>
        <span>Built around patterns, not prescriptions.</span>
      </footer>
    </main>
  );
}
