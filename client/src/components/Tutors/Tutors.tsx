import styles from "./Tutors.module.css";

export default function Tutors() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.topRow}>
          <span className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
              <circle cx="12" cy="12" r="10" />
            </svg>
            INSTRUCTORS
          </span>
          <h2 className={styles.heading}>
            Our Expert <span className={styles.underline}>Tutors</span>
          </h2>
        </div>

        <div className={styles.inner}>
          {/* Left: Tutor profile card */}
          <div className={styles.profileCard}>
            <div className={styles.profileImgWrap}>
              <img
                src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=300&h=400&fit=crop&q=80"
                alt="CA Kiranjeet Kaur"
                className={styles.profileImg}
              />
            </div>
            <div className={styles.profileBadge}>
              <div className={styles.profileName}>CA Kiranjeet Kaur</div>
              <div className={styles.profileRole}>Accounting Expert</div>
            </div>
          </div>

          {/* Right: Bio */}
          <div className={styles.bioCol}>
            <h3 className={styles.tutorName}>CA Kiranjeet Kaur</h3>
            <p className={styles.tutorRole}>Chartered Accountant &amp; Accounting Mentor</p>

            <p className={styles.bio}>
              CA Kiranjeet Kaur is a Chartered Accountant and the Co-Founder of GKPro Academy.
              With a strong passion for teaching and mentoring students, she focuses on building
              clear conceptual understanding and exam-oriented preparation in accounting and
              commerce subjects.
            </p>

            <p className={styles.bio}>
              She has over 5 years of teaching experience, during which she has guided students
              in developing strong academic foundations and exam-oriented preparation strategies.
              In addition to teaching, she has also gained professional exposure through working
              with a UK-based outsourced accounting firm, where she was involved in practical
              accounting processes and financial reporting.
            </p>

            <p className={styles.bio}>
              Through GKPro Academy, her vision is to provide structured learning, conceptual
              clarity, and consistent academic guidance to help students succeed in their
              professional journey.
            </p>

            {/* Social links */}
            <div className={styles.socials}>
              <a href="#" className={styles.socialBtn} aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" className={styles.socialBtn} aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="#" className={styles.socialBtn} aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
                </svg>
              </a>
            </div>

            {/* Dot navigation */}
            <div className={styles.dots}>
              <span className={`${styles.dot} ${styles.dotActive}`} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
