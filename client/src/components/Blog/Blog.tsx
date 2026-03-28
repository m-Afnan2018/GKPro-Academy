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

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetch(`${BASE}/blogs?limit=3`)
      .then((r) => r.json())
      .then((json) => { if (json?.data?.blogs?.length) setPosts(json.data.blogs); })
      .catch(() => {});
  }, []);

  const display = posts.length > 0 ? posts : [
    { _id: "1", title: "How to Prepare for CA Foundation Accounting Effectively", slug: "#", authorId: { name: "Raj Kumar" }, createdAt: new Date().toISOString(), courseTags: [{ title: "CA Foundation" }] },
    { _id: "2", title: "CA Intermediate Study Plan: Groups, Strategy & Smart Tips", slug: "#", authorId: { name: "Sarah Sharma" }, createdAt: new Date().toISOString(), courseTags: [] },
    { _id: "3", title: "CA Final Preparation Guide: Subjects, Revision & Exam Strategy", slug: "#", authorId: { name: "Priya Malik" }, createdAt: new Date().toISOString(), courseTags: [] },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.topRow}>
          <span className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
              <circle cx="12" cy="12" r="10" />
            </svg>
            BLOG
          </span>
          <h2 className={styles.heading}>
            Latest News From our <span className={styles.underline}>Blog</span>
          </h2>
        </div>

        <div className={styles.grid}>
          {display.map((post, i) => {
            const author = typeof post.authorId === "object" ? post.authorId?.name ?? "Admin" : "Admin";
            const tag = post.courseTags?.[0]?.title ?? "General";
            const date = new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

            return (
              <article key={post._id} className={styles.card}>
                <div
                  className={styles.imgWrap}
                  style={post.imageUrl ? { background: `url(${post.imageUrl}) center/cover no-repeat` } : { background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                >
                  <span className={styles.categoryBadge}>{tag}</span>
                </div>
                <div className={styles.body}>
                  <div className={styles.meta}>
                    <span className={styles.author}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {author}
                    </span>
                    <span className={styles.date}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {date}
                    </span>
                  </div>
                  <h3 className={styles.title}>{post.title}</h3>
                  <Link href={post.slug === "#" ? "/blogs" : `/blogs/${post.slug}`} className={styles.readMore}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
