import styles from "./HowItWorks.module.css";

export default function HowItWorks() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.topRow}>
                    <span className={styles.label}>
                        <svg
                            className={styles.labelIcon}
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="1.5"
                        >
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        Watch Demo Lecture
                    </span>
                    <h2 className={styles.heading}>
                        Experience Our Teaching Style <span className={styles.underline}>Before Joining</span>
                    </h2>
                </div>

                <iframe
                    src="https://www.youtube.com/embed/rBytI-rDIXM"
                    width="100%"
                    height="450"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ border: "none", borderRadius: "8px" }}
                />

                {/*<div className={styles.videoWrap}>
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

        </div>*/}
            </div>
        </section>
    );
}
