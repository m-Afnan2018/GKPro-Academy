"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { batchesApi, coursesApi, plansApi, type Batch, type Course, type CoursePlan } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

const fmt = (d: string) => d ? new Date(d).toISOString().slice(0, 10) : "";
const blankForm = () => ({ courseId: "", planId: "", name: "", mode: "live" as Batch["mode"], startDate: "", endDate: "", seatLimit: "", status: "upcoming" as Batch["status"], meetingLink: "" });

type BatchFormData = ReturnType<typeof blankForm>;
function BatchForm({ f, setF, err, courses, plans }: { f: BatchFormData; setF: (v: BatchFormData) => void; err: string; courses: Course[]; plans: CoursePlan[] }) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Batch Name *</label>
        <input className={styles.formInput} placeholder="e.g. May 2025 Batch" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Course</label>
          <select className={styles.formSelect} value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}>
            <option value="">— Select —</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Plan</label>
          <select className={styles.formSelect} value={f.planId} onChange={(e) => setF({ ...f, planId: e.target.value })}>
            <option value="">— Select —</option>
            {plans.map((p) => <option key={p._id} value={p._id}>{typeof p.courseId === "object" ? (p.courseId as Course).title : ""} – {p.planType}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Mode</label>
          <select className={styles.formSelect} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as Batch["mode"] })}>
            <option value="live">Live</option><option value="recorded">Recorded</option><option value="one_on_one">One-on-One</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Status</label>
          <select className={styles.formSelect} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Batch["status"] })}>
            <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Start Date</label>
          <input className={styles.formInput} type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>End Date</label>
          <input className={styles.formInput} type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Seat Limit (leave blank for unlimited)</label>
        <input className={styles.formInput} type="number" min={1} value={f.seatLimit} onChange={(e) => setF({ ...f, seatLimit: e.target.value })} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Meeting Link (Google Meet / Zoom)</label>
        <input className={styles.formInput} type="url" placeholder="https://meet.google.com/... or zoom.us/j/..." value={(f as any).meetingLink ?? ""} onChange={(e) => setF({ ...f, meetingLink: e.target.value } as any)} />
      </div>
    </div>
  );
}

export default function BatchesPage() {
  const [batches, setBatches]   = useState<Batch[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [courses, setCourses]   = useState<Course[]>([]);
  const [plans, setPlans]       = useState<CoursePlan[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blankForm());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [eForm, setEForm]         = useState(blankForm());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteBatch, setDeleteBatch] = useState<Batch | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await batchesApi.list(page, LIMIT);
      setBatches(res.data.batches ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    coursesApi.list(1, 100).then((r) => setCourses(r.data.courses ?? [])).catch(() => {});
    plansApi.list(1, 100).then((r) => setPlans(r.data.plans ?? [])).catch(() => {});
  }, []);

  const getTitle = (id: Course | string) => {
    if (typeof id === "object") return (id as Course).title;
    return courses.find((c) => c._id === id)?.title ?? "—";
  };

  const openEdit = (b: Batch) => {
    setEditBatch(b);
    setEForm({
      courseId: typeof b.courseId === "object" ? (b.courseId as Course)._id : (b.courseId as string),
      planId: typeof b.planId === "object" ? (b.planId as CoursePlan)._id : (b.planId as string),
      name: b.name, mode: b.mode,
      startDate: fmt(b.startDate), endDate: b.endDate ? fmt(b.endDate) : "",
      seatLimit: b.seatLimit?.toString() ?? "",
      status: b.status,
      meetingLink: (b as any).meetingLink ?? "",
    });
    setSaveError("");
  };

  const buildBody = (f: typeof form) => ({
    courseId: f.courseId || undefined, planId: f.planId || undefined,
    name: f.name, mode: f.mode,
    startDate: f.startDate || undefined,
    endDate: f.endDate || undefined,
    seatLimit: f.seatLimit ? Number(f.seatLimit) : undefined,
    status: f.status,
    meetingLink: (f as any).meetingLink || undefined,
  });

  const handleCreate = async () => {
    setCreating(true); setCreateError("");
    try { await batchesApi.create(buildBody(form)); setShowCreate(false); setForm(blankForm()); load(); }
    catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editBatch) return;
    setSaving(true); setSaveError("");
    try { await batchesApi.update(editBatch._id, buildBody(eForm)); setEditBatch(null); load(); }
    catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteBatch) return;
    setDeleting(true);
    try { await batchesApi.remove(deleteBatch._id); setDeleteBatch(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const statusBadge = (s: string) => s === "ongoing" ? "green" : s === "upcoming" ? "blue" : s === "cancelled" ? "red" : "gray";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Batches" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Course Batches</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blankForm()); }}>+ New Batch</button>
                </div>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !batches.length ? <div className={styles.empty}><div className={styles.emptyIcon}>📅</div><div className={styles.emptyText}>No batches yet</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Name</th><th>Course</th><th>Mode</th><th>Start Date</th><th>Seats</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {batches.map((b) => (
                        <tr key={b._id}>
                          <td className={styles.namePrimary}>{b.name}</td>
                          <td style={{ fontSize: 12, color: "#6B7280" }}>{getTitle(b.courseId)}</td>
                          <td><Badge variant="blue">{b.mode}</Badge></td>
                          <td>{new Date(b.startDate).toLocaleDateString()}</td>
                          <td>{b.seatLimit ? `${b.enrolledCount}/${b.seatLimit}` : b.enrolledCount}</td>
                          <td><Badge variant={statusBadge(b.status) as any}>{b.status}</Badge></td>
                          <td>
                            <div className={styles.actions}>
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(b)}>Edit</button>
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteBatch(b)}>Delete</button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Batch">
        <BatchForm f={form} setF={setForm} err={createError} courses={courses} plans={plans} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create Batch"}</button>
        </div>
      </Modal>

      <Modal open={!!editBatch} onClose={() => setEditBatch(null)} title="Edit Batch">
        {editBatch && <>
          <BatchForm f={eForm} setF={setEForm} err={saveError} courses={courses} plans={plans} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditBatch(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deleteBatch} onClose={() => setDeleteBatch(null)} title="Delete Batch" width={400}>
        {deleteBatch && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete batch <strong>{deleteBatch.name}</strong>? This cannot be undone.</p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteBatch(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
