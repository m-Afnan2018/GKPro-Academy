"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import type { Blog, Category } from "@/lib/api";
import styles from "./blog.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#2d1b3d 0%,#6b3a4a 100%)",
  "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
  "linear-gradient(135deg,#1a2e1a 0%,#2d5a2d 100%)",
];

const STATIC_TAGS = ["CA", "Accounting", "ICAI", "Commerce", "Finance", "Study Plan"];

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ flexShrink: 0 }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export default function BlogListPage() {
  const [blogs, setBlogs]           = useState<Blog[]>([]);
  const [popular, setPopular]       = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 5;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${BASE}/blogs?isPublished=true&page=${page}&limit=${limit}${q}`);
      const json = await res.json();
      if (json.success) {
        setBlogs(json.data.blogs ?? []);
        setTotal(json.data.total ?? 0);
      }
    } catch {}
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch(`${BASE}/blogs?isPublished=true&page=1&limit=3`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setPopular(json.data.blogs ?? []); })
      .catch(() => {});
    fetch(`${BASE}/categories?limit=20`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setCategories(json.data.categories ?? []); })
      .catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const authorName = (b: Blog) => {
    if (b.authorId && typeof b.authorId === "object" && "name" in b.authorId) {
      return (b.authorId as any).name as string;
    }
    return "GKPro Team";
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const paginationPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Standard Blog</h1>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span className={styles.breadSep}>›</span>
            <span>Standard Blog</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className={`container ${styles.layout}`}>
        {/* Blog list */}
        <div className={styles.main}>
          {loading ? (
            <div className={styles.loadingList}>
              {[1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : !blogs.length ? (
            <div className={styles.empty}>
              <p>No blog posts found.</p>
              {search && (
                <button className={styles.clearSearch} onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            blogs.map((b, i) => (
              <article key={b._id} className={styles.card}>
                {/* Image area */}
                <div className={styles.cardImage} style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}>
                  <span className={styles.cardTag}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="2" y="2" width="20" height="20" rx="3" />
                    </svg>
                    Software
                  </span>
                  {/* Decorative dots */}
                  <div className={styles.imgDots}>
                    {[0,1,2,3,4,5,6,7,8].map(n => <div key={n} className={styles.dot} />)}
                  </div>
                </div>

                {/* Card body */}
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                      {authorName(b)}
                    </span>
                    <span className={styles.metaDot} />
                    <span className={styles.metaItem}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatDate(b.publishedAt ?? b.createdAt)}
                    </span>
                  </div>

                  <Link href={`/blogs/${b.slug}`} className={styles.cardTitle}>{b.title}</Link>
                  <p className={styles.cardExcerpt}>
                    {b.content?.replace(/<[^>]+>/g, "").slice(0, 180)}
                    {(b.content?.replace(/<[^>]+>/g, "").length ?? 0) > 180 ? "…" : ""}
                  </p>

                  <Link href={`/blogs/${b.slug}`} className={styles.readMore} aria-label="Read more">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageArrow} disabled={page === 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              {paginationPages().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className={styles.pageDots}>…</span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageNum} ${page === p ? styles.pageActive : ""}`}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </button>
                )
              )}
              <button className={styles.pageArrow} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Search */}
          <form className={styles.searchBox} onSubmit={handleSearch}>
            <input
              className={styles.searchInput}
              placeholder="Enter Search Query"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn} aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          {/* Category */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Category</h3>
            <ul className={styles.catList}>
              {(categories.length > 0 ? categories.slice(0, 6) : [{ _id: "ca", name: "CA" }, { _id: "sc", name: "Skill Course" }] as any[]).map((c: any) => (
                <li key={c._id} className={styles.catItem}>
                  <BookIcon />
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Posts */}
          {popular.length > 0 && (
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>Popular Posts</h3>
              <ul className={styles.popularList}>
                {popular.map((b, i) => (
                  <li key={b._id} className={styles.popularItem}>
                    <div className={styles.popularThumb} style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }} />
                    <div className={styles.popularInfo}>
                      <Link href={`/blogs/${b.slug}`} className={styles.popularTitle}>{b.title}</Link>
                      <span className={styles.popularDate}>— {formatDate(b.publishedAt ?? b.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Tags</h3>
            <div className={styles.tagCloud}>
              {STATIC_TAGS.map((t) => (
                <button key={t} className={styles.tag}>{t}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Footer />
    </>
  );
}
