"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { blogsApi, type Blog, type User } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

export default function BlogsPage() {
  const [items, setItems]     = useState<Blog[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [deleteItem, setDeleteItem] = useState<Blog | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await blogsApi.list(page, LIMIT);
      setItems(res.data.blogs ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((b) => !search || b.title.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await blogsApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const approvalColor = (s: string) =>
    s === "approved" ? "green" : s === "rejected" ? "red" : s === "pending" ? "yellow" : "gray";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Blogs" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                    </span>
                    <input className={styles.searchInput} placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <Link href="/admin/blogs/new" className={styles.btnPrimary} style={{ textDecoration: "none" }}>
                    + New Post
                  </Link>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !filtered.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>✍️</div>
                  <div className={styles.emptyText}>No blog posts yet</div>
                  <Link href="/admin/blogs/new" className={styles.btnPrimary} style={{ marginTop: 16, textDecoration: "none", display: "inline-flex" }}>Write your first post</Link>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Status</th>
                      <th>Approval</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => {
                      const author = typeof b.authorId === "object" ? (b.authorId as User).name : "—";
                      return (
                        <tr key={b._id}>
                          <td>
                            <div className={styles.namePrimary}>{b.title}</div>
                            <div className={styles.nameSecondary}>{b.slug}</div>
                          </td>
                          <td style={{ fontSize: 13 }}>{author}</td>
                          <td><Badge variant={b.isPublished ? "green" : "gray"}>{b.isPublished ? "Published" : "Draft"}</Badge></td>
                          <td><Badge variant={approvalColor(b.approvalStatus) as any}>{b.approvalStatus}</Badge></td>
                          <td style={{ fontSize: 12, color: "#6B7280" }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className={styles.actions}>
                              <Link
                                href={`/admin/blogs/${b._id}/edit`}
                                className={`${styles.btnGhost} ${styles.btnGhostBlue}`}
                                style={{ textDecoration: "none" }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit
                              </Link>
                              <button
                                className={`${styles.btnGhost} ${styles.btnGhostRed}`}
                                onClick={() => setDeleteItem(b)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round"/></svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <span>Page {page} of {totalPages}</span>
                  <div className={styles.pages}>
                    <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return <button key={pg} className={`${styles.pageBtn} ${pg === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(pg)}>{pg}</button>;
                    })}
                    <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Post" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Delete <strong>{deleteItem.title}</strong>? This cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteItem(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
