"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Categories.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const FallbackImages = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=800&auto=format&fit=crop"
];

interface Category { _id: string; name: string; slug: string; }

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${BASE}/categories?limit=8`)
      .then((r) => r.json())
      .then((json) => { if (json?.data?.categories) setCategories(json.data.categories); })
      .catch(() => { });
  }, []);

  const display = categories.length > 0 ? categories : [
    { _id: "1", name: "Language & Study Abroad", slug: "language-study-abroad" },
    { _id: "2", name: "C.A Coures", slug: "ca-courses" },
    { _id: "3", name: "Communication Skills", slug: "communication-skills" },
    { _id: "4", name: "Professional Exams", slug: "professional-exams" },
    { _id: "5", name: "Skill Courses", slug: "skill-courses" },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.layout}>

          {/* Left Column */}
          <div className={styles.leftCol}>
            <span className={styles.label}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M12 5L4 9l8 4 8-4-8-4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 10v5c0 2 2 4 6 4s6-2 6-4v-5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="11" strokeDasharray="3 3" />
              </svg>
              TOP CATEGORY
            </span>

            <h2 className={styles.heading}>
              Browse Our Top<br />
              <span className={styles.headingText}>Categories</span>
            </h2>

            <div className={styles.curveAnchor}>
              <svg className={styles.curveSvg} viewBox="0 0 120 118" preserveAspectRatio="none">
                {/* Curve from bottom-left to top-right */}
                <path d="M 6 112 L 40 112 C 80 112, 75 6, 110 6" stroke="#c0b5ba" strokeWidth="2" fill="none" strokeLinecap="round" />
                <circle cx="6" cy="112" r="4.5" fill="#c0b5ba" />
              </svg>
            </div>

            <div className={styles.btnWrapper}>
              <a href="/courses" className={styles.viewBtn}>
                View Categories
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column / Carousel */}
          <div className={styles.rightCol}>
            <div className={styles.carouselTopLine}></div>

            <div className={styles.carousel}>
              {display.map((cat, i) => (
                <Link key={cat._id} href={`/category/${cat.slug}`} className={styles.card}>
                  <div className={styles.cardImgWrap}>
                    <img
                      src={FallbackImages[i % FallbackImages.length]}
                      alt={cat.name}
                      className={styles.cardImg}
                    />
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{cat.name}</h3>
                    <span className={styles.cardCount}>
                      {i === 0 ? "2 Courses" : i === 1 ? "3 Courses" : i === 2 ? "2 Courses" : i === 3 ? "8 Courses" : "5 Courses"}
                    </span>
                    <span className={styles.cardBtn}>
                      LEARN MORE
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
