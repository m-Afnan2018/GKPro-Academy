import styles from "./AboutContent.module.css";

export default function AboutContent() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.inner}>

          {/* Left: stacked images + badge */}
          <div className={styles.imgCol}>
            <div className={styles.imgStack}>
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?w=420&h=300&fit=crop&q=80"
                alt="GKPro campus"
                className={styles.imgLarge}
              />
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&h=220&fit=crop&q=80"
                alt="Students"
                className={styles.imgSmall}
              />
            </div>
            <div className={styles.advisorBadge}>
              <div className={styles.advisorIcon}>🎓</div>
              <div>
                <div className={styles.advisorNum}>10+</div>
                <div className={styles.advisorLabel}>Experience Advisor</div>
              </div>
            </div>
            <span className={styles.loveDecor}>love.</span>
          </div>

          {/* Right: Text */}
          <div className={styles.textCol}>
            <span className={styles.label}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
                <circle cx="12" cy="12" r="10" />
              </svg>
              ABOUT GKPro ACADEMY
            </span>

            <h2 className={styles.heading}>
              We create unique digital media experiences.
            </h2>

            <p className={styles.body}>
              At GKPro Academy, we are committed to shaping successful careers in
              Chartered Accountancy and professional accounting. Our programs combine
              expert mentorship, structured exam preparation, and practical skill
              training to help commerce students achieve academic excellence and
              industry readiness.
            </p>

            <p className={styles.body}>
              We specialise in CA Foundation, Intermediate, and Final level coaching,
              alongside industry-relevant accounting skill courses designed to build
              real-world confidence and exam competence, and real-world professional skills.
            </p>

            {/* Mission & Vision */}
            <div className={styles.mvGrid}>
              <div className={styles.mvCard}>
                <div className={styles.mvIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h4 className={styles.mvTitle}>Our Mission</h4>
                  <p className={styles.mvDesc}>
                    To provide high-quality CA and practical accounting education that
                    builds strong concepts, exam confidence, and real-world professional skills.
                  </p>
                </div>
              </div>

              <div className={styles.mvCard}>
                <div className={styles.mvIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h4 className={styles.mvTitle}>Our Vision</h4>
                  <p className={styles.mvDesc}>
                    To become a trusted learning platform for commerce students by
                    delivering results-driven, CA-focused programs with practical
                    accounting skill courses.
                  </p>
                </div>
              </div>
            </div>

            <a href="/courses" className="btn-primary">
              View All Courses
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