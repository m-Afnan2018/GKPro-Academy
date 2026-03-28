"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { faqsApi, coursesApi, type Faq, type Course } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 20;
const blank = () => ({ courseId: "", question: "", answer: "", sortOrder: 0, isActive: true });

export default function FaqsPage() {
  const [items, setItems]     = useState<Faq[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [courses, setCourses] = useState<Course[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blank());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editItem, setEditItem]   = useState<Faq | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteItem, setDeleteItem] = useState<Faq | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await faqsApi.list(page, LIMIT);
      setItems(res.data.faqs ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    coursesApi.list(1, 100).then((r) => setCourses(r.data.courses ?? [])).catch(() => {});
  }, []);

  const filtered = items.filter((f) => !search || f.question.toLowerCase().includes(search.toLowerCase()));

  const courseName = (f: Faq) => {
    if (!f.courseId) return "General";
    if (typeof f.courseId === "object") return (f.courseId as Course).title;
    return courses.find((c) => c._id === f.courseId)?.title ?? "—";
  };

  const openEdit = (f: Faq) => {
    setEditItem(f);
    setEForm({
      courseId: typeof f.courseId === "object" ? (f.courseId as Course)._id : (f.courseId as string ?? ""),
      question: f.question, answer: f.answer, sortOrder: f.sortOrder, isActive: f.isActive,
    });
    setSaveError("");
  };

  const buildBody = (f: typeof form) => ({ ...f, courseId: f.courseId || undefined, sortOrder: Number(f.sortOrder) });

  const handleCreate = async () => {
    setCreating(true); setCreateError("");
    try { await faqsApi.create(buildBody(form)); setShowCreate(false); setForm(blank()); load(); }
    catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true); setSaveError("");
    try { await faqsApi.update(editItem._id, buildBody(eForm)); setEditItem(null); load(); }
    catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await faqsApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const FaqForm = ({ f, setF, err }: { f: typeof form; setF: (v: typeof form) => void; err: string }) => (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Question *</label>
        <input className={styles.formInput} value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Answer *</label>
        <textarea className={styles.formTextarea} rows={4} value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Course (optional)</label>
          <select className={styles.formSelect} value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}>
            <option value="">General (no course)</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Sort Order</label>
          <input className={styles.formInput} type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Active</label>
        <select className={styles.formSelect} value={f.isActive ? "yes" : "no"} onChange={(e) => setF({ ...f, isActive: e.target.value === "yes" })}>
          <option value="yes">Yes</option><option value="no">No</option>
        </select>
      </div>
    </div>
  );

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="FAQs" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg></span>
                    <input className={styles.searchInput} placeholder="Search questions…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>+ New FAQ</button>
                </div>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !filtered.length ? <div className={styles.empty}><div className={styles.emptyIcon}>❓</div><div className={styles.emptyText}>No FAQs yet</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Question</th><th>Course</th><th>Sort</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filtered.map((f) => (
                        <tr key={f._id}>
                          <td>
                            <div className={styles.namePrimary}>{f.question}</div>
                            <div className={styles.nameSecondary}>{f.answer.slice(0, 60)}{f.answer.length > 60 ? "…" : ""}</div>
                          </td>
                          <td style={{ fontSize: 13, color: "#6B7280" }}>{courseName(f)}</td>
                          <td>{f.sortOrder}</td>
                          <td><Badge variant={f.isActive ? "green" : "red"}>{f.isActive ? "Yes" : "No"}</Badge></td>
                          <td>
                            <div className={styles.actions}>
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(f)}>Edit</button>
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteItem(f)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New FAQ" width={560}>
        <FaqForm f={form} setF={setForm} err={createError} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit FAQ" width={560}>
        {editItem && <>
          <FaqForm f={eForm} setF={setEForm} err={saveError} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete FAQ" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete FAQ: <em>{deleteItem.question}</em>?</p>
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
