"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Courses.module.css";
import Image from "next/image";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
  "linear-gradient(135deg,#2d1b3d 0%,#6b3a4a 100%)",
  "linear-gradient(135deg,#1a2e1a 0%,#2d5a2d 100%)",
  "linear-gradient(135deg,#2e1a1a 0%,#5a2d2d 100%)",
];

interface Course { _id: string; title: string; shortDescription?: string; description?: string; thumbnailUrl?: string; slug: string; categoryId?: { _id: string; name: string } | string; }
interface Batch { _id: string; courseId: string; mode: string; }
interface Plan { _id: string; batchId: string; price: number; }

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/courses?status=published&limit=6`).then((r) => r.json()),
      fetch(`${BASE}/batches?limit=100`).then((r) => r.json()),
      fetch(`${BASE}/plans?limit=100`).then((r) => r.json()),
      fetch(`${BASE}/categories?limit=20`).then((r) => r.json()),
    ])
      .then(([c, b, p, cat]) => {
        setCourses(c?.data?.courses ?? []);
        setBatches(b?.data?.batches ?? []);
        setPlans(p?.data?.plans ?? []);
        setCategories(cat?.data?.categories ?? []);
      })
      .catch(() => { });
  }, []);

  const filteredCourses = courses.filter((c) => {
    if (activeTab === "all") return true;
    const catId = typeof c.categoryId === "object" ? c.categoryId?._id : c.categoryId;
    return catId === activeTab;
  });

  const getBatchMode = (courseId: string) => {
    const batch = batches.find((b) => b.courseId === courseId || (b as any).courseId?._id === courseId);
    return batch?.mode ?? "online";
  };

  const getPrice = (courseId: string) => {
    const batch = batches.find((b) => b.courseId === courseId || (b as any).courseId?._id === courseId);
    if (!batch) return null;
    const plan = plans.find((p) => p.batchId === batch._id || (p as any).batchId?._id === batch._id);
    return plan?.price ?? null;
  };

  const tabs = [
    { id: "all", label: "All Courses" },
    ...categories.slice(0, 3).map((c) => ({ id: c._id, label: c.name })),
  ];

  const display = filteredCourses.slice(0, 6);

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.heading}>Most Popular Courses</h2>
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {display.map((course, i) => {
            const mode = getBatchMode(course._id);
            const price = getPrice(course._id);
            const originalPrice = price ? Math.round(price / 0.85 / 100) * 100 : null;
            const badgeLabel = mode === "recorded" ? "Recorded" : mode === "one_on_one" ? "1-on-1" : "Online";
            const badgeClass = mode === "recorded" ? styles.badgeRed : styles.badgeGreen;
            const desc = course.shortDescription || course.description?.slice(0, 120) || "";

            return (
              <Link key={course._id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                <div className={styles.card}>
                  <div
                    className={styles.imgWrap}
                    style={course.thumbnailUrl ? undefined : { background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                  >
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className={styles.img} />
                    ) : (
                      <h3 style={{color: 'white', position: 'absolute', top: '45%', bottom: 0, left: '10%', right: '10%', textAlign: 'center'}}>{course.title}</h3>
                    )}
                    <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>
                  </div>

                  <div className={styles.body}>
                    <h3 className={styles.title}>{course.title}</h3>
                    {desc && <p className={styles.desc}>{desc.slice(0, 100)}{desc.length > 100 ? "…" : ""}</p>}
                    {price && (
                      <div className={styles.priceRow}>
                        {originalPrice && <span className={styles.originalPrice}>₹{originalPrice.toLocaleString()}</span>}
                        <span className={styles.price}>₹{price.toLocaleString()}</span>
                        {originalPrice && originalPrice > price && (
                          <span className={styles.discountBadge}>
                            {Math.round((1 - price / originalPrice) * 100)}% Off
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {courses.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Link
              href="/courses"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 32px", background: "var(--primary)", color: "#fff",
                fontWeight: 700, borderRadius: 50, fontSize: 14, textDecoration: "none",
              }}
            >
              View All Courses
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
