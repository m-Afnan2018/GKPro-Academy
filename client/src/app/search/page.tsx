"use client";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./search.module.css";

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const LIMIT = 8;
type Tab = "all" | "courses" | "blogs" | "categories";

interface Course  { _id: string; title: string; slug: string; description?: string; thumbnailUrl?: string; onlinePrice?: number; recordedPrice?: number; onlineOriginalPrice?: number; recordedOriginalPrice?: number; categoryId?: { name: string; slug: string } | string; }
interface Blog    { _id: string; title: string; slug: string; imageUrl?: string; createdAt: string; authorId?: { name: string } | string; }
interface Cat     { _id: string; name: string; slug: string; description?: string; imageUrl?: string; isComingSoon?: boolean; }

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const params   = useSearchParams();
  const router   = useRouter();
  const q        = params.get("q") ?? "";

  const [tab, setTab]           = useState<Tab>("all");
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);

  const [courses,    setCourses]    = useState<Course[]>([]);
  const [blogs,      setBlogs]      = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [coursesTotal,    setCoursesTotal]    = useState(0);
  const [blogsTotal,      setBlogsTotal]      = useState(0);
  const [categoriesTotal, setCategoriesTotal] = useState(0);

  const [inputVal, setInputVal] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch_ = useCallback(async (query: string, t: Tab, pg: number) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}&type=${t}&page=${pg}&limit=${LIMIT}`).then(r => r.json());
      const d = res.data ?? {};
      setCourses(d.courses ?? []);
      setBlogs(d.blogs ?? []);
      setCategories(d.categories ?? []);
      setCoursesTotal(d.coursesTotal ?? 0);
      setBlogsTotal(d.blogsTotal ?? 0);
      setCategoriesTotal(d.categoriesTotal ?? 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (q) { setInputVal(q); fetch_(q, tab, page); } }, [q, tab, page]); // eslint-disable-line

  const handleInput = (val: string) => {
    setInputVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(val.trim())}`);
      setTab("all"); setPage(1);
    }, 400);
  };

  const totalPages = (t: Tab) => {
    const tot = t === "courses" ? coursesTotal : t === "blogs" ? blogsTotal : categoriesTotal;
    return Math.ceil(tot / LIMIT);
  };

  const tabCount = (t: Tab) =>
    t === "courses" ? coursesTotal : t === "blogs" ? blogsTotal : categoriesTotal;

  const allTotal = coursesTotal + blogsTotal + categoriesTotal;

  const minPrice = (c: Course) => Math.min(...[c.onlinePrice, c.recordedPrice].filter((p): p is number => !!p && p > 0));

  return (
    <>
      <Navbar />

      <div className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Search Results</h1>
          <div className={styles.searchBarWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={styles.searchBarIcon}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              className={styles.searchBar}
              value={inputVal}
              onChange={e => handleInput(e.target.value)}
              placeholder="Search courses, blogs, categories…"
              autoFocus
            />
            {inputVal && (
              <button className={styles.searchBarClear} onClick={() => { setInputVal(""); router.replace("/search?q="); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          {q && !loading && <p className={styles.resultCount}>Found <strong>{allTotal}</strong> result{allTotal !== 1 ? "s" : ""} for &ldquo;<em>{q}</em>&rdquo;</p>}
        </div>
      </div>

      <div className="container">
        {/* Tabs */}
        <div className={styles.tabs}>
          {(["all", "courses", "blogs", "categories"] as Tab[]).map(t => (
            <button
              key={t}
              className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => { setTab(t); setPage(1); }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t !== "all" && !loading && (
                <span className={styles.tabCount}>{tabCount(t)}</span>
              )}
              {t === "all" && !loading && (
                <span className={styles.tabCount}>{allTotal}</span>
              )}
            </button>
          ))}
        </div>

        {!q ? (
          <div className={styles.empty}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <p>Type something to search</p>
          </div>
        ) : loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : allTotal === 0 ? (
          <div className={styles.empty}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <p>No results found for &ldquo;<strong>{q}</strong>&rdquo;</p>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>Try different keywords</p>
          </div>
        ) : (
          <div className={styles.results}>

            {/* ── Courses ── */}
            {(tab === "all" || tab === "courses") && courses.length > 0 && (
              <section className={styles.section}>
                {tab === "all" && <h2 className={styles.sectionTitle}>Courses <span>{coursesTotal}</span></h2>}
                <div className={styles.courseGrid}>
                  {courses.map(c => {
                    const p = minPrice(c);
                    const catName = c.categoryId && typeof c.categoryId === "object" ? (c.categoryId as any).name : "";
                    return (
                      <Link href={`/courses/${c.slug}`} key={c._id} className={styles.courseCard}>
                        <div className={styles.courseCardImg} style={c.thumbnailUrl ? undefined : { background: "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)" }}>
                          {c.thumbnailUrl && <img src={c.thumbnailUrl} alt={c.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                          {c.onlinePrice   && <span className={`${styles.modeBadge} ${styles.badgeOnline}`}>Online</span>}
                          {c.recordedPrice && <span className={`${styles.modeBadge} ${styles.badgeRecorded}`}>Recorded</span>}
                        </div>
                        <div className={styles.courseCardBody}>
                          {catName && <span className={styles.courseCardCat}>{catName}</span>}
                          <h3 className={styles.courseCardTitle}>{c.title}</h3>
                          {c.description && <p className={styles.courseCardDesc}>{c.description}</p>}
                          {p ? <span className={styles.courseCardPrice}>₹{p.toLocaleString("en-IN")}</span> : <span className={styles.courseCardFree}>Free</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {tab === "all" && coursesTotal > 4 && (
                  <button className={styles.seeAll} onClick={() => { setTab("courses"); setPage(1); }}>
                    See all {coursesTotal} courses →
                  </button>
                )}
              </section>
            )}

            {/* ── Blogs ── */}
            {(tab === "all" || tab === "blogs") && blogs.length > 0 && (
              <section className={styles.section}>
                {tab === "all" && <h2 className={styles.sectionTitle}>Blogs <span>{blogsTotal}</span></h2>}
                <div className={styles.blogList}>
                  {blogs.map(b => {
                    const author = b.authorId && typeof b.authorId === "object" ? (b.authorId as any).name : "";
                    return (
                      <Link href={`/blogs/${b.slug}`} key={b._id} className={styles.blogRow}>
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.title} className={styles.blogRowImg} />
                        ) : (
                          <div className={styles.blogRowImgPlaceholder}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                        )}
                        <div className={styles.blogRowBody}>
                          <h3 className={styles.blogRowTitle}>{b.title}</h3>
                          <div className={styles.blogRowMeta}>
                            {author && <span>{author}</span>}
                            <span>{new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </Link>
                    );
                  })}
                </div>
                {tab === "all" && blogsTotal > 4 && (
                  <button className={styles.seeAll} onClick={() => { setTab("blogs"); setPage(1); }}>
                    See all {blogsTotal} blogs →
                  </button>
                )}
              </section>
            )}

            {/* ── Categories ── */}
            {(tab === "all" || tab === "categories") && categories.length > 0 && (
              <section className={styles.section}>
                {tab === "all" && <h2 className={styles.sectionTitle}>Categories <span>{categoriesTotal}</span></h2>}
                <div className={styles.catGrid}>
                  {categories.map(c => (
                    <Link href={`/category/${c.slug}`} key={c._id} className={styles.catCard}>
                      <div className={styles.catCardIcon}>
                        {c.imageUrl
                          ? <img src={c.imageUrl} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D42B3A" strokeWidth="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        }
                      </div>
                      <div>
                        <div className={styles.catCardName}>{c.name}</div>
                        {c.description && <div className={styles.catCardDesc}>{c.description}</div>}
                        {c.isComingSoon && <span className={styles.soonBadge}>Coming Soon</span>}
                      </div>
                    </Link>
                  ))}
                </div>
                {tab === "all" && categoriesTotal > 4 && (
                  <button className={styles.seeAll} onClick={() => { setTab("categories"); setPage(1); }}>
                    See all {categoriesTotal} categories →
                  </button>
                )}
              </section>
            )}

            {/* Pagination — only for individual tabs */}
            {tab !== "all" && totalPages(tab) > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageArrow} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages(tab)) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages(tab) - 4)) + i;
                  return <button key={pg} className={`${styles.pageNum} ${page === pg ? styles.pageActive : ""}`} onClick={() => setPage(pg)}>{pg}</button>;
                })}
                <button className={styles.pageArrow} disabled={page === totalPages(tab)} onClick={() => setPage(p => p + 1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        )}
        <div style={{ height: 64 }} />
      </div>

      <Footer />
    </>
  );
}
