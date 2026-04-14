"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { bannersApi, type Banner } from "@/lib/api";
import ImageUpload from "@/components/admin/ImageUpload/ImageUpload";
import styles from "../admin.module.css";

const LIMIT = 10;

const blank = () => ({
  desktopImageUrl: "",
  mobileImageUrl: "",
  linkUrl: "",
  altText: "",
  sortOrder: 0,
  isActive: true,
});

type FormData = ReturnType<typeof blank>;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: "#9CA3AF",
      textTransform: "uppercase", letterSpacing: "0.8px",
      borderBottom: "1.5px solid #F3F4F6", paddingBottom: 8, marginBottom: 4,
    }}>
      {children}
    </div>
  );
}

function BannerForm({ f, setF, err }: { f: FormData; setF: (v: FormData) => void; err: string }) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}

      {/* Images section */}
      <SectionLabel>Banner Images</SectionLabel>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Desktop Image <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 8px" }}>
            Recommended: 1920 × 620 px (wide banner)
          </p>
          <ImageUpload
            value={f.desktopImageUrl}
            onChange={(url) => setF({ ...f, desktopImageUrl: url })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Mobile Image
            <span style={{ color: "#9CA3AF", fontWeight: 400, textTransform: "none", marginLeft: 6 }}>
              (optional)
            </span>
          </label>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 8px" }}>
            Recommended: 768 × 600 px (portrait / square)
          </p>
          <ImageUpload
            value={f.mobileImageUrl}
            onChange={(url) => setF({ ...f, mobileImageUrl: url })}
          />
        </div>
      </div>

      {/* Link & Meta section */}
      <SectionLabel>Link & Settings</SectionLabel>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Click-through URL
          <span style={{ color: "#9CA3AF", fontWeight: 400, textTransform: "none", marginLeft: 6 }}>
            (optional — entire banner becomes clickable)
          </span>
        </label>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#9CA3AF", display: "flex", alignItems: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </span>
          <input
            className={styles.formInput}
            style={{ paddingLeft: 34 }}
            placeholder="https://example.com/course"
            value={f.linkUrl}
            onChange={(e) => setF({ ...f, linkUrl: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Alt Text</label>
          <input
            className={styles.formInput}
            placeholder="Brief description for accessibility"
            value={f.altText}
            onChange={(e) => setF({ ...f, altText: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Sort Order</label>
          <input
            className={styles.formInput}
            type="number"
            min={0}
            placeholder="0"
            value={f.sortOrder}
            onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Status</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setF({ ...f, isActive: !f.isActive })}
            style={{
              width: 44, height: 24, borderRadius: 12, border: "none",
              cursor: "pointer", position: "relative", transition: "background 0.2s",
              background: f.isActive ? "#16A34A" : "#D1D5DB", flexShrink: 0,
            }}
          >
            <span style={{
              position: "absolute", top: 3, left: f.isActive ? 22 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s", display: "block",
            }} />
          </button>
          <span style={{ fontSize: 13, color: f.isActive ? "#16A34A" : "#6B7280", fontWeight: 500 }}>
            {f.isActive ? "Active — visible on homepage" : "Inactive — hidden from homepage"}
          </span>
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

  const [showCreate, setShowCreate]       = useState(false);
  const [form, setForm]                   = useState(blank());
  const [creating, setCreating]           = useState(false);
  const [createError, setCreateError]     = useState("");

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
    setEForm({
      desktopImageUrl: b.desktopImageUrl ?? "",
      mobileImageUrl:  b.mobileImageUrl  ?? "",
      linkUrl:         b.linkUrl         ?? "",
      altText:         b.altText         ?? "",
      sortOrder:       b.sortOrder,
      isActive:        b.isActive,
    });
    setSaveError("");
  };

  const buildBody = (f: FormData) => ({
    desktopImageUrl: f.desktopImageUrl,
    mobileImageUrl:  f.mobileImageUrl  || null,
    linkUrl:         f.linkUrl         || null,
    altText:         f.altText         || null,
    sortOrder:       f.sortOrder,
    isActive:        f.isActive,
  });

  const handleCreate = async () => {
    if (!form.desktopImageUrl) { setCreateError("Desktop image is required."); return; }
    setCreating(true); setCreateError("");
    try {
      await bannersApi.create(buildBody(form) as any);
      setShowCreate(false); setForm(blank()); load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editItem) return;
    if (!eForm.desktopImageUrl) { setSaveError("Desktop image is required."); return; }
    setSaving(true); setSaveError("");
    try {
      await bannersApi.update(editItem._id, buildBody(eForm) as any);
      setEditItem(null); load();
    } catch (e: any) { setSaveError(e.message); }
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

            {/* Info card */}
            <div style={{
              background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#1D4ED8",
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                Upload a <strong>Desktop Image</strong> (1920×620 px recommended) and a separate <strong>Mobile Image</strong> (768×600 px recommended).
                Banners are shown as full-width image sliders on the homepage. Set a <strong>Link URL</strong> to make the banner clickable.
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.toolbar}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Homepage Banners</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} banner{total !== 1 ? "s" : ""}</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>
                    + New Banner
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !items.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🖼️</div>
                  <div className={styles.emptyText}>No banners yet. Add one to show on the homepage.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Desktop Preview</th>
                      <th>Mobile Preview</th>
                      <th>Link</th>
                      <th>Sort</th>
                      <th>Active</th>
                      <th>Approval</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((b) => (
                      <tr key={b._id}>
                        <td>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={b.desktopImageUrl}
                            alt={b.altText ?? "Desktop"}
                            style={{ width: 100, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid #E5E7EB", display: "block" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </td>
                        <td>
                          {b.mobileImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={b.mobileImageUrl}
                              alt="Mobile"
                              style={{ width: 30, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid #E5E7EB", display: "block" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <span style={{ fontSize: 12, color: "#9CA3AF" }}>—</span>
                          )}
                        </td>
                        <td>
                          {b.linkUrl ? (
                            <span style={{ fontSize: 12, color: "#1D4ED8", maxWidth: 140, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {b.linkUrl}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "#9CA3AF" }}>No link</span>
                          )}
                        </td>
                        <td style={{ fontSize: 13 }}>{b.sortOrder}</td>
                        <td><Badge variant={b.isActive ? "green" : "red"}>{b.isActive ? "Yes" : "No"}</Badge></td>
                        <td>
                          <Badge variant={
                            b.approvalStatus === "approved" ? "green" :
                            b.approvalStatus === "rejected" ? "red" :
                            b.approvalStatus === "pending"  ? "yellow" : "gray"
                          }>
                            {b.approvalStatus}
                          </Badge>
                        </td>
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
                  <span>Page {page} of {totalPages} · {total} banners</span>
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

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Banner" width={780}>
        <BannerForm f={form} setF={setForm} err={createError} />
        <div className={styles.formActions} style={{ marginTop: 8 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Create Banner"}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Banner" width={780}>
        {editItem && (
          <>
            <BannerForm f={eForm} setF={setEForm} err={saveError} />
            <div className={styles.formActions} style={{ marginTop: 8 }}>
              <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Banner" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Are you sure you want to delete this banner? This cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteItem(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete Banner"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
