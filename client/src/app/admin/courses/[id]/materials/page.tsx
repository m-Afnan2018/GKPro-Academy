"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { resourcesApi, type Resource, type Course } from "@/lib/api";
import styles from "../../../admin.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const blank = (): Partial<Resource> => ({
  title: "", description: "", type: "video", url: "",
  section: "General", sortOrder: 0, duration: "", isPublic: false,
});

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pdf:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  link:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  doc:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  meet:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>,
};

export default function CourseMaterialsPage() {
  const { id: courseId } = useParams<{ id: string }>();

  const [course, setCourse]   = useState<Course | null>(null);
  const [resources, setRes]   = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Create
  const [showCreate, setShowCreate]     = useState(false);
  const [form, setForm]                 = useState(blank());
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState("");

  // Edit
  const [editItem, setEditItem]   = useState<Resource | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete
  const [deleteItem, setDeleteItem] = useState<Resource | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await resourcesApi.list(courseId, 1, 200);
      setRes(res.data.resources ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  // Fetch course name for breadcrumb
  useEffect(() => {
    if (!courseId) return;
    fetch(`${BASE}/courses/admin/all?limit=200`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("gkpro_admin_token")}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const c = json.data?.courses?.find((x: Course) => x._id === courseId);
        if (c) setCourse(c);
      })
      .catch(() => {});
  }, [courseId]);

  // Group by section
  const sections = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    const s = r.section || "General";
    if (!acc[s]) acc[s] = [];
    acc[s].push(r);
    return acc;
  }, {});

  const handleCreate = async () => {
    if (!form.title?.trim()) { setCreateError("Title is required"); return; }
    if (!form.url?.trim())   { setCreateError("URL is required"); return; }
    setCreating(true); setCreateError("");
    try {
      await resourcesApi.create({ ...form, courseId });
      setShowCreate(false); setForm(blank()); load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const openEdit = (r: Resource) => {
    setEditItem(r);
    setEForm({
      title: r.title, description: r.description ?? "", type: r.type,
      url: r.url, section: r.section ?? "General",
      sortOrder: r.sortOrder, duration: r.duration ?? "", isPublic: r.isPublic,
    });
    setSaveError("");
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true); setSaveError("");
    try {
      await resourcesApi.update(editItem._id, eForm);
      setEditItem(null); load();
    } catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await resourcesApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const ResourceForm = ({ f, setF, err }: { f: typeof form; setF: (v: typeof form) => void; err: string }) => (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Type *</label>
          <select className={styles.formSelect} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Resource["type"] })}>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="link">Link</option>
            <option value="doc">Document</option>
            <option value="meet">Google Meet / Zoom</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Section</label>
          <input className={styles.formInput} placeholder="e.g. Chapter 1" value={f.section ?? ""} onChange={(e) => setF({ ...f, section: e.target.value })} />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Title *</label>
        <input className={styles.formInput} placeholder="e.g. Introduction to Accounting" value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Description</label>
        <input className={styles.formInput} placeholder="Brief description (optional)" value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>URL / Link *</label>
        <input className={styles.formInput} placeholder="https://youtube.com/watch?v=... or drive.google.com/..." value={f.url ?? ""} onChange={(e) => setF({ ...f, url: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Duration</label>
          <input className={styles.formInput} placeholder="e.g. 45 min" value={f.duration ?? ""} onChange={(e) => setF({ ...f, duration: e.target.value })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Sort Order</label>
          <input className={styles.formInput} type="number" value={f.sortOrder ?? 0} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Public Preview</label>
          <select className={styles.formSelect} value={f.isPublic ? "yes" : "no"} onChange={(e) => setF({ ...f, isPublic: e.target.value === "yes" })}>
            <option value="no">No (enrolled only)</option>
            <option value="yes">Yes (anyone)</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Course Materials" />
          <div className={styles.content}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: "#6B7280" }}>
              <Link href="/admin/courses" style={{ color: "#6B7280" }}>Courses</Link>
              <span>›</span>
              <span style={{ color: "#111827", fontWeight: 600 }}>{course?.title ?? "Loading…"}</span>
              <span>›</span>
              <span>Materials</span>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                  {resources.length} material{resources.length !== 1 ? "s" : ""}
                </span>
                <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>
                  + Add Material
                </button>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !resources.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📚</div>
                  <div className={styles.emptyText}>No materials yet. Add videos, PDFs or links.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type</th><th>Title</th><th>Section</th><th>Duration</th><th>Preview</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sections).map(([sec, items]) => (
                      <>
                        <tr key={`sec-${sec}`}>
                          <td colSpan={6} style={{ background: "#F9FAFB", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                            {sec}
                          </td>
                        </tr>
                        {items.map((r) => (
                          <tr key={r._id}>
                            <td>
                              <Badge variant={r.type === "video" ? "blue" : r.type === "pdf" ? "red" : r.type === "meet" ? "green" : "gray"}>
                                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>{TYPE_ICONS[r.type]} {r.type.toUpperCase()}</span>
                              </Badge>
                            </td>
                            <td>
                              <div className={styles.namePrimary}>{r.title}</div>
                              {r.description && <div className={styles.nameSecondary}>{r.description}</div>}
                            </td>
                            <td style={{ fontSize: 12, color: "#6B7280" }}>{r.section}</td>
                            <td style={{ fontSize: 12, color: "#6B7280" }}>{r.duration || "—"}</td>
                            <td><Badge variant={r.isPublic ? "green" : "yellow"}>{r.isPublic ? "Public" : "Enrolled"}</Badge></td>
                            <td>
                              <div className={styles.actions}>
                                <a href={r.url} target="_blank" rel="noreferrer" className={`${styles.btnGhost} ${styles.btnGhostGreen}`} style={{ textDecoration: "none" }}>Open</a>
                                <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(r)}>Edit</button>
                                <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteItem(r)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Material">
        <ResourceForm f={form} setF={setForm} err={createError} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Adding…" : "Add Material"}</button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Material">
        {editItem && <>
          <ResourceForm f={eForm} setF={setEForm} err={saveError} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Material" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Delete <strong>{deleteItem.title}</strong>? This cannot be undone.
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
