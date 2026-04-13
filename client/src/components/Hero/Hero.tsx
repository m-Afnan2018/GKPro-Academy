"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";
import homeImage from "@/constants/images";
import icons from "@/constants/icons";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface FeaturedCourse {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  onlinePrice?: number | null;
  recordedPrice?: number | null;
  onlineOriginalPrice?: number | null;
  recordedOriginalPrice?: number | null;
}

interface BannerItem {
  _id: string;
  imageUrl: string;
  linkUrl?: string;
  altText?: string;
  featuredCourseId?: FeaturedCourse | null;
}

export default function Hero() {
    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [current, setCurrent] = useState(0);
    const [tick, setTick] = useState(0); // bumping this resets the auto-advance timer

    useEffect(() => {
        fetch(`${BASE}/banners?limit=20`)
            .then(r => r.json())
            .then(j => { if (j.success && j.data.banners?.length) setBanners(j.data.banners); })
            .catch(() => {});
    }, []);

    const count = banners.length;

    // Auto-advance every 5 s; resets when user interacts (tick changes)
    useEffect(() => {
        if (count < 2) return;
        const id = setInterval(() => setCurrent(c => (c + 1) % count), 7000);
        return () => clearInterval(id);
    }, [count, tick]);

    const handlePrev = () => {
        setCurrent(c => (c - 1 + count) % count);
        setTick(t => t + 1);
    };
    const handleNext = () => {
        setCurrent(c => (c + 1) % count);
        setTick(t => t + 1);
    };

    return (
        <section className={styles.hero}>

            {/* ── Background slides ── */}
            <div className={styles.bgSlides}>
                {count > 0
                    ? banners.map((b, i) => (
                        <div
                            key={b._id}
                            className={styles.bgSlide}
                            style={{
                                backgroundImage: `url(${b.imageUrl})`,
                                opacity: i === current ? 1 : 0,
                            }}
                        />
                    ))
                    : (
                        <div
                            className={styles.bgSlide}
                            style={{ backgroundImage: `url(${homeImage.banner.src})`, opacity: 1 }}
                        />
                    )
                }
            </div>

            {/* Dark gradient overlay */}
            <div className={styles.overlay} />

            {/* Nav arrows — only shown when there are multiple banners */}
            {count > 1 && (
                <>
                    <button
                        className={`${styles.arrow} ${styles.arrowLeft}`}
                        aria-label="Previous"
                        onClick={handlePrev}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        className={`${styles.arrow} ${styles.arrowRight}`}
                        aria-label="Next"
                        onClick={handleNext}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {/* Dot indicators */}
                    <div className={styles.dots}>
                        {banners.map((_, i) => (
                            <button
                                key={i}
                                className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
                                aria-label={`Slide ${i + 1}`}
                                onClick={() => { setCurrent(i); setTick(t => t + 1); }}
                            />
                        ))}
                    </div>
                </>
            )}

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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <a href="/about" className={styles.btnLearn}>
                            Learn More
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Right: Floating cards */}
                <div className={styles.cards}>
                    <div className={styles.statColumn}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <Image alt="redHat" src={icons.redHat} width={54} height={44} style={{ width: "54px", height: "44px", objectFit: "contain" }} />
                            </div>
                            <div className={styles.statNum}>5000+</div>
                            <div className={styles.statLabel}>Successful Learners</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.statCardRed}`}>
                            <div className={styles.statIcon}>
                                <Image alt="apple" src={icons.apple} width={54} height={44} style={{ width: "54px", height: "44px", objectFit: "contain" }} />
                            </div>
                            <div className={styles.statNum}>120+</div>
                            <div className={styles.statLabel}>Live &amp; Recorded Classes</div>
                        </div>
                    </div>

                    {(() => {
                        const fc = banners[current]?.featuredCourseId ?? null;
                        if (!fc) return null;
                        const price = fc.onlinePrice ?? fc.recordedPrice ?? null;
                        const originalPrice = fc.onlineOriginalPrice ?? fc.recordedOriginalPrice ?? null;
                        const discount = price && originalPrice && originalPrice > price
                            ? Math.round((1 - price / originalPrice) * 100)
                            : null;
                        const mode = fc.onlinePrice ? "Online" : "Recorded";
                        return (
                            <Link href={`/courses/${fc.slug}`} className={styles.imageCard} style={{ textDecoration: "none" }}>
                                <div className={styles.onlineBadge}>{mode}</div>
                                <div className={styles.cardImageWrap}>
                                    {fc.thumbnailUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={fc.thumbnailUrl}
                                            alt={fc.title}
                                            className={styles.cardImg}
                                        />
                                    ) : (
                                        <div className={styles.cardImgPlaceholder}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardInfo}>
                                    <div className={styles.cardTitle}>{fc.title}</div>
                                    {fc.description && (
                                        <p className={styles.cardDesc}>
                                            {fc.description.length > 90 ? fc.description.slice(0, 90) + "…" : fc.description}
                                        </p>
                                    )}
                                    {price != null && (
                                        <div className={styles.cardPriceRow}>
                                            <div className={styles.cardPricing}>
                                                {originalPrice && originalPrice > price && (
                                                    <span className={styles.originalPrice}>₹{originalPrice.toLocaleString("en-IN")}</span>
                                                )}
                                                <span className={styles.currentPrice}>₹{price.toLocaleString("en-IN")}</span>
                                            </div>
                                            {discount && <div className={styles.discountBadge}>{discount}% Off</div>}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })()}
                </div>
            </div>
        </section>
    );
}
