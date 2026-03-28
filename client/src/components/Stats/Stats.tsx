import styles from "./Stats.module.css";

const stats = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "CA-Led Teaching",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" strokeLinecap="round" />
      </svg>
    ),
    label: "ICAI-Based Curriculum",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Exam-Oriented Preparation",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <path d="M9.663 17h4.673M12 3v1M6.343 6.343l-.707.707M3 12H2M6.343 17.657l-.707-.707M12 20v1M17.657 17.657l.707-.707M22 12h-1M17.657 6.343l.707-.707" strokeLinecap="round" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    label: "Concept-First Teaching",
  },
];

export default function Stats() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {stats.map((s) => (
            <div key={s.label} className={styles.item}>
              <div className={styles.iconWrap}>{s.icon}</div>
              <p className={styles.label}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
