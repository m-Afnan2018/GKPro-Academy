"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { subcategoriesApi, categoriesApi, type SubCategory, type Category } from "@/lib/api";
import ImageUpload from "@/components/admin/ImageUpload/ImageUpload";
import styles from "../admin.module.css";

const LIMIT = 30;
const blank = () => ({ name: "", categoryId: "", imageUrl: "", sortOrder: 0, isComingSoon: false });

type SubFormData = ReturnType<typeof blank>;
function SubForm({ f, setF, err, allCategories }: { f: SubFormData; setF: (v: SubFormData) => void; err: string; allCategories: Category[] }) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Parent Category *</label>
        <select className={styles.formSelect} value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
          <option value="">— Select category —</option>
          {allCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Name *</label>
        <input className={styles.formInput} placeholder="e.g. CA Foundation Paper 1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <ImageUpload label="Subcategory Image (optional)" value={f.imageUrl} onChange={(url) => setF({ ...f, imageUrl: url })} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Sort Order</label>
          <input className={styles.formInput} type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Coming Soon</label>
          <select className={styles.formSelect} value={f.isComingSoon ? "yes" : "no"} onChange={(e) => setF({ ...f, isComingSoon: e.target.value === "yes" })}>
            <option value="no">No</option><option value="yes">Yes</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default function SubcategoriesPage() {
  const [items, setItems]         = useState<SubCategory[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blank());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit
  const [editItem, setEditItem]   = useState<SubCategory | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete
  const [deleteItem, setDeleteItem] = useState<SubCategory | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await subcategoriesApi.list(page, LIMIT, categoryFilter || undefined);
      setItems(res.data.subcategories ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, categoryFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    categoriesApi.list(1, 100).then((r) => setAllCategories(r.data.categories ?? [])).catch(() => {});
  }, []);

  const catName = (s: SubCategory) => {
    if (s.categoryId && typeof s.categoryId === "object") return (s.categoryId as Category).name;
    if (s.categoryId && typeof s.categoryId === "string") return allCategories.find((c) => c._id === s.categoryId)?.name ?? "—";
    return "—";
  };

  const openEdit = (s: SubCategory) => {
    setEditItem(s);
    setEForm({
      name: s.name,
      categoryId: s.categoryId && typeof s.categoryId === "object" ? (s.categoryId as Category)._id : (s.categoryId as string ?? ""),
      imageUrl: s.imageUrl ?? "",
      sortOrder: s.sortOrder,
      isComingSoon: s.isComingSoon,
    });
    setSaveError("");
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setCreateError("Name is required"); return; }
    if (!form.categoryId)  { setCreateError("Category is required"); return; }
    setCreating(true); setCreateError("");
    try {
      await subcategoriesApi.create(form);
      setShowCreate(false); setForm(blank()); load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true); setSaveError("");
    try {
      await subcategoriesApi.update(editItem._id, eForm);
      setEditItem(null); load();
    } catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await subcategoriesApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Subcategories" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <select
                    className={styles.filterSelect}
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Categories</option>
                    {allCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>
                    + New Subcategory
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !items.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📂</div>
                  <div className={styles.emptyText}>No subcategories found</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Parent Category</th>
                      <th>Slug</th>
                      <th>Sort</th>
                      <th>Coming Soon</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => (
                      <tr key={s._id}>
                        <td>
                          {s.imageUrl
                            ? <img src={s.imageUrl} alt={s.name} style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid #E5E7EB" }} />
                            : <div style={{ width: 48, height: 36, borderRadius: 6, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              </div>
                          }
                        </td>
                        <td><span className={styles.namePrimary}>{s.name}</span></td>
                        <td><Badge variant="blue">{catName(s)}</Badge></td>
                        <td><span style={{ fontFamily: "monospace", fontSize: 12, color: "#6B7280" }}>{s.slug}</span></td>
                        <td>{s.sortOrder}</td>
                        <td><Badge variant={s.isComingSoon ? "yellow" : "green"}>{s.isComingSoon ? "Yes" : "No"}</Badge></td>
                        <td>
                          <div className={styles.actions}>
                            <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(s)}>
                              Edit
                            </button>
                            <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteItem(s)}>
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
                  <span>Page {page} of {totalPages} · {total} subcategories</span>
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

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Subcategory">
        <SubForm f={form} setF={setForm} err={createError} allCategories={allCategories} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Subcategory">
        {editItem && <>
          <SubForm f={eForm} setF={setEForm} err={saveError} allCategories={allCategories} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      {/* Delete modal */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Subcategory" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Delete <strong>{deleteItem.name}</strong> from <strong>{catName(deleteItem)}</strong>?
              This cannot be undone.
            </p>
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
