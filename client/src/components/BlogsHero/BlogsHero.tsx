import styles from "./BlogsHero.module.css";

export default function BlogsHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />

      {/* Decorative hexagons */}
      <div className={styles.hexGroup}>
        <div className={`${styles.hex} ${styles.hexGreen}`} />
        <div className={`${styles.hex} ${styles.hexOutline}`} />
        <div className={`${styles.hex} ${styles.hexOutlineSm}`} />
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollHint}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className={styles.content}>
        <h1 className={styles.heading}>About</h1>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.sep}>›</span>
          <span className={styles.breadcrumbCurrent}>About</span>
        </nav>
      </div>
    </section>
  );
}