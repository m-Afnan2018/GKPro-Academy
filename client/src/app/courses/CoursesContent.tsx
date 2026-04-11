"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import type { Course, Category, SubCategory } from "@/lib/api";
import styles from "./courses.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const LIMIT = 8;
const DEBOUNCE_MS = 450;
const PLACEHOLDER_IMG = "https://placehold.co/600x400";

const SORT_OPTIONS = [
  { value: "newest", label: "Release Date (newest first)" },
  { value: "oldest", label: "Release Date (oldest first)" },
  { value: "price_asc", label: "Price (low to high)" },
  { value: "price_desc", label: "Price (high to low)" },
  { value: "name_asc", label: "Name (A – Z)" },
  { value: "name_desc", label: "Name (Z – A)" },
];

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
  "linear-gradient(135deg,#2d1b3d 0%,#6b3a4a 100%)",
  "linear-gradient(135deg,#1a2e1a 0%,#2d5a2d 100%)",
  "linear-gradient(135deg,#2e1a1a 0%,#5a2d2d 100%)",
];

function cardPrice(c: Course) {
  const prices = [c.onlinePrice, c.recordedPrice].filter((p): p is number => !!p && p > 0);
  if (!prices.length) return null;
  const p = Math.min(...prices);
  const rawOriginal = c.onlinePrice === p ? c.onlineOriginalPrice : c.recordedOriginalPrice;
  const original = rawOriginal && rawOriginal > p
    ? rawOriginal
    : Math.round(p / 0.85 / 100) * 100;
  const discount = Math.round((1 - p / original) * 100);
  return { price: p, original, discount };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcats, setAllSubcats] = useState<SubCategory[]>([]);

  // multi-select filter state
  const [selCatIds, setSelCatIds] = useState<string[]>([]);
  const [selSubcatIds, setSelSubcatIds] = useState<string[]>([]);

  // search: input value (instant) + debounced value (triggers fetch)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sort, setSort] = useState("newest");

  /* ── Debounce search ── */
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchInput]);

  /* ── Fetch categories + subcategories once ── */
  useEffect(() => {
    fetch(`${BASE}/categories?limit=50`)
      .then(r => r.json())
      .then(j => { if (j.success) setCategories(j.data.categories ?? []); })
      .catch(() => { });
    fetch(`${BASE}/subcategories?limit=200`)
      .then(r => r.json())
      .then(j => { if (j.success) setAllSubcats(j.data.subcategories ?? []); })
      .catch(() => { });
  }, []);

  /* ── Load courses — NO categories in deps, IDs are passed directly ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), sort });
      if (selCatIds.length) params.set("categoryIds", selCatIds.join(","));
      if (selSubcatIds.length) params.set("subcategoryIds", selSubcatIds.join(","));
      if (search) params.set("search", search);
      const j = await fetch(`${BASE}/courses?${params}`).then(r => r.json());
      setCourses(j.data?.courses ?? []);
      setTotal(j.data?.total ?? 0);
    } catch { }
    finally { setLoading(false); }
  }, [page, selCatIds, selSubcatIds, search, sort]);

  useEffect(() => { load(); }, [load]);

  /* ── Helpers ── */
  const totalPages = Math.ceil(total / LIMIT);

  // subcategories that belong to any selected parent
  const visibleSubcats = selCatIds.length > 0
    ? allSubcats.filter(s => {
      if (!s.categoryId) return false;
      const id = typeof s.categoryId === "object" ? (s.categoryId as Category)._id : s.categoryId;
      return selCatIds.includes(id);
    })
    : [];

  const toggleCat = (id: string) => {
    setSelCatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    // remove subcats that belong to the cat being unchecked
    setSelSubcatIds(prev => {
      const removedCatSubs = allSubcats
        .filter(s => {
          if (!s.categoryId) return false;
          const sid = typeof s.categoryId === "object" ? (s.categoryId as Category)._id : s.categoryId;
          return sid === id;
        })
        .map(s => s._id);
      return prev.filter(x => !removedCatSubs.includes(x));
    });
    setPage(1);
  };

  const toggleSubcat = (id: string) => {
    setSelSubcatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setPage(1);
  };

  const clearAll = () => {
    setSelCatIds([]);
    setSelSubcatIds([]);
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const hasFilters = selCatIds.length > 0 || selSubcatIds.length > 0 || searchInput.trim() !== "";

  return (
    <>
      <Navbar />

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Courses</h1>
        <p className={styles.pageSubtitle}>
          Explore industry-ready courses designed to boost your skills, knowledge, and career growth.
        </p>
      </div>

      <div className="container">
        <div className={styles.layout}>

          {/* ── Sidebar ── */}
          <aside className={styles.sidebar}>

            {/* Search */}
            <div className={styles.sideSearch}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={styles.sideSearchIcon}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                className={styles.sideSearchInput}
                placeholder="Search courses…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  className={styles.sideSearchClear}
                  onClick={() => setSearchInput("")}
                  title="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category filters */}
            {categories.length > 0 && (
              <div className={styles.filterSection}>
                <div className={styles.filterSectionTitle}>Category</div>
                {categories.map(cat => {
                  const isActive = selCatIds.includes(cat._id);
                  const subs = allSubcats.filter(s => {
                    if (!s.categoryId) return false;
                    const id = typeof s.categoryId === "object" ? (s.categoryId as Category)._id : s.categoryId;
                    return id === cat._id;
                  });
                  return (
                    <div key={cat._id}>
                      <div className={styles.filterRow} onClick={() => toggleCat(cat._id)}>
                        <span className={`${styles.checkbox} ${isActive ? styles.checkboxChecked : ""}`}>
                          {isActive && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className={`${styles.filterLabel} ${isActive ? styles.filterLabelActive : ""}`}>
                          {cat.name.toUpperCase()}
                        </span>
                      </div>

                      {/* Subcategories shown when parent is selected */}
                      {isActive && subs.length > 0 && (
                        <div className={styles.subFilterList}>
                          {subs.map(s => {
                            const isSubActive = selSubcatIds.includes(s._id);
                            return (
                              <div
                                key={s._id}
                                className={styles.filterRow}
                                style={{ paddingLeft: 20 }}
                                onClick={() => toggleSubcat(s._id)}
                              >
                                <span className={`${styles.checkbox} ${isSubActive ? styles.checkboxChecked : ""}`}>
                                  {isSubActive && (
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                      <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </span>
                                <span className={`${styles.filterLabel} ${isSubActive ? styles.filterLabelActive : ""}`}>
                                  {s.name.toUpperCase()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active filter chips */}
            {hasFilters && (
              <div className={styles.activeFilters}>
                {selCatIds.map(id => {
                  const cat = categories.find(c => c._id === id);
                  return cat ? (
                    <span key={id} className={styles.filterChip}>
                      {cat.name}
                      <button onClick={() => toggleCat(id)}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </span>
                  ) : null;
                })}
                {selSubcatIds.map(id => {
                  const sub = visibleSubcats.find(s => s._id === id);
                  return sub ? (
                    <span key={id} className={`${styles.filterChip} ${styles.filterChipSub}`}>
                      {sub.name}
                      <button onClick={() => toggleSubcat(id)}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </span>
                  ) : null;
                })}
                <button className={styles.clearBtn} onClick={clearAll}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Clear All
                </button>
              </div>
            )}
          </aside>

          {/* ── Content ── */}
          <div className={styles.content}>
            <div className={styles.contentToolbar}>
              <span className={styles.foundText}>
                We have found <strong>{loading ? "…" : total}</strong> course{total !== 1 ? "s" : ""}
              </span>
              <div className={styles.sortWrap}>
                <select
                  className={styles.sortSelect}
                  value={sort}
                  onChange={e => { setSort(e.target.value); setPage(1); }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" className={styles.sortChevron}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {loading ? (
              <div className={styles.grid}>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
              </div>
            ) : !courses.length ? (
              <div className={styles.empty}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p>No courses found. Try adjusting the filters.</p>
                {hasFilters && <button className={styles.emptyBtn} onClick={clearAll}>Clear Filters</button>}
              </div>
            ) : (
              <div className={styles.grid}>
                {courses.map((c, i) => {
                  const pd = cardPrice(c);
                  return (
                    <Link href={`/courses/${c.slug}`} key={c._id} className={styles.card}>
                      <div
                        className={styles.cardImg}
                        style={c.thumbnailUrl ? undefined : { background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                      >
                        {c.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.thumbnailUrl} alt={c.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.currentTarget.src = PLACEHOLDER_IMG;
                            }} />
                        )}
                        <div className={styles.cardImgOverlay} />
                        <div className={styles.badgeRow}>
                          {c.onlinePrice && <span className={`${styles.flagBadge} ${styles.flagOnline}`}>Online</span>}
                          {c.recordedPrice && <span className={`${styles.flagBadge} ${styles.flagRecorded}`}>Recorded</span>}
                        </div>
                      </div>
                      <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>{c.title}</h3>
                        {c.description && <p className={styles.cardDesc}>{c.description}</p>}
                        <div className={styles.cardPrice}>
                          {pd ? (
                            <>
                              <span className={styles.priceOld}>₹{pd.original.toLocaleString("en-IN")}</span>
                              <span className={styles.priceNew}>₹{pd.price.toLocaleString("en-IN")}</span>
                              {pd.discount > 0 && <span className={styles.discountBadge}>{pd.discount}% Off</span>}
                            </>
                          ) : (
                            <span className={styles.priceFree}>Free</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                <div className={styles.pageControls}>
                  <button className={styles.pageArrow} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={pg} className={`${styles.pageNum} ${page === pg ? styles.pageActive : ""}`} onClick={() => setPage(pg)}>{pg}</button>
                    );
                  })}
                  <button className={styles.pageArrow} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            )}

            <div style={{ height: 64 }} />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
