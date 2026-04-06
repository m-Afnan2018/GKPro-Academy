import styles from "./About.module.css";

const features = [
  "Expert CA Faculty & Mentorship",
  "Industry-Focused Skill Courses",
  "Trusted by Commerce Students",
  "Live & Recorded Classes",
  "Practical Accounting Training",
  "Student Support & Career Guidance",
];

export default function About() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.inner}>
          {/* Left: Images */}
          <div className={styles.imgCol}>
            <div className={styles.imgGrid}>
              <img className="imgMain" src="/images/about-gkpro.webp" alt="about gk img" />
            </div>
            {/* <div className={styles.advisorBadge}>
              <div className={styles.advisorIcon}>🏆</div>
              <div>
                <div className={styles.advisorNum}>10+</div>
                <div className={styles.advisorLabel}>Experience Advisor</div>
              </div>
            </div> */}
          </div>

          {/* Right: Text */}
          <div className={styles.textCol}>
            <span className={styles.label}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              ABOUT GKPro ACADEMY
            </span>

            <h2 className={styles.heading}>
              We prepare Chartered Accountants and finance professionals with
              practical career skills.
            </h2>
            <span style={{ rotate: '-10deg' }}>
              <svg width="240" height="15" viewBox="0 0 240 15" fill="none" className={styles.brushCurve}>
                <path d="M5 10 Q 120 -5 235 10" stroke="var(--primary, #d1122a)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <p className={styles.body}>
              At GKPro Academy, we specialise in Chartered Accountancy preparation
              and industry-focused accounting skill programs. Our structured courses
              combine expert faculty guidance, real-world practice, and modern learning
              tools to help students build strong concepts and job-ready expertise.
              Whether you're starting your CA journey or upgrading your professional
              skills, GKPro supports you at every step.
            </p>

            <ul className={styles.featureList}>
              {features.map((f) => (
                <li key={f} className={styles.featureItem}>
                  <span className={styles.check}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a href="/courses" className="btn-primary">
              View All Program
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
