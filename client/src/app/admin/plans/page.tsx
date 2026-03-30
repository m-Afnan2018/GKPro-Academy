"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { plansApi, coursesApi, type CoursePlan, type Course } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 20;

const emptyForm = () => ({ courseId: "", planType: "basic" as CoursePlan["planType"], price: 0, validityDays: 30, features: "", isActive: true });

type PlanFormData = ReturnType<typeof emptyForm>;
function PlanForm({ f, setF, err, courses }: { f: PlanFormData; setF: (v: PlanFormData) => void; err: string; courses: Course[] }) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Course</label>
        <select className={styles.formSelect} value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}>
          <option value="">— Select course —</option>
          {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Plan Type</label>
          <select className={styles.formSelect} value={f.planType} onChange={(e) => setF({ ...f, planType: e.target.value as CoursePlan["planType"] })}>
            <option value="basic">Basic</option><option value="standard">Standard</option><option value="premium">Premium</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Active</label>
          <select className={styles.formSelect} value={f.isActive ? "yes" : "no"} onChange={(e) => setF({ ...f, isActive: e.target.value === "yes" })}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Price (₹)</label>
          <input className={styles.formInput} type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Validity (days)</label>
          <input className={styles.formInput} type="number" min={1} value={f.validityDays} onChange={(e) => setF({ ...f, validityDays: Number(e.target.value) })} />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Features (comma-separated)</label>
        <textarea className={styles.formTextarea} rows={3} placeholder="HD Videos, Live Sessions, Notes PDF" value={f.features} onChange={(e) => setF({ ...f, features: e.target.value })} />
      </div>
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans]       = useState<CoursePlan[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [courses, setCourses]   = useState<Course[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(emptyForm());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editPlan, setEditPlan]   = useState<CoursePlan | null>(null);
  const [eForm, setEForm]         = useState(emptyForm());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deletePlan, setDeletePlan] = useState<CoursePlan | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await plansApi.list(page, LIMIT);
      setPlans(res.data.plans ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    coursesApi.list(1, 100).then((r) => setCourses(r.data.courses ?? [])).catch(() => {});
  }, []);

  const courseTitle = (p: CoursePlan) => {
    if (typeof p.courseId === "object" && p.courseId !== null) return (p.courseId as Course).title;
    const found = courses.find((c) => c._id === p.courseId);
    return found?.title ?? "—";
  };

  const openEdit = (p: CoursePlan) => {
    setEditPlan(p);
    setEForm({
      courseId: typeof p.courseId === "object" ? (p.courseId as Course)._id : (p.courseId as string),
      planType: p.planType,
      price: p.price,
      validityDays: p.validityDays,
      features: p.features.join(", "),
      isActive: p.isActive,
    });
    setSaveError("");
  };

  const buildBody = (f: typeof form) => ({
    courseId: f.courseId || undefined,
    planType: f.planType,
    price: Number(f.price),
    validityDays: Number(f.validityDays),
    features: f.features.split(",").map((s) => s.trim()).filter(Boolean),
    isActive: f.isActive,
  });

  const handleCreate = async () => {
    setCreating(true); setCreateError("");
    try {
      await plansApi.create(buildBody(form));
      setShowCreate(false); setForm(emptyForm()); load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editPlan) return;
    setSaving(true); setSaveError("");
    try {
      await plansApi.update(editPlan._id, buildBody(eForm));
      setEditPlan(null); load();
    } catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletePlan) return;
    setDeleting(true);
    try { await plansApi.remove(deletePlan._id); setDeletePlan(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const planBadge = (t: string) => t === "premium" ? "red" : t === "standard" ? "blue" : "gray";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Plans" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Course Plans</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(emptyForm()); }}>+ New Plan</button>
                </div>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !plans.length ? <div className={styles.empty}><div className={styles.emptyIcon}>💳</div><div className={styles.emptyText}>No plans yet</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Course</th><th>Type</th><th>Price</th><th>Validity</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                      {plans.map((p) => (
                        <tr key={p._id}>
                          <td className={styles.namePrimary}>{courseTitle(p)}</td>
                          <td><Badge variant={planBadge(p.planType) as any}>{p.planType}</Badge></td>
                          <td>₹{p.price.toLocaleString()}</td>
                          <td>{p.validityDays}d</td>
                          <td><Badge variant={p.isActive ? "green" : "red"}>{p.isActive ? "Active" : "Inactive"}</Badge></td>
                          <td>
                            <div className={styles.actions}>
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(p)}>Edit</button>
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeletePlan(p)}>Delete</button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Plan">
        <PlanForm f={form} setF={setForm} err={createError} courses={courses} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create Plan"}</button>
        </div>
      </Modal>

      <Modal open={!!editPlan} onClose={() => setEditPlan(null)} title="Edit Plan">
        {editPlan && <>
          <PlanForm f={eForm} setF={setEForm} err={saveError} courses={courses} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditPlan(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deletePlan} onClose={() => setDeletePlan(null)} title="Delete Plan" width={400}>
        {deletePlan && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete the <strong>{deletePlan.planType}</strong> plan? This cannot be undone.</p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeletePlan(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
