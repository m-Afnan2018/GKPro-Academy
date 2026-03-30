"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { announcementsApi, type Announcement } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;
const blank = () => ({ title: "", content: "", type: "general" as Announcement["type"], validUntil: "", isActive: true });

type AnnFormData = ReturnType<typeof blank>;
function AnnForm({ f, setF, err }: { f: AnnFormData; setF: (v: AnnFormData) => void; err: string }) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Title *</label>
        <input className={styles.formInput} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Content *</label>
        <textarea className={styles.formTextarea} rows={3} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Type</label>
          <select className={styles.formSelect} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Announcement["type"] })}>
            <option value="general">General</option><option value="discount">Discount</option>
            <option value="upcoming_batch">Upcoming Batch</option><option value="ongoing_batch">Ongoing Batch</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Active</label>
          <select className={styles.formSelect} value={f.isActive ? "yes" : "no"} onChange={(e) => setF({ ...f, isActive: e.target.value === "yes" })}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Valid Until (optional)</label>
        <input className={styles.formInput} type="date" value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} />
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [items, setItems]         = useState<Announcement[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blank());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editItem, setEditItem]   = useState<Announcement | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteItem, setDeleteItem] = useState<Announcement | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await announcementsApi.list(page, LIMIT);
      setItems(res.data.announcements ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (a: Announcement) => {
    setEditItem(a);
    setEForm({ title: a.title, content: a.content, type: a.type, validUntil: a.validUntil ? a.validUntil.slice(0, 10) : "", isActive: a.isActive });
    setSaveError("");
  };

  const buildBody = (f: typeof form) => ({ ...f, validUntil: f.validUntil || undefined });

  const handleCreate = async () => {
    setCreating(true); setCreateError("");
    try { await announcementsApi.create(buildBody(form)); setShowCreate(false); setForm(blank()); load(); }
    catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true); setSaveError("");
    try { await announcementsApi.update(editItem._id, buildBody(eForm)); setEditItem(null); load(); }
    catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await announcementsApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const typeBadge = (t: string) => t === "discount" ? "red" : t === "upcoming_batch" || t === "ongoing_batch" ? "blue" : "gray";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Announcements" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Announcements</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>+ New</button>
                </div>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !items.length ? <div className={styles.empty}><div className={styles.emptyIcon}>📢</div><div className={styles.emptyText}>No announcements yet</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Title</th><th>Type</th><th>Valid Until</th><th>Active</th><th>Approval</th><th>Actions</th></tr></thead>
                    <tbody>
                      {items.map((a) => (
                        <tr key={a._id}>
                          <td>
                            <div className={styles.namePrimary}>{a.title}</div>
                            <div className={styles.nameSecondary}>{a.content.slice(0, 60)}{a.content.length > 60 ? "…" : ""}</div>
                          </td>
                          <td><Badge variant={typeBadge(a.type) as any}>{a.type.replace("_", " ")}</Badge></td>
                          <td>{a.validUntil ? new Date(a.validUntil).toLocaleDateString() : "—"}</td>
                          <td><Badge variant={a.isActive ? "green" : "red"}>{a.isActive ? "Yes" : "No"}</Badge></td>
                          <td><Badge variant={a.approvalStatus === "approved" ? "green" : a.approvalStatus === "rejected" ? "red" : a.approvalStatus === "pending" ? "yellow" : "gray"}>{a.approvalStatus}</Badge></td>
                          <td>
                            <div className={styles.actions}>
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(a)}>Edit</button>
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteItem(a)}>Delete</button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Announcement">
        <AnnForm f={form} setF={setForm} err={createError} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Announcement">
        {editItem && <>
          <AnnForm f={eForm} setF={setEForm} err={saveError} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Announcement" width={400}>
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
