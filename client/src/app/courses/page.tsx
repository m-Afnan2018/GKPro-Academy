"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import type { Course, Category, SubCategory } from "@/lib/api";
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

function ModeBadge({ course }: { course: Course }) {
  const hasOnline = !!course.onlinePrice;
  const hasRecorded = !!course.recordedPrice;
  if (hasOnline && hasRecorded) return <span className={`${styles.modeBadge} ${styles.badgeOnline}`}>Online & Recorded</span>;
  if (hasOnline) return <span className={`${styles.modeBadge} ${styles.badgeOnline}`}>Online</span>;
  if (hasRecorded) return <span className={`${styles.modeBadge} ${styles.badgeRecorded}`}>Recorded</span>;
  return null;
}

export default function CoursesPage() {
  const [courses, setCourses]         = useState<Course[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [activeCat, setActiveCat]     = useState<Category | null>(null);
  const [activeSubcat, setActiveSubcat] = useState<SubCategory | null>(null);
  const [loading, setLoading]         = useState(true);

  /* fetch categories once */
  useEffect(() => {
    fetch(`${BASE}/categories?limit=50`)
      .then(r => r.json())
      .then(j => { if (j.success) setCategories(j.data.categories ?? []); })
      .catch(() => {});
  }, []);

  /* fetch subcategories when category changes */
  useEffect(() => {
    setActiveSubcat(null);
    if (!activeCat) { setSubcategories([]); return; }
    fetch(`${BASE}/subcategories?categoryId=${activeCat._id}&limit=50`)
      .then(r => r.json())
      .then(j => { if (j.success) setSubcategories(j.data.subcategories ?? []); })
      .catch(() => {});
  }, [activeCat]);

  /* fetch courses */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeCat) params.set("category", activeCat.slug);
      if (activeSubcat) params.set("subcategory", activeSubcat._id);
      const courseRes = await fetch(`${BASE}/courses?${params}`).then(r => r.json());
      setCourses(courseRes.data?.courses ?? []);
      setTotal(courseRes.data?.total ?? 0);
    } catch {}
    finally { setLoading(false); }
  }, [page, activeCat, activeSubcat]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);
  const catName = (c: Course) =>
    c.categoryId && typeof c.categoryId === "object" ? (c.categoryId as Category).name : "";

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
            >
              {c.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt={c.name} style={{ width: 20, height: 20, objectFit: "cover", borderRadius: "50%", marginRight: 6, verticalAlign: "middle" }} />
              )}
              {c.name}
            </button>
          ))}
        </div>

        {/* Subcategory filter — shown only when a category is selected */}
        {activeCat && subcategories.length > 0 && (
          <div className={styles.catTabs} style={{ marginTop: 8 }}>
            <button
              className={`${styles.catTab} ${!activeSubcat ? styles.catTabActive : ""}`}
              onClick={() => { setActiveSubcat(null); setPage(1); }}
              style={{ fontSize: 12 }}
            >All {activeCat.name}</button>
            {subcategories.map(s => (
              <button
                key={s._id}
                className={`${styles.catTab} ${activeSubcat?._id === s._id ? styles.catTabActive : ""}`}
                onClick={() => { setActiveSubcat(s); setPage(1); }}
                style={{ fontSize: 12 }}
              >
                {s.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt={s.name} style={{ width: 16, height: 16, objectFit: "cover", borderRadius: "50%", marginRight: 5, verticalAlign: "middle" }} />
                )}
                {s.name}
              </button>
            ))}
          </div>
        )}

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
                <div className={styles.cardImg} style={c.thumbnailUrl ? undefined : { background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}>
                  {c.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnailUrl} alt={c.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <ModeBadge course={c} />
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
                    {c.onlinePrice && (
                      <span className={styles.priceNew}>₹{c.onlinePrice.toLocaleString("en-IN")}</span>
                    )}
                    {c.recordedPrice && (
                      <span className={styles.priceNew} style={{ marginLeft: c.onlinePrice ? 6 : 0 }}>
                        {c.onlinePrice ? `/ ₹${c.recordedPrice.toLocaleString("en-IN")}` : `₹${c.recordedPrice.toLocaleString("en-IN")}`}
                      </span>
                    )}
                    {!c.onlinePrice && !c.recordedPrice && (
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
