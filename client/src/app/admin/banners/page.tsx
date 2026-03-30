"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { bannersApi, type Banner } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;
const blank = () => ({ imageUrl: "", linkUrl: "", altText: "", sortOrder: 0, isActive: true });

type BannerFormData = ReturnType<typeof blank>;
function BannerForm({ f, setF, err }: { f: BannerFormData; setF: (v: BannerFormData) => void; err: string }) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Image URL *</label>
        <input className={styles.formInput} placeholder="https://…" value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Link URL</label>
        <input className={styles.formInput} placeholder="https://…" value={f.linkUrl} onChange={(e) => setF({ ...f, linkUrl: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Alt Text</label>
        <input className={styles.formInput} value={f.altText} onChange={(e) => setF({ ...f, altText: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Sort Order</label>
          <input className={styles.formInput} type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Active</label>
          <select className={styles.formSelect} value={f.isActive ? "yes" : "no"} onChange={(e) => setF({ ...f, isActive: e.target.value === "yes" })}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const [items, setItems]     = useState<Banner[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blank());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editItem, setEditItem]   = useState<Banner | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteItem, setDeleteItem] = useState<Banner | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await bannersApi.list(page, LIMIT);
      setItems(res.data.banners ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (b: Banner) => {
    setEditItem(b);
    setEForm({ imageUrl: b.imageUrl, linkUrl: b.linkUrl ?? "", altText: b.altText ?? "", sortOrder: b.sortOrder, isActive: b.isActive });
    setSaveError("");
  };

  const buildBody = (f: typeof form) => ({ ...f, linkUrl: f.linkUrl || undefined, altText: f.altText || undefined });

  const handleCreate = async () => {
    setCreating(true); setCreateError("");
    try { await bannersApi.create(buildBody(form)); setShowCreate(false); setForm(blank()); load(); }
    catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true); setSaveError("");
    try { await bannersApi.update(editItem._id, buildBody(eForm)); setEditItem(null); load(); }
    catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await bannersApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Banners" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Homepage Banners</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>+ New Banner</button>
                </div>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !items.length ? <div className={styles.empty}><div className={styles.emptyIcon}>🖼️</div><div className={styles.emptyText}>No banners yet</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Preview</th><th>Alt Text</th><th>Sort</th><th>Active</th><th>Approval</th><th>Actions</th></tr></thead>
                    <tbody>
                      {items.map((b) => (
                        <tr key={b._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={b.imageUrl} alt={b.altText ?? ""} style={{ width: 64, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid #E5E7EB" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              <span style={{ fontSize: 12, color: "#6B7280", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.imageUrl}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 13 }}>{b.altText ?? "—"}</td>
                          <td>{b.sortOrder}</td>
                          <td><Badge variant={b.isActive ? "green" : "red"}>{b.isActive ? "Yes" : "No"}</Badge></td>
                          <td><Badge variant={b.approvalStatus === "approved" ? "green" : b.approvalStatus === "rejected" ? "red" : b.approvalStatus === "pending" ? "yellow" : "gray"}>{b.approvalStatus}</Badge></td>
                          <td>
                            <div className={styles.actions}>
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(b)}>Edit</button>
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteItem(b)}>Delete</button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Banner">
        <BannerForm f={form} setF={setForm} err={createError} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Banner">
        {editItem && <>
          <BannerForm f={eForm} setF={setEForm} err={saveError} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Banner" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete this banner? This cannot be undone.</p>
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
