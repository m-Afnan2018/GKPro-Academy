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
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}
                    >
                        {/* Stat card: learners */}
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <Image
                                    alt="redHat"
                                    src={icons.redHat}
                                    width={100}
                                    height={100}
                                    style={{width: '54px', height: '44px', objectFit: 'cover'}}
                                />
                            </div>
                            <div>
                                <div className={styles.statNum}>250+</div>
                                <div className={styles.statLabel}>
                                    Our Happy Students
                                </div>
                            </div>
                        </div>

                        {/* Stat card: classes */}
                        <div
                            className={`${styles.statCard} ${styles.statCardRed}`}
                        >
                            <div className={styles.statIcon}>
                                <Image
                                    alt="apple"
                                    src={icons.apple}
                                    width={54}
                                    height={44}
                                />
                            </div>
                            <div>
                                <div className={styles.statNum}>3652+</div>
                                <div className={styles.statLabel}>
                                    Finished Session
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main image card */}
                    {/*<div>
                        <div>
                          <div>
                            <Image src={} alt="folder-image" width={14} height={10}/>
                            <span>Data Science</span>
                          </div>
                          <div>
                            <Image src={} alt="recorder-image" width={14} height={10}/>
                          </div>
                        </div>
                        <div>
                          <Image src={} alt="star-image" width={14} height={14}/>
                        </div>
                        <h3>Interior design concepts Masterclass</h3>
                        <div>
                          <div>
                            <Image src={} alt="book-image" width={16} height={16}/>
                            <span>0 Lessons</span>
                          </div>
                          <div>
                            <Image src={} alt="book-image" width={16} height={16}/>
                            <span>0 Lessons</span>
                          </div>
                        </div>
                        <div>
                          <div>
                            <span>$65.00</span>
                            <span>$55.00</span>
                          </div>
                          <div>
                            <Image src={} alt="masum-billah" width={30} height={30}/>
                            <p>Masum Billah</p>
                          </div>
                        </div>
                    </div>
                    */}
                    <div className={styles.imageCard}>
                        <div className={styles.onlineBadge}>● Online</div>
                        <div className={styles.cardImageWrap}>
                            <Image
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=200&fit=crop&q=80"
                                width={100}
                                height={100}
                                alt="CA Accounting instructor"
                                className={styles.cardImg}
                            />
                        </div>
                        <div className={styles.cardInfo}>
                            <div className={styles.cardStars}>
                                <span className="stars">★★★★★</span>
                                <span className={styles.cardRating}>
                                    4.9 (200+ ratings)
                                </span>
                            </div>
                            <div className={styles.cardTitle}>
                                CA Accounting
                            </div>
                            <p className={styles.cardDesc}>
                                Master core accounting concepts, financial
                                statements, and practical problem solving for CA
                                exams.
                            </p>
                            <div className={styles.discountBadge}>10% Off</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
