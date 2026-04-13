"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import type { Blog } from "@/lib/api";
import styles from "./post.module.css";
import Image from "next/image";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const STATIC_TAGS = ["CA", "Accounting", "ICAI", "Commerce", "Finance", "Study Plan"];

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [recent, setRecent] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`${BASE}/blogs/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) setError(json.message ?? "Post not found.");
        else setBlog(json.data.blog ?? json.data);
      })
      .catch(() => setError("Failed to load post."))
      .finally(() => setLoading(false));

    fetch(`${BASE}/blogs?isPublished=true&page=1&limit=4`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRecent(json.data.blogs ?? []);
      })
      .catch(() => { });
  }, [slug]);

  const authorName = (b: Blog) => {
    if (b.authorId && typeof b.authorId === "object" && "name" in b.authorId) {
      return (b.authorId as any).name as string;
    }
    return "GKPro Team";
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{loading ? "Blog" : (blog?.title ?? "Blog Post")}</h1>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/blogs">Blog</Link>
            <span>›</span>
            <span>{loading ? "…" : (blog?.title?.slice(0, 30) ?? "Post")}{(blog?.title?.length ?? 0) > 30 ? "…" : ""}</span>
          </div>
        </div>
      </div>

      <div className={`container ${styles.layout}`}>
        {/* Post content */}
        <div className={styles.main}>
          {loading ? (
            <div className={styles.skeleton} />
          ) : error || !blog ? (
            <div className={styles.errorBox}>
              <h2>Post Not Found</h2>
              <p>{error || "This post does not exist or is not published."}</p>
              <Link href="/blogs" className={styles.backLink}>← Back to Blog</Link>
            </div>
          ) : (
            <article className={styles.article}>
              {/* Image */}
              {/* <div className={styles.articleImage} /> */}
              {blog.imageUrl && (
                <div className={styles.articleImage}>
                  <Image
                    src={blog.imageUrl}
                    alt={blog.title}
                    fill
                  />
                </div>
              )}

              <div className={styles.articleBody}>
                {/* Meta */}
                <div className={styles.meta}>
                  {/*<span className={styles.metaTag}>Software</span>*/}
                  <span className={styles.metaItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    {authorName(blog)}
                  </span>
                  <span className={styles.metaDot} />
                  <span className={styles.metaItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatDate(blog.publishedAt ?? blog.createdAt)}
                  </span>
                </div>

                <h1 className={styles.articleTitle}>{blog.title}</h1>

                {/* Content */}
                <div
                  className={styles.content}
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Tags */}
                {/* <div className={styles.postTags}>
                  {STATIC_TAGS.slice(0, 3).map((t) => (
                    <span key={t} className={styles.postTag}>{t}</span>
                  ))}
                </div> */}

                <Link href="/blogs" className={styles.backBtn}>← Back to Blog</Link>
              </div>
            </article>
          )}
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Recent Posts */}
          {recent.filter((r) => r.slug !== slug).length > 0 && (
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>Recent Posts</h3>
              <ul className={styles.recentList}>
                {recent.filter((r) => r.slug !== slug).slice(0, 3).map((b) => (
                  <li key={b._id} className={styles.recentItem}>
                    <img src={b.imageUrl} alt={b.title} className={styles.recentThumb} />
                    <div className={styles.recentInfo}>
                      <Link href={`/blogs/${b.slug}`} className={styles.recentTitle}>{b.title}</Link>
                      <span className={styles.recentDate}>— {formatDate(b.publishedAt ?? b.createdAt)}</span>
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
              {blog?.tags?.map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Share</h3>
            <div className={styles.shareRow}>
              {[
                { label: "Facebook", color: "#1877F2", icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
                { label: "LinkedIn", color: "#0A66C2", icon: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></> },
                { label: "Twitter/X", color: "#000", icon: <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /> },
              ].map((s) => (
                <button key={s.label} className={styles.shareBtn} style={{ background: s.color }} aria-label={s.label}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">{s.icon}</svg>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Footer />
    </>
  );
}
