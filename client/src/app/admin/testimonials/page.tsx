"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import ImageUpload from "@/components/admin/ImageUpload/ImageUpload";
import { testimonialsApi, coursesApi, type Testimonial, type Course } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;
const blank = () => ({ studentName: "", courseId: "", isGeneral: false, content: "", rating: 5, photoUrl: "", isActive: true });

type TestFormData = ReturnType<typeof blank>;

function TestForm({ f, setF, err, courses }: {
  f: TestFormData;
  setF: (v: TestFormData) => void;
  err: string;
  courses: Course[];
}) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Student Name *</label>
        <input className={styles.formInput} value={f.studentName} onChange={(e) => setF({ ...f, studentName: e.target.value })} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Course</label>
        <select
          className={styles.formSelect}
          value={f.courseId}
          onChange={(e) => setF({ ...f, courseId: e.target.value })}
        >
          <option value="">— Not linked to a course —</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
          Leave blank for a general testimonial.
        </p>
      </div>

      {/* isGeneral toggle */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Show on Home Page</label>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setF({ ...f, isGeneral: !f.isGeneral })}
            style={{
              width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
              background: f.isGeneral ? "#16A34A" : "#D1D5DB",
              position: "relative", transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <span style={{
              position: "absolute", top: 3, left: f.isGeneral ? 22 : 3,
              width: 18, height: 18, borderRadius: "50%",
              background: "#fff", transition: "left 0.2s", display: "block",
            }} />
          </button>
          <span style={{ fontSize: 13, color: f.isGeneral ? "#16A34A" : "#6B7280" }}>
            {f.isGeneral ? "Yes — visible on home page" : "No — course-specific only"}
          </span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Testimonial *</label>
        <textarea className={styles.formTextarea} rows={3} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Rating (1–5)</label>
          <input className={styles.formInput} type="number" min={1} max={5} value={f.rating} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Active</label>
          <select className={styles.formSelect} value={f.isActive ? "yes" : "no"} onChange={(e) => setF({ ...f, isActive: e.target.value === "yes" })}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <ImageUpload label="Student Photo (optional)" value={f.photoUrl} onChange={(url) => setF({ ...f, photoUrl: url })} />
      </div>
    </div>
  );
}

export default function TestimonialsPage() {
  const [items, setItems]     = useState<Testimonial[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [generalFilter, setGeneralFilter] = useState<"all" | "general" | "course">("all");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blank());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editItem, setEditItem]   = useState<Testimonial | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteItem, setDeleteItem] = useState<Testimonial | null>(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    coursesApi.list(1, 200).then((r) => setAllCourses(r.data.courses ?? [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await testimonialsApi.list(page, LIMIT);
      setItems(res.data.testimonials ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (t: Testimonial) => {
    setEditItem(t);
    const cId = t.courseId
      ? typeof t.courseId === "object" ? (t.courseId as Course)._id : t.courseId
      : "";
    setEForm({
      studentName: t.studentName,
      courseId: cId,
      isGeneral: t.isGeneral ?? false,
      content: t.content,
      rating: t.rating,
      photoUrl: t.photoUrl ?? "",
      isActive: t.isActive,
    });
    setSaveError("");
  };

  const buildBody = (f: TestFormData) => ({
    studentName: f.studentName,
    courseId:    f.courseId || null,
    isGeneral:   f.isGeneral,
    content:     f.content,
    rating:      Number(f.rating),
    photoUrl:    f.photoUrl || undefined,
    isActive:    f.isActive,
  });

  const handleCreate = async () => {
    if (!form.studentName.trim()) { setCreateError("Student name is required"); return; }
    if (!form.content.trim())     { setCreateError("Testimonial content is required"); return; }
    setCreating(true); setCreateError("");
    try { await testimonialsApi.create(buildBody(form) as any); setShowCreate(false); setForm(blank()); load(); }
    catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true); setSaveError("");
    try { await testimonialsApi.update(editItem._id, buildBody(eForm) as any); setEditItem(null); load(); }
    catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await testimonialsApi.remove(deleteItem._id); setDeleteItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const filtered = items.filter((t) => {
    if (generalFilter === "general") return t.isGeneral;
    if (generalFilter === "course")  return !!t.courseId;
    return true;
  });

  const courseName = (t: Testimonial) => {
    if (!t.courseId) return null;
    if (typeof t.courseId === "object") return (t.courseId as Course).title;
    return allCourses.find((c) => c._id === t.courseId)?.title ?? "Course";
  };

  const totalPages = Math.ceil(total / LIMIT);
  const stars = (n: number) => "★".repeat(Math.max(1, Math.min(5, n))) + "☆".repeat(5 - Math.max(1, Math.min(5, n)));

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Testimonials" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <select className={styles.filterSelect} value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value as any)}>
                    <option value="all">All Testimonials</option>
                    <option value="general">Home Page Only</option>
                    <option value="course">Course-Linked Only</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>+ New</button>
                </div>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !filtered.length ? <div className={styles.empty}><div className={styles.emptyIcon}>💬</div><div className={styles.emptyText}>No testimonials yet</div></div>
                : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Home Page</th>
                        <th>Rating</th>
                        <th>Active</th>
                        <th>Approval</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => (
                        <tr key={t._id}>
                          <td>
                            <div className={styles.namePrimary}>{t.studentName}</div>
                            <div className={styles.nameSecondary}>{t.content.slice(0, 50)}{t.content.length > 50 ? "…" : ""}</div>
                          </td>
                          <td style={{ fontSize: 13 }}>
                            {courseName(t)
                              ? <Badge variant="blue">{courseName(t)!}</Badge>
                              : <span style={{ color: "#9CA3AF" }}>—</span>
                            }
                          </td>
                          <td>
                            <Badge variant={t.isGeneral ? "green" : "gray"}>{t.isGeneral ? "Yes" : "No"}</Badge>
                          </td>
                          <td style={{ color: "#F59E0B", fontSize: 14 }}>{stars(t.rating)}</td>
                          <td><Badge variant={t.isActive ? "green" : "red"}>{t.isActive ? "Yes" : "No"}</Badge></td>
                          <td><Badge variant={t.approvalStatus === "approved" ? "green" : t.approvalStatus === "rejected" ? "red" : t.approvalStatus === "pending" ? "yellow" : "gray"}>{t.approvalStatus}</Badge></td>
                          <td>
                            <div className={styles.actions}>
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(t)}>Edit</button>
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteItem(t)}>Delete</button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Testimonial">
        <TestForm f={form} setF={setForm} err={createError} courses={allCourses} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Testimonial">
        {editItem && <>
          <TestForm f={eForm} setF={setEForm} err={saveError} courses={allCourses} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Testimonial" width={400}>
        {deleteItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete testimonial from <strong>{deleteItem.studentName}</strong>?</p>
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
