"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Categories.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const CAT_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
  "linear-gradient(135deg,#2d1b3d 0%,#6b3a4a 100%)",
  "linear-gradient(135deg,#1a2e1a 0%,#2d5a2d 100%)",
  "linear-gradient(135deg,#2e1a1a 0%,#5a2d2d 100%)",
  "linear-gradient(135deg,#1a2a3a 0%,#2d4a5a 100%)",
  "linear-gradient(135deg,#2a1a2e 0%,#5a3a5c 100%)",
];

interface Category { _id: string; name: string; slug: string; }

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${BASE}/categories?limit=8`)
      .then((r) => r.json())
      .then((json) => { if (json?.data?.categories) setCategories(json.data.categories); })
      .catch(() => {});
  }, []);

  const display = categories.length > 0 ? categories : [
    { _id: "1", name: "CA Courses", slug: "ca-courses" },
    { _id: "2", name: "Skill Courses", slug: "skill-courses" },
    { _id: "3", name: "Communication Skills", slug: "communication-skills" },
    { _id: "4", name: "Professional Exams", slug: "professional-exams" },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.label}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--primary)">
                <circle cx="12" cy="12" r="10" />
              </svg>
              TOP CATEGORY
            </span>
            <h2 className={styles.heading}>
              Browse Our Top<br />
              <span className={styles.underline}>Categories</span>
            </h2>
          </div>

          <div className={styles.headerRight}>
            <a href="/courses" className={styles.viewAll}>
              View Categories
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        <div className={styles.grid}>
          {display.map((cat, i) => (
            <Link key={cat._id} href={`/category/${cat.slug}`} className={styles.card}>
              <div className={styles.imgWrap} style={{ background: CAT_GRADIENTS[i % CAT_GRADIENTS.length] }}>
                <div className={styles.imgOverlay} />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.title}>{cat.name}</h3>
                <span className={styles.learnBtn}>
                  LEARN MORE
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
