import styles from "./WhyChooseUs.module.css";

const cards = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.6">
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Why Study at GKPro",
    desc: "Build a strong foundation for your CA journey with expert guidance, structured learning paths, and exam-focused preparation designed for commerce students.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10M7 12h6" strokeLinecap="round" />
        <path d="M15 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Certification & Course Assurance",
    desc: "Get industry-recognised certification with quality learning standards, updated curriculum, and practical knowledge that prepares you for exams and careers.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.6">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Guided Admission Support",
    desc: "From course selection to enrolment, our counsellors help you choose the right CA level and skill programs based on your academic goals.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
      </svg>
    ),
    title: "Expert CA Faculty",
    desc: "Learn from experienced Chartered Accountants and accounting professionals who simplify complex concepts with practical teaching methods.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {cards.map((card) => (
            <div key={card.title} className={styles.card}>
              <div className={styles.iconWrap}>{card.icon}</div>
              <h3 className={styles.title}>{card.title}</h3>
              <p className={styles.desc}>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}