import styles from "./Features.module.css";
import Image from "next/image";

export default function Features() {
  return (
    <section style={{marginTop: '100px'}} className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {/* Card 1 — Live Interactive Learning */}
          <div className={`${styles.card} ${styles.cardRed}`}>
            <div className={styles.iconWrap}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.starIcon}>✦</div>
            <h3 className={styles.cardTitle}>Live Interactive Learning</h3>
            <p className={styles.cardDesc}>
              Attend scheduled online sessions with expert mentors, ask questions in real time,
              and participate in structured group discussions for better clarity and engagement.
            </p>
            <a href="/courses" className={styles.applyBtn}>Apply Now</a>
            <Image
              alt="live"
              src={'/images/112.png'}
              width={1000}
              height={1000}
            />
          </div>

          {/* Card 2 — Recorded Classes */}
          <div className={`${styles.card} ${styles.cardGreen}`}>
            <div className={styles.iconWrap}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" strokeLinecap="round" />
                <path d="M10 9l5 3-5 3V9z" fill="white" />
              </svg>
            </div>
            <div className={styles.starIcon}>→</div>
            <h3 className={styles.cardTitle}>Recorded Classes</h3>
            <p className={styles.cardDesc}>
              Flexible Self-Paced Learning. Access high-quality recorded lectures anytime, anywhere
              with unlimited views. Learn at your own pace with structured study material and guided support.
            </p>
            <a href="/courses" className={styles.applyBtn}>Apply Now</a>
            <Image
              alt="recorded"
              src={'/images/2.png'}
              width={1000}
              height={1000}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
