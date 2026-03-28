"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import type { Course, Category, Batch, CoursePlan } from "@/lib/api";
import styles from "./courses.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const LIMIT = 9;

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
  "linear-gradient(135deg,#2d1b3d 0%,#6b3a4a 100%)",
  "linear-gradient(135deg,#1a2e1a 0%,#2d5a2d 100%)",
  "linear-gradient(135deg,#2e1a1a 0%,#5a2d2d 100%)",
];

type CourseWithMeta = Course & { _batchMode?: string; _price?: number; _originalPrice?: number };

function ModeBadge({ mode }: { mode?: string }) {
  const label = mode === "recorded" ? "Recorded" : mode === "one_on_one" ? "1-on-1" : "Online";
  const cls   = mode === "recorded" ? styles.badgeRecorded : mode === "one_on_one" ? styles.badgeOneOn : styles.badgeOnline;
  return <span className={`${styles.modeBadge} ${cls}`}>{label}</span>;
}

export default function CoursesPage() {
  const [courses, setCourses]     = useState<CourseWithMeta[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [loading, setLoading]     = useState(true);

  /* fetch categories once */
  useEffect(() => {
    fetch(`${BASE}/categories?limit=50`)
      .then(r => r.json())
      .then(j => { if (j.success) setCategories(j.data.categories ?? []); })
      .catch(() => {});
  }, []);

  /* fetch courses */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeCat) params.set("category", activeCat.slug);
      const [courseRes, batchRes, planRes] = await Promise.all([
        fetch(`${BASE}/courses?${params}`).then(r => r.json()),
        fetch(`${BASE}/batches?limit=200`).then(r => r.json()).catch(() => ({ data: { batches: [] } })),
        fetch(`${BASE}/plans?limit=200`).then(r => r.json()).catch(() => ({ data: { plans: [] } })),
      ]);

      const rawCourses: Course[] = courseRes.data?.courses ?? [];
      const batches: Batch[]     = batchRes.data?.batches ?? [];
      const plans: CoursePlan[]  = planRes.data?.plans ?? [];

      const enriched: CourseWithMeta[] = rawCourses.map(c => {
        const cb = batches.filter(b => {
          const bCourseId = typeof b.courseId === "object" ? (b.courseId as any)._id : b.courseId;
          return bCourseId === c._id;
        });
        const cp = plans.filter(p => {
          const pCourseId = typeof p.courseId === "object" ? (p.courseId as any)._id : p.courseId;
          return pCourseId === c._id;
        });
        const mode = cb[0]?.mode;
        const minPrice = cp.length ? Math.min(...cp.map(p => p.price)) : undefined;
        const origPrice = minPrice ? Math.round(minPrice / 0.85 / 100) * 100 : undefined;
        return { ...c, _batchMode: mode, _price: minPrice, _originalPrice: origPrice };
      });

      setCourses(enriched);
      setTotal(courseRes.data?.total ?? 0);
    } catch {}
    finally { setLoading(false); }
  }, [page, activeCat]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);
  const catName = (c: Course) =>
    typeof c.categoryId === "object" ? (c.categoryId as Category).name : "";

  return (
    <>
      <Navbar />

      {/* Hero banner */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{activeCat ? activeCat.name : "All Courses"}</h1>
          <div className={styles.heroBreadcrumb}>
            <Link href="/">Home</Link><span>›</span>
            {activeCat
              ? <><Link href="/courses">Courses</Link><span>›</span><span>{activeCat.name}</span></>
              : <span>Courses</span>}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Category tabs */}
        <div className={styles.catTabs}>
          <button
            className={`${styles.catTab} ${!activeCat ? styles.catTabActive : ""}`}
            onClick={() => { setActiveCat(null); setPage(1); }}
          >All</button>
          {categories.map(c => (
            <button
              key={c._id}
              className={`${styles.catTab} ${activeCat?._id === c._id ? styles.catTabActive : ""}`}
              onClick={() => { setActiveCat(c); setPage(1); }}
            >{c.name}</button>
          ))}
        </div>

        {/* Section header */}
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>{activeCat?.name ?? "All Courses"}</h2>
            <p className={styles.sectionSub}>
              Join GKPro Academy and get expert-led live classes, personalised coaching, and a proven
              learning path to achieve your goals – stress-free!
            </p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : !courses.length ? (
          <div className={styles.empty}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>No courses found in this category.</p>
            <button className={styles.emptyBtn} onClick={() => { setActiveCat(null); setPage(1); }}>
              View All Courses
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {courses.map((c, i) => (
              <Link href={`/courses/${c.slug}`} key={c._id} className={styles.card}>
                {/* Image */}
                <div className={styles.cardImg} style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}>
                  <ModeBadge mode={c._batchMode} />
                  {/* Play overlay */}
                  <div className={styles.playBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  {/* student silhouette illustration */}
                  <div className={styles.cardImgOverlay} />
                </div>

                {/* Body */}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{c.title}</h3>
                  {c.description && (
                    <p className={styles.cardDesc}>{c.description}</p>
                  )}
                  <div className={styles.cardPrice}>
                    {c._originalPrice && (
                      <span className={styles.priceOld}>₹{c._originalPrice.toLocaleString("en-IN")}</span>
                    )}
                    {c._price ? (
                      <>
                        <span className={styles.priceNew}>₹{c._price.toLocaleString("en-IN")}</span>
                        {c._originalPrice && (
                          <span className={styles.discountBadge}>
                            {Math.round((1 - c._price / c._originalPrice) * 100)}% Off
                          </span>
                        )}
                      </>
                    ) : (
                      <span className={styles.priceFree}>Free</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageArrow} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`${styles.pageNum} ${page === p ? styles.pageActive : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className={styles.pageArrow} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        )}

        <div style={{ height: 64 }} />
      </div>

      <Footer />
    </>
  );
}
