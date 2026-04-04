import styles from "./Tutors.module.css";

export default function Tutors() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.topRow}>
          <div className={styles.labelWrapper}>
            <span className={styles.labelIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </span>
            <span className={styles.labelText}>INSTRUCTORS</span>
          </div>

          <div className={styles.headingWrapper}>
            <h2 className={styles.heading}>Our Expert Tutors</h2>
            <svg width="240" height="15" viewBox="0 0 240 15" fill="none" className={styles.brushCurve}>
              <path d="M5 10 Q 120 -5 235 10" stroke="var(--primary, #d1122a)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className={styles.inner}>
          {/* Left: Tutor profile card */}
          <div className={styles.profileCard}>
            <div className={styles.cardBgLeft}></div>
            <div className={styles.facultyText}>Faculty</div>
            <img
              src="/images/tutor.png"
              alt="CA Kiranjeet Kaur"
              className={styles.profileImg}
            />
            <div className={styles.bottomGradient}></div>
            <div className={styles.profileBadge}>
              <div className={styles.profileName}>CA Kiranjeet Kaur</div>
              <div className={styles.profileRole}>Accounting Expert</div>
            </div>
          </div>

          {/* Right: Bio */}
          <div className={styles.bioCol}>
            <h3 className={styles.tutorName}>CA Kiranjeet Kaur</h3>
            <p className={styles.tutorRole}>Chartered Accountant &amp; Accounting Mentor</p>

            <div className={styles.bioBlock}>
              <p className={styles.bio}>
                CA Kiranjeet Kaur is a Chartered Accountant and the Co-Founder of GKPro
                Academy. With a strong passion for teaching and mentoring students, she focuses
                on building clear conceptual understanding and practical knowledge in accounting
                and commerce subjects.
              </p>

              <p className={styles.bio}>
                She has over 5 years of teaching experience, during which she has guided students
                in developing strong academic foundations and exam-oriented preparation
                strategies.
                <br />
                In addition to teaching, she has also gained professional exposure through working
                with a UK-based outsourced accounting firm, where she was involved in practical
                accounting processes and financial reporting. This experience allows her to
                connect classroom concepts with real-world applications.
              </p>

              <p className={styles.bio}>
                Through GKPro Academy, her vision is to provide structured learning, conceptual
                clarity, and consistent academic guidance to help students succeed in their
                professional journey.
              </p>
            </div>

            {/* Social links */}
            <div className={styles.socials}>
              <a href="#" className={styles.socialBtn} aria-label="Facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text-main)" stroke="var(--text-main)" strokeWidth="1">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" className={styles.socialBtn} aria-label="X (Twitter)">
                {/* Custom modern X logo path */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className={styles.socialBtn} aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-brand-youtube"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 3a5 5 0 0 1 5 5v8a5 5 0 0 1 -5 5h-12a5 5 0 0 1 -5 -5v-8a5 5 0 0 1 5 -5zm-9 6v6a1 1 0 0 0 1.514 .857l5 -3a1 1 0 0 0 0 -1.714l-5 -3a1 1 0 0 0 -1.514 .857z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
