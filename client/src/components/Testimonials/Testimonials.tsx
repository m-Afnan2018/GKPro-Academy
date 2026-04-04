"use client";
import { useEffect, useState } from "react";
import styles from "./Testimonials.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const FALLBACK = [
  {
    _id: "1",
    studentName: "Aarav Sharma",
    courseName: "CA Foundation",
    content: "GKPro helped me build strong accounting concepts and clear my CA Foundation confidently. The faculty support and structured classes made learning simple and effective.",
    rating: 5,
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&q=80",
  },
  {
    _id: "2",
    studentName: "Riya Mehta",
    courseName: "Tally & Excel",
    content: "The practical skill courses at GKPro improved my Trent and Tally expertise. Live sessions and hands-on training made this job-ready.",
    rating: 5,
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80",
  },
];

interface Testimonial { _id: string; studentName: string; courseId?: { title: string } | null; courseName?: string; content: string; rating: number; photoUrl?: string; }

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch(`${BASE}/testimonials?general=true&limit=10`)
      .then((r) => r.json())
      .then((json) => { if (json?.data?.testimonials?.length) setTestimonials(json.data.testimonials); })
      .catch(() => { });
  }, []);

  const items = testimonials.length ? testimonials : FALLBACK;
  const pairs: Testimonial[][] = [];
  for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
  const current = pairs[idx] ?? pairs[0] ?? [];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.inner}>
          {/* Left: Rating block */}


          {/* Right: Text + Cards */}
          <div className={styles.rightCol}>
            <div className={styles.header}>
              <span className={styles.label}>
                <span className={styles.labelDot}></span>
                TESTIMONIALS
              </span>
              {pairs.length > 1 && (
                <div className={styles.navArrows}>
                  <button className={styles.navBtn} aria-label="Previous" onClick={() => setIdx((i) => (i - 1 + pairs.length) % pairs.length)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button className={`${styles.navBtn} ${styles.navBtnActive}`} aria-label="Next" onClick={() => setIdx((i) => (i + 1) % pairs.length)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <h2 className={styles.heading}>
              People&apos;s Say About Our<br />
              <span className={styles.underline}>GKPro</span>
            </h2>

            <div className={styles.cards}>
              <div className={styles.ratingBlock}>
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=360&fit=crop&q=80"
                  alt="Students at GKPro"
                  className={styles.ratingImg}
                />
                <div className={styles.ratingOverlay} />
                <div className={styles.ratingContent}>
                  <div className={styles.ratingNum}>4.8</div>
                  <div className={styles.ratingStars}>★★★★★</div>
                  <div className={styles.ratingLabel}>Based Rating</div>
                </div>
              </div>
              {current.map((t) => (
                <div key={t._id} className={styles.card}>
                  <div className={styles.cardTop}>
                    {t.photoUrl ? (
                      <img src={t.photoUrl} alt={t.studentName} className={styles.avatar} />
                    ) : (
                      <div className={styles.avatar} style={{ background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                        {t.studentName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className={styles.personName}>{t.studentName}</div>
                      <div className={styles.personLocation}>
                        {typeof t.courseId === "object" && t.courseId?.title ? t.courseId.title : t.courseName ?? ""}
                      </div>
                    </div>
                  </div>
                  <p className={styles.text}>{t.content}</p>
                  <div className={styles.cardBottom}>
                    <div className={styles.cardStars}>{"★".repeat(t.rating)}</div>
                    <div className={styles.quoteIcon}>&ldquo;&rdquo;</div>
                  </div>
                </div>

              ))}

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
