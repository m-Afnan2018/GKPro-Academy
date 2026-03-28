"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { blogsApi, type Blog, type User } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;
const blank = () => ({ title: "", content: "", imageUrl: "", isPublished: false });

export default function BlogsPage() {
  const [items, setItems]     = useState<Blog[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blank());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editItem, setEditItem]   = useState<Blog | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

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

  const openEdit = (b: Blog) => {
    setEditItem(b);
    setEForm({ title: b.title, content: b.content, imageUrl: (b as any).imageUrl ?? "", isPublished: b.isPublished });
    setSaveError("");
  };

  const handleCreate = async () => {
    setCreating(true); setCreateError("");
    try { await blogsApi.create(form); setShowCreate(false); setForm(blank()); load(); }
    catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true); setSaveError("");
    try { await blogsApi.update(editItem._id, eForm); setEditItem(null); load(); }
    catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await blogsApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const BlogForm = ({ f, setF, err }: { f: typeof form; setF: (v: typeof form) => void; err: string }) => (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Title *</label>
        <input className={styles.formInput} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Content * (HTML supported)</label>
        <textarea className={styles.formTextarea} rows={8} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} style={{ minHeight: 160 }} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Cover Image URL (optional)</label>
        <input className={styles.formInput} value={(f as any).imageUrl ?? ""} placeholder="https://…" onChange={(e) => setF({ ...f, imageUrl: e.target.value } as any)} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Published</label>
        <select className={styles.formSelect} value={f.isPublished ? "yes" : "no"} onChange={(e) => setF({ ...f, isPublished: e.target.value === "yes" })}>
          <option value="no">No (Draft)</option><option value="yes">Yes (Published)</option>
        </select>
      </div>
    </div>
  );

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
                    <span className={styles.searchIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg></span>
                    <input className={styles.searchInput} placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>+ New Post</button>
                </div>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !filtered.length ? <div className={styles.empty}><div className={styles.emptyIcon}>✍️</div><div className={styles.emptyText}>No blog posts yet</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Title</th><th>Author</th><th>Published</th><th>Approval</th><th>Created</th><th>Actions</th></tr></thead>
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
                            <td><Badge variant={b.approvalStatus === "approved" ? "green" : b.approvalStatus === "rejected" ? "red" : b.approvalStatus === "pending" ? "yellow" : "gray"}>{b.approvalStatus}</Badge></td>
                            <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className={styles.actions}>
                                <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(b)}>Edit</button>
                                <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteItem(b)}>Delete</button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Blog Post" width={640}>
        <BlogForm f={form} setF={setForm} err={createError} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create Post"}</button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Blog Post" width={640}>
        {editItem && <>
          <BlogForm f={eForm} setF={setEForm} err={saveError} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Post" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete <strong>{deleteItem.title}</strong>? This cannot be undone.</p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteItem(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
