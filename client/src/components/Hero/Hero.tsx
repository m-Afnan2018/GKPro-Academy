import Link from "next/link";
import styles from "./Hero.module.css";
import Image from "next/image";
import homeImage from "@/constants/images";
import icons from "@/constants/icons";

export default function Hero() {
    return (
        <section
            className={styles.hero}
            style={{
                background: `linear-gradient(rgb(15 15 30 / 12%), rgb(15 15 30 / 1%)), url(${homeImage.banner.src}) center/cover no-repeat;`,
            }}
        >
            {/* Dark overlay */}
            <div className={styles.overlay} />

            {/* Nav arrows */}
            <button
                className={`${styles.arrow} ${styles.arrowLeft}`}
                aria-label="Previous"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        d="M15 18l-6-6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
            <button
                className={`${styles.arrow} ${styles.arrowRight}`}
                aria-label="Next"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        d="M9 18l6-6-6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            <div className={`container ${styles.inner}`}>
                {/* Left: Text content */}
                <div className={styles.content}>
                    <div className={styles.tag}>
                        <span className={styles.tagIcon}>⚡</span>
                        Start Your CA &amp; Accounting Career Today
                    </div>

                    <h1 className={styles.heading}>
                        Master CA Preparation &amp;
                        <br />
                        In-Demand Accounting
                        <br />
                        Skills — Learn Smart,
                        <br />
                        Grow Fast
                    </h1>

                    <p className={styles.subtext}>
                        Join GKPro and get expert-led CA coaching and practical
                        skill courses. Build strong concepts, gain industry
                        tools expertise, and move closer to a successful finance
                        career.
                    </p>

                    <div className={styles.ctas}>
                        <Link href="/courses" className={styles.btnFind}>
                            Find Courses
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <path
                                    d="M5 12h14M12 5l7 7-7 7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </Link>
                        <a href="/about" className={styles.btnLearn}>
                            Learn More
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <path
                                    d="M5 12h14M12 5l7 7-7 7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Right: Floating cards */}
                <div className={styles.cards}>
                    {/* Left column: stacked stat cards */}
                    <div className={styles.statColumn}>
                        {/* Stat card: learners */}
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <Image
                                    alt="redHat"
                                    src={icons.redHat}
                                    width={54}
                                    height={44}
                                    style={{ width: "54px", height: "44px", objectFit: "contain" }}
                                />
                            </div>
                            <div className={styles.statNum}>5000+</div>
                            <div className={styles.statLabel}>Successful Learners</div>
                        </div>

                        {/* Stat card: classes */}
                        <div className={`${styles.statCard} ${styles.statCardRed}`}>
                            <div className={styles.statIcon}>
                                <Image
                                    alt="apple"
                                    src={icons.apple}
                                    width={54}
                                    height={44}
                                    style={{ width: "54px", height: "44px", objectFit: "contain" }}
                                />
                            </div>
                            <div className={styles.statNum}>120+</div>
                            <div className={styles.statLabel}>Live &amp; Recorded Classes</div>
                        </div>
                    </div>

                    {/* Right column: Course card */}
                    <div className={styles.imageCard}>
                        <div className={styles.onlineBadge}>Online</div>
                        <div className={styles.cardImageWrap}>
                            <Image
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=220&fit=crop&q=80"
                                width={400}
                                height={220}
                                alt="CA Accounting instructor"
                                className={styles.cardImg}
                            />
                        </div>
                        <div className={styles.cardInfo}>
                            <div className={styles.cardTitle}>CA Accounting</div>
                            <p className={styles.cardDesc}>
                                Master core accounting concepts, financial
                                statements, and practical problem-solving
                                for CA exams.
                            </p>
                            <div className={styles.cardPriceRow}>
                                <div className={styles.cardPricing}>
                                    <span className={styles.originalPrice}>₹10,100</span>
                                    <span className={styles.currentPrice}>₹8500</span>
                                </div>
                                <div className={styles.discountBadge}>15% Off</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
