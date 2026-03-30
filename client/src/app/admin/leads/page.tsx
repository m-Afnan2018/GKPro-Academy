"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { leadsApi, coursesApi, type Lead, type Course } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

const blank = () => ({ name: "", phone: "", email: "", courseId: "", source: "website" as Lead["source"], status: "new" as Lead["status"], notes: "" });

type LeadFormData = ReturnType<typeof blank>;
function LeadForm({ f, setF, err, courses }: { f: LeadFormData; setF: (v: LeadFormData) => void; err: string; courses: Course[] }) {
  return (
    <div className={styles.form}>
      {err && <div className={styles.errorBanner}>{err}</div>}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Name *</label>
          <input className={styles.formInput} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Phone *</label>
          <input className={styles.formInput} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Email</label>
        <input className={styles.formInput} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
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
          <label className={styles.formLabel}>Source</label>
          <select className={styles.formSelect} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as Lead["source"] })}>
            <option value="website">Website</option><option value="whatsapp">WhatsApp</option>
            <option value="demo">Demo</option><option value="referral">Referral</option><option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Status</label>
        <select className={styles.formSelect} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Lead["status"] })}>
          <option value="new">New</option><option value="contacted">Contacted</option><option value="converted">Converted</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Notes</label>
        <textarea className={styles.formTextarea} rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [courses, setCourses]   = useState<Course[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blank());
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  const [editLead, setEditLead]   = useState<Lead | null>(null);
  const [eForm, setEForm]         = useState(blank());
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await leadsApi.list(page, LIMIT);
      setLeads(res.data.leads ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    coursesApi.list(1, 100).then((r) => setCourses(r.data.courses ?? [])).catch(() => {});
  }, []);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.email ?? "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openEdit = (l: Lead) => {
    setEditLead(l);
    setEForm({
      name: l.name, phone: l.phone, email: l.email ?? "",
      courseId: typeof l.courseId === "object" ? (l.courseId as Course)._id : (l.courseId as string ?? ""),
      source: l.source, status: l.status, notes: l.notes ?? "",
    });
    setSaveError("");
  };

  const handleCreate = async () => {
    setCreating(true); setCreateError("");
    try {
      await leadsApi.create({ ...form, courseId: form.courseId || undefined, email: form.email || undefined });
      setShowCreate(false); setForm(blank()); load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editLead) return;
    setSaving(true); setSaveError("");
    try {
      await leadsApi.update(editLead._id, { ...eForm, courseId: eForm.courseId || undefined, email: eForm.email || undefined });
      setEditLead(null); load();
    } catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteLead) return;
    setDeleting(true);
    try { await leadsApi.remove(deleteLead._id); setDeleteLead(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const handleConvert = async (id: string) => {
    setConvertingId(id);
    try { await leadsApi.convert(id); load(); }
    catch (e: any) { setError(e.message); }
    finally { setConvertingId(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const statusBadge = (s: string) => s === "converted" ? "green" : s === "contacted" ? "blue" : "yellow";
  const sourceBadge = (s: string) => s === "whatsapp" ? "green" : s === "demo" ? "blue" : "gray";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Leads" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg></span>
                    <input className={styles.searchInput} placeholder="Search name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="new">New</option><option value="contacted">Contacted</option><option value="converted">Converted</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); setForm(blank()); }}>+ Add Lead</button>
                </div>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !filtered.length ? <div className={styles.empty}><div className={styles.emptyIcon}>📞</div><div className={styles.emptyText}>No leads found</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Lead</th><th>Source</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filtered.map((l) => (
                        <tr key={l._id}>
                          <td>
                            <div className={styles.nameCell}>
                              <div className={styles.nameAvatar}>{l.name[0]?.toUpperCase()}</div>
                              <div>
                                <div className={styles.namePrimary}>{l.name}</div>
                                <div className={styles.nameSecondary}>{l.phone}{l.email ? ` · ${l.email}` : ""}</div>
                              </div>
                            </div>
                          </td>
                          <td><Badge variant={sourceBadge(l.source) as any}>{l.source}</Badge></td>
                          <td><Badge variant={statusBadge(l.status) as any}>{l.status}</Badge></td>
                          <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className={styles.actions}>
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(l)}>Edit</button>
                              {l.status !== "converted" && (
                                <button className={`${styles.btnGhost} ${styles.btnGhostGreen}`} onClick={() => handleConvert(l._id)} disabled={convertingId === l._id}>
                                  {convertingId === l._id ? "…" : "Convert"}
                                </button>
                              )}
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteLead(l)}>Delete</button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Lead">
        <LeadForm f={form} setF={setForm} err={createError} courses={courses} />
        <div className={styles.formActions} style={{ marginTop: 4 }}>
          <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Saving…" : "Add Lead"}</button>
        </div>
      </Modal>

      <Modal open={!!editLead} onClose={() => setEditLead(null)} title="Edit Lead">
        {editLead && <>
          <LeadForm f={eForm} setF={setEForm} err={saveError} courses={courses} />
          <div className={styles.formActions} style={{ marginTop: 4 }}>
            <button className={styles.btnOutline} onClick={() => setEditLead(null)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </>}
      </Modal>

      <Modal open={!!deleteLead} onClose={() => setDeleteLead(null)} title="Delete Lead" width={400}>
        {deleteLead && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete lead <strong>{deleteLead.name}</strong>? This cannot be undone.</p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteLead(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
