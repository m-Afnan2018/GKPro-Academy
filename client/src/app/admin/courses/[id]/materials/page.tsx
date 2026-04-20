"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import MaterialUpload from "@/components/admin/MaterialUpload/MaterialUpload";
import { resourcesApi, type Resource, type Course } from "@/lib/api";
import styles from "../../../admin.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const blank = (): Partial<Resource> => ({
  title: "", description: "", type: "video", url: "",
  section: "General", sortOrder: 0, duration: "", isPublic: false, targetMode: "both",
});

const TYPE_LABELS: Record<string, string> = {
  video: "Video", pdf: "PDF", link: "Link / URL", doc: "Document", meet: "Google Meet / Zoom", excel: "Excel Spreadsheet",
};

const TYPE_COLORS: Record<string, string> = {
  video: "#2563EB", pdf: "#DC2626", link: "#059669", doc: "#7C3AED", meet: "#D97706", excel: "#16A34A",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pdf:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  link:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  doc:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  meet:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>,
  excel: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="14" y2="9"/></svg>,
};

const DragHandle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ cursor: "grab", flexShrink: 0 }}>
    <circle cx="9"  cy="6"  r="1.2" fill="#9CA3AF" stroke="none"/>
    <circle cx="15" cy="6"  r="1.2" fill="#9CA3AF" stroke="none"/>
    <circle cx="9"  cy="12" r="1.2" fill="#9CA3AF" stroke="none"/>
    <circle cx="15" cy="12" r="1.2" fill="#9CA3AF" stroke="none"/>
    <circle cx="9"  cy="18" r="1.2" fill="#9CA3AF" stroke="none"/>
    <circle cx="15" cy="18" r="1.2" fill="#9CA3AF" stroke="none"/>
  </svg>
);

/* ── ResourceForm defined OUTSIDE the page component ── */
interface FormProps {
  f: Partial<Resource>;
  setF: (v: Partial<Resource>) => void;
  err: string;
}

function ResourceForm({ f, setF, err }: FormProps) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Type *</label>
          <select
            className={styles.formSelect}
            value={f.type}
            onChange={e => setF({ ...f, type: e.target.value as Resource["type"], url: "" })}
          >
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel Spreadsheet</option>
            <option value="doc">Document</option>
            <option value="link">Link / URL</option>
            <option value="meet">Google Meet / Zoom</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Section</label>
          <input
            className={styles.formInput}
            placeholder="e.g. Chapter 1"
            value={f.section ?? ""}
            onChange={e => setF({ ...f, section: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Title *</label>
        <input
          className={styles.formInput}
          placeholder="e.g. Introduction to Accounting"
          value={f.title ?? ""}
          onChange={e => setF({ ...f, title: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Description</label>
        <input
          className={styles.formInput}
          placeholder="Brief description (optional)"
          value={f.description ?? ""}
          onChange={e => setF({ ...f, description: e.target.value })}
        />
      </div>

      {/* File upload or URL input depending on type */}
      <div className={styles.formGroup}>
        <MaterialUpload
          type={f.type as "video" | "pdf" | "link" | "doc" | "meet" | "excel"}
          value={f.url ?? ""}
          onChange={url => setF({ ...f, url })}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Duration</label>
          <input
            className={styles.formInput}
            placeholder="e.g. 45 min"
            value={f.duration ?? ""}
            onChange={e => setF({ ...f, duration: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Visibility</label>
          <select
            className={styles.formSelect}
            value={f.isPublic ? "yes" : "no"}
            onChange={e => setF({ ...f, isPublic: e.target.value === "yes" })}
          >
            <option value="no">Enrolled only</option>
            <option value="yes">Public preview</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Available For</label>
        <select
          className={styles.formSelect}
          value={f.targetMode ?? "both"}
          onChange={e => setF({ ...f, targetMode: e.target.value as Resource["targetMode"] })}
        >
          <option value="both">Both (Online & Recorded)</option>
          <option value="online">Online (Live) only</option>
          <option value="recorded">Recorded only</option>
        </select>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function CourseMaterialsPage() {
  const { id: courseId } = useParams<{ id: string }>();

  const [course, setCourse]       = useState<Course | null>(null);
  const [resources, setRes]       = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState(blank());
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState("");

  const [editItem, setEditItem]   = useState<Resource | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteItem, setDeleteItem] = useState<Resource | null>(null);
  const [deleting, setDeleting]     = useState(false);

  // Drag state
  const [dragId, setDragId]         = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const dragList = useRef<Resource[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await resourcesApi.list(courseId, 1, 200);
      setRes(res.data.resources ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!courseId) return;
    fetch(`${BASE}/courses/admin/all?limit=200`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("gkpro_admin_token")}` },
    })
      .then(r => r.json())
      .then(json => {
        const c = json.data?.courses?.find((x: Course) => x._id === courseId);
        if (c) setCourse(c);
      })
      .catch(() => {});
  }, [courseId]);

  /* ── auto sort order ── */
  const nextSortOrder = () =>
    resources.length ? Math.max(...resources.map(r => r.sortOrder ?? 0)) + 1 : 1;

  /* ── create ── */
  const handleCreate = async () => {
    if (!form.title?.trim()) { setCreateError("Title is required"); return; }
    if (!form.url?.trim())   { setCreateError("URL / file is required"); return; }
    setCreating(true); setCreateError("");
    try {
      await resourcesApi.create({ ...form, courseId, sortOrder: nextSortOrder() });
      setShowCreate(false); setForm(blank()); load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  /* ── edit ── */
  const openEdit = (r: Resource) => {
    setEditItem(r);
    setEForm({
      title: r.title, description: r.description ?? "", type: r.type,
      url: r.url, section: r.section ?? "General",
      sortOrder: r.sortOrder, duration: r.duration ?? "", isPublic: r.isPublic,
      targetMode: r.targetMode ?? "both",
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

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await resourcesApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  /* ── drag & drop ── */
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    dragList.current = [...resources];
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setDragOverId(overId);
    const arr  = [...dragList.current];
    const from = arr.findIndex(r => r._id === dragId);
    const to   = arr.findIndex(r => r._id === overId);
    if (from === -1 || to === -1) return;
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setRes(arr);
  };

  const onDragEnd = async () => {
    setDragId(null); setDragOverId(null);
    if (!dragList.current.length) return;
    // Assign sequential sortOrder
    const items = resources.map((r, i) => ({ _id: r._id, sortOrder: i + 1 }));
    setReordering(true);
    try {
      await resourcesApi.reorder(items);
      // Update local state with new sortOrders
      setRes(prev => prev.map(r => {
        const found = items.find(x => x._id === r._id);
        return found ? { ...r, sortOrder: found.sortOrder } : r;
      }));
    } catch { /* silent — UI already shows new order */ }
    finally { setReordering(false); }
  };

  /* ── group by section ── */
  const sections = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    const s = r.section || "General";
    if (!acc[s]) acc[s] = [];
    acc[s].push(r);
    return acc;
  }, {});

  const sectionKeys = Object.keys(sections);

  return (
    <AdminGuard>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .mat-item { transition: background 0.15s, box-shadow 0.15s; }
        .mat-item:hover { background: #F9FAFB !important; }
        .mat-item.dragging { opacity: 0.4; }
        .mat-item.drag-over { box-shadow: 0 -2px 0 0 #D42B3A; }
      `}</style>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Course Materials" />
          <div className={styles.content}>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#6B7280" }}>
              <Link href="/admin/courses" style={{ color: "#6B7280", textDecoration: "none" }}>Courses</Link>
              <span>›</span>
              <span style={{ color: "#111827", fontWeight: 600 }}>{course?.title ?? "Loading…"}</span>
              <span>›</span>
              <span>Materials</span>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    {resources.length} Material{resources.length !== 1 ? "s" : ""}
                  </span>
                  {reordering && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6B7280" }}>
                      <span style={{ width: 14, height: 14, border: "2px solid #D1D5DB", borderTopColor: "#6B7280", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      Saving order…
                    </span>
                  )}
                </div>
                <button
                  className={styles.btnPrimary}
                  onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}
                >
                  + Add Material
                </button>
              </div>

              {loading ? (
                <div style={{ padding: 48, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Loading…</div>
              ) : !resources.length ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
                  <div style={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>No materials yet.</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Add videos, PDFs, documents or links.</div>
                </div>
              ) : (
                <div>
                  {sectionKeys.map((sec, si) => (
                    <div key={sec}>
                      {/* Section header */}
                      <div style={{
                        padding: "8px 20px",
                        background: "#F9FAFB",
                        borderTop: si > 0 ? "1px solid #F3F4F6" : "none",
                        borderBottom: "1px solid #F3F4F6",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                        {sec}
                        <span style={{ fontWeight: 500, color: "#9CA3AF", textTransform: "none", letterSpacing: 0 }}>
                          · {sections[sec].length} item{sections[sec].length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Items */}
                      {sections[sec].map((r) => {
                        const color = TYPE_COLORS[r.type] ?? "#6B7280";
                        const isDragging  = dragId === r._id;
                        const isDragOver  = dragOverId === r._id;
                        return (
                          <div
                            key={r._id}
                            className={`mat-item${isDragging ? " dragging" : ""}${isDragOver ? " drag-over" : ""}`}
                            draggable
                            onDragStart={e => onDragStart(e, r._id)}
                            onDragOver={e => onDragOver(e, r._id)}
                            onDragEnd={onDragEnd}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "12px 20px",
                              borderBottom: "1px solid #F3F4F6",
                              background: "#fff",
                              userSelect: "none",
                            }}
                          >
                            {/* Drag handle */}
                            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", paddingRight: 4 }}>
                              <DragHandle />
                            </div>

                            {/* Type icon */}
                            <div style={{
                              width: 34, height: 34, borderRadius: 8,
                              background: `${color}15`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, color,
                            }}>
                              {TYPE_ICONS[r.type]}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{r.title}</span>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                                  color, background: `${color}15`,
                                  padding: "2px 7px", borderRadius: 4, letterSpacing: "0.5px",
                                }}>{r.type}</span>
                                {r.isPublic && (
                                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#059669", background: "#D1FAE5", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.5px" }}>
                                    Public
                                  </span>
                                )}
                                {r.targetMode === "online" && (
                                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#0369A1", background: "#E0F2FE", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.5px" }}>
                                    Live only
                                  </span>
                                )}
                                {r.targetMode === "recorded" && (
                                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#7C3AED", background: "#EDE9FE", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.5px" }}>
                                    Recorded only
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
                                {r.description && (
                                  <span style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
                                    {r.description}
                                  </span>
                                )}
                                {r.duration && (
                                  <span style={{ fontSize: 12, color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    {r.duration}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "5px 12px", fontSize: 12, fontWeight: 600,
                                  color: "#059669", background: "#ECFDF5",
                                  border: "1px solid #A7F3D0", borderRadius: 6,
                                  textDecoration: "none", lineHeight: 1,
                                }}
                              >
                                Open ↗
                              </a>
                              <button
                                onClick={() => openEdit(r)}
                                style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, cursor: "pointer", lineHeight: 1 }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteItem(r)}
                                style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer", lineHeight: 1 }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Drag hint */}
                  <div style={{ padding: "10px 20px", fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 5 }}>
                    <DragHandle />
                    Drag items to reorder
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Material">
        <ResourceForm f={form} setF={setForm} err={createError} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>
            {creating ? "Adding…" : "Add Material"}
          </button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Material">
        {editItem && (
          <>
            <ResourceForm f={eForm} setF={setEForm} err={saveError} />
            <div className={styles.formActions} style={{ marginTop: 4 }}>
              <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Material" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Delete <strong>{deleteItem.title}</strong>? This cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteItem(null)}>Cancel</button>
              <button
                className={styles.btnPrimary}
                style={{ background: "#DC2626" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
