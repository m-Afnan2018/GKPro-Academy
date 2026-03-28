import styles from "./HowItWorks.module.css";

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.topRow}>
          <span className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
              <circle cx="12" cy="12" r="10" />
            </svg>
            WORKING PROCESS
          </span>
          <h2 className={styles.heading}>
            How It <span className={styles.underline}>Work</span>
          </h2>
        </div>

        <div className={styles.videoWrap}>
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=500&fit=crop&q=80"
            alt="How it works — intro video"
            className={styles.videoCover}
          />
          <div className={styles.videoOverlay} />
          <div className={styles.videoText}>
            <span>Intro</span>
            <span>Video</span>
          </div>
          <button className={styles.playBtn} aria-label="Play video">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </button>

          {/* Floating course card */}
          <div className={styles.floatCard}>
            <div className={styles.floatCardLive}>● Live</div>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80"
              alt="Instructor"
              className={styles.floatAvatar}
            />
            <div className={styles.floatInfo}>
              <div className={styles.floatName}>Dev Masum Billah</div>
              <div className={styles.floatTitle}>The complete guide to build restful API</div>
              <div className={styles.floatRating}>
                <span className="stars">★★★★★</span>
                <span className={styles.floatRatingNum}>4.2</span>
              </div>
              <div className={styles.floatStudents}>
                <div className={styles.avatarStack}>
                  {[1,2,3].map(i => (
                    <div key={i} className={styles.avatarCircle} style={{ background: `hsl(${i*80},60%,55%)` }} />
                  ))}
                </div>
                <span className={styles.studentLabel}>Online Students</span>
              </div>
              <a href="/courses" className={styles.joinBtn}>Join Now →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
