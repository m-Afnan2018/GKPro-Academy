"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Blog.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
];

interface BlogPost { _id: string; title: string; slug: string; imageUrl?: string; authorId?: { name?: string } | string; createdAt: string; courseTags?: { title: string }[]; }

export default function   Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetch(`${BASE}/blogs?limit=3`)
      .then((r) => r.json())
      .then((json) => { if (json?.data?.blogs?.length) setPosts(json.data.blogs); })
      .catch(() => { });
  }, []);

  const display = posts.length > 0 ? posts : [
    { _id: "1", title: "How to Prepare for CA Foundation Accounting Effectively", slug: "#", authorId: { name: "Raj Kumar" }, createdAt: new Date("2025-10-30").toISOString(), courseTags: [{ title: "CA Foundation" }], imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&h=400&fit=crop" },
    { _id: "2", title: "CA Intermediate Study Plan: Groups, Strategy & Smart Tips", slug: "#", authorId: { name: "Satish Sharma" }, createdAt: new Date("2025-10-28").toISOString(), courseTags: [{ title: "Public Speaking" }], imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&h=400&fit=crop" },
    { _id: "3", title: "CA Final Preparation Guide: Subjects, Revision & Exam Strategy", slug: "#", authorId: { name: "Priya bhatt" }, createdAt: new Date("2025-10-26").toISOString(), courseTags: [{ title: "Public Speaking" }], imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=400&fit=crop" },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.topRow}>
          <div className={styles.labelWrapper}>
            <span className={styles.labelIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </span>
            <span className={styles.labelText}>BLOG</span>
          </div>

          <div className={styles.headingWrapper}>
            <h2 className={styles.heading}>Latest News From our Blog</h2>
            <svg width="240" height="15" viewBox="0 0 240 15" fill="none" className={styles.brushCurve}>
              <path d="M5 10 Q 120 -5 235 10" stroke="var(--primary, #d1122a)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className={styles.grid}>
          {display.map((post, i) => {
            const author = typeof post.authorId === "object" ? post.authorId?.name ?? "Admin" : "Admin";
            const tag = post.courseTags?.[0]?.title ?? "General";
            const date = new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

            return (
              <article key={post._id} className={styles.card}>
                <div
                  className={styles.imgWrap}
                  style={post.imageUrl ? { background: `url(${post.imageUrl}) center/cover no-repeat` } : { background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                >
                  {/*<span className={styles.categoryBadge}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {tag}
                  </span>*/}
                </div>
                <div className={styles.body}>
                  <div className={styles.meta}>
                    <span className={styles.metaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #d1122a)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {author}
                    </span>
                    <span className={styles.metaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #d1122a)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {date}
                    </span>
                  </div>
                  <h3 className={styles.title}>{post.title}</h3>
                  <Link href={post.slug === "#" ? "/blogs" : `/blogs/${post.slug}`} className={styles.readMore}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
