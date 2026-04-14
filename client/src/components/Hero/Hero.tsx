"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import styles from "./Hero.module.css";

const BASE     = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const INTERVAL = 5000;   // auto-advance ms
const DURATION = 520;    // must match CSS animation duration

interface BannerItem {
  _id: string;
  desktopImageUrl: string;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  altText?: string | null;
}

export default function Hero() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [current, setCurrent] = useState(0);
  // entering = index of slide currently animating in
  const [entering, setEntering]   = useState<number | null>(null);
  const [dir, setDir]             = useState<"next" | "prev">("next");
  const [paused, setPaused]       = useState(false);
  const [animKey, setAnimKey]     = useState(0);  // resets progress bar

  const busyRef    = useRef(false);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${BASE}/banners?limit=20`)
      .then(r => r.json())
      .then(j => { if (j.success) setBanners(j.data.banners ?? []); })
      .catch(() => {});
  }, []);

  const count = banners.length;

  /* navigate to a specific index with direction */
  const navigate = useCallback((toIndex: number, direction: "next" | "prev") => {
    if (busyRef.current) return;
    busyRef.current = true;
    setDir(direction);
    setEntering(toIndex);
    setAnimKey(k => k + 1);

    setTimeout(() => {
      setCurrent(toIndex);
      setEntering(null);
      busyRef.current = false;
    }, DURATION);
  }, []);

  const goNext = useCallback(() => navigate((current + 1) % count, "next"), [current, count, navigate]);
  const goPrev = useCallback(() => navigate((current - 1 + count) % count, "prev"), [current, count, navigate]);
  const goTo   = useCallback((i: number) => navigate(i, i > current ? "next" : "prev"), [current, navigate]);

  /* auto-advance timer */
  const stopTimer  = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const startTimer = useCallback(() => {
    stopTimer();
    if (count > 1 && !paused) timerRef.current = setInterval(goNext, INTERVAL);
  }, [count, paused, goNext]);

  useEffect(() => { startTimer(); return stopTimer; }, [startTimer]);

  if (!count) return null;

  /* Determine classes for each slide */
  const getSlideClass = (i: number) => {
    if (i === entering) {
      // This slide is sliding IN
      return `${styles.slide} ${dir === "next" ? styles.enterFromRight : styles.enterFromLeft}`;
    }
    if (i === current) {
      // This slide is the background (being replaced) — only when a transition is active
      return `${styles.slide} ${entering !== null ? styles.slideBehind : styles.slideFront}`;
    }
    return `${styles.slide} ${styles.slideHidden}`;
  };

  const activeBanner = banners[entering ?? current];

  return (
    <section
      className={styles.hero}
      onMouseEnter={() => { setPaused(true);  stopTimer();  }}
      onMouseLeave={() => { setPaused(false); startTimer(); }}
    >
      {/* Slide stack */}
      <div className={styles.slides}>
        {banners.map((b, i) => (
          <div key={b._id} className={getSlideClass(i)} aria-hidden={i !== current && i !== entering}>
            <SlideContent banner={b} />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => { goPrev(); startTimer(); }} aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => { goNext(); startTimer(); }} aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className={styles.dots}>
          {banners.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === (entering ?? current) ? styles.dotActive : ""}`}
              onClick={() => { goTo(i); startTimer(); }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {count > 1 && !paused && (
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} key={animKey} />
        </div>
      )}

      {/* Clickable badge */}
      {activeBanner?.linkUrl && (
        <div className={styles.linkBadge} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Click to visit
        </div>
      )}
    </section>
  );
}

function SlideContent({ banner }: { banner: BannerItem }) {
  const inner = (
    <picture className={styles.picture}>
      {banner.mobileImageUrl && (
        <source media="(max-width: 768px)" srcSet={banner.mobileImageUrl} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.desktopImageUrl}
        alt={banner.altText ?? "Banner"}
        className={styles.img}
        draggable={false}
      />
    </picture>
  );

  if (banner.linkUrl) {
    const isExternal = banner.linkUrl.startsWith("http");
    return (
      <a
        href={banner.linkUrl}
        className={styles.link}
        target={isExternal ? "_blank" : "_self"}
        rel={isExternal ? "noopener noreferrer" : undefined}
        aria-label={banner.altText ?? "View more"}
      >
        {inner}
      </a>
    );
  }
  return <div className={styles.link}>{inner}</div>;
}
