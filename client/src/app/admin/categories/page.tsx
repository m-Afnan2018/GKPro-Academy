"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { categoriesApi, type Category } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 20;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [cName, setCName]           = useState("");
  const [cComing, setCComing]       = useState(false);
  const [cSort, setCSort]           = useState(0);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editCat, setEditCat]     = useState<Category | null>(null);
  const [eName, setEName]         = useState("");
  const [eComing, setEComing]     = useState(false);
  const [eSort, setESort]         = useState(0);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await categoriesApi.list(page, LIMIT);
      setCategories(res.data.categories ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (c: Category) => {
    setEditCat(c); setEName(c.name); setEComing(c.isComingSoon); setESort(c.sortOrder); setSaveError("");
  };

  const handleCreate = async () => {
    if (!cName.trim()) { setCreateError("Name is required"); return; }
    setCreating(true); setCreateError("");
    try {
      await categoriesApi.create({ name: cName, isComingSoon: cComing, sortOrder: cSort });
      setShowCreate(false); setCName(""); setCComing(false); setCSort(0); load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editCat) return;
    setSaving(true); setSaveError("");
    try {
      await categoriesApi.update(editCat._id, { name: eName, isComingSoon: eComing, sortOrder: eSort });
      setEditCat(null); load();
    } catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteCat) return;
    setDeleting(true);
    try { await categoriesApi.remove(deleteCat._id); setDeleteCat(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Categories" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Course Categories</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); }}>+ New Category</button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !categories.length ? (
                <div className={styles.empty}><div className={styles.emptyIcon}>📂</div><div className={styles.emptyText}>No categories yet</div></div>
              ) : (
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Slug</th><th>Sort</th><th>Coming Soon</th><th>Actions</th></tr></thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c._id}>
                        <td><span className={styles.namePrimary}>{c.name}</span></td>
                        <td><span style={{ fontFamily: "monospace", fontSize: 12, color: "#6B7280" }}>{c.slug}</span></td>
                        <td>{c.sortOrder}</td>
                        <td><Badge variant={c.isComingSoon ? "yellow" : "green"}>{c.isComingSoon ? "Yes" : "No"}</Badge></td>
                        <td>
                          <div className={styles.actions}>
                            <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(c)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              Edit
                            </button>
                            <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteCat(c)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" /></svg>
                              Delete
                            </button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Category">
        <div className={styles.form}>
          {createError && <div className={styles.errorBanner}>{createError}</div>}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Name *</label>
            <input className={styles.formInput} placeholder="e.g. CA Foundation" value={cName} onChange={(e) => setCName(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sort Order</label>
              <input className={styles.formInput} type="number" value={cSort} onChange={(e) => setCSort(Number(e.target.value))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Coming Soon</label>
              <select className={styles.formSelect} value={cComing ? "yes" : "no"} onChange={(e) => setCComing(e.target.value === "yes")}>
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Edit Category">
        {editCat && (
          <div className={styles.form}>
            {saveError && <div className={styles.errorBanner}>{saveError}</div>}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name</label>
              <input className={styles.formInput} value={eName} onChange={(e) => setEName(e.target.value)} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sort Order</label>
                <input className={styles.formInput} type="number" value={eSort} onChange={(e) => setESort(Number(e.target.value))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coming Soon</label>
                <select className={styles.formSelect} value={eComing ? "yes" : "no"} onChange={(e) => setEComing(e.target.value === "yes")}>
                  <option value="no">No</option><option value="yes">Yes</option>
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setEditCat(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteCat} onClose={() => setDeleteCat(null)} title="Delete Category" width={400}>
        {deleteCat && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete <strong>{deleteCat.name}</strong>? This cannot be undone.</p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteCat(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
