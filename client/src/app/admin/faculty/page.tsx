"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Modal from "@/components/admin/Modal/Modal";
import ImageUpload from "@/components/admin/ImageUpload/ImageUpload";
import { facultyApi, type Faculty } from "@/lib/api";
import styles from "./faculty.module.css";
import adminStyles from "../admin.module.css";

const LIMIT = 12;

/* Gradient palette for banner backgrounds */
const BANNERS = [
  "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
  "linear-gradient(135deg,#D42B3A 0%,#f87171 100%)",
  "linear-gradient(135deg,#0f4c75 0%,#1b6ca8 100%)",
  "linear-gradient(135deg,#134e4a 0%,#0d9488 100%)",
  "linear-gradient(135deg,#78350f 0%,#d97706 100%)",
  "linear-gradient(135deg,#312e81 0%,#6d28d9 100%)",
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ── Form ───────────────────────────────────────── */
function FacultyForm({ f, setF, err }: {
  f: Partial<Faculty>;
  setF: (v: Partial<Faculty>) => void;
  err: string;
}) {
  const set = (k: keyof Faculty, v: any) => setF({ ...f, [k]: v });
  return (
    <div className={adminStyles.form}>
      {err && <div className={adminStyles.errorBanner}>{err}</div>}

      {/* Avatar + core info row */}
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        <div style={{ flexShrink: 0 }}>
          <label className={adminStyles.formLabel}>Photo</label>
          <ImageUpload value={f.avatar ?? ""} onChange={v => set("avatar", v)} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className={adminStyles.formGroup}>
            <label className={adminStyles.formLabel}>Full Name *</label>
            <input
              className={adminStyles.formInput}
              placeholder="e.g. CA Priya Sharma"
              value={f.name ?? ""}
              onChange={e => set("name", e.target.value)}
            />
          </div>
          <div className={adminStyles.formGroup}>
            <label className={adminStyles.formLabel}>Designation / Title</label>
            <input
              className={adminStyles.formInput}
              placeholder="e.g. Chartered Accountant · Senior Instructor"
              value={f.designation ?? ""}
              onChange={e => set("designation", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className={adminStyles.formRow}>
        <div className={adminStyles.formGroup}>
          <label className={adminStyles.formLabel}>Email</label>
          <input
            className={adminStyles.formInput}
            type="email"
            placeholder="faculty@example.com"
            value={f.email ?? ""}
            onChange={e => set("email", e.target.value)}
          />
        </div>
        <div className={adminStyles.formGroup}>
          <label className={adminStyles.formLabel}>Phone</label>
          <input
            className={adminStyles.formInput}
            type="tel"
            placeholder="+91 98765 43210"
            value={f.phone ?? ""}
            onChange={e => set("phone", e.target.value)}
          />
        </div>
      </div>

      {/* Bio */}
      <div className={adminStyles.formGroup}>
        <label className={adminStyles.formLabel}>Bio</label>
        <textarea
          className={adminStyles.formTextarea}
          rows={4}
          placeholder="Brief biography — experience, qualifications, teaching style…"
          value={f.bio ?? ""}
          onChange={e => set("bio", e.target.value)}
        />
      </div>

      {/* Active toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div
          onClick={() => set("isActive", !f.isActive)}
          style={{
            width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
            background: f.isActive ? "#16A34A" : "#D1D5DB",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute", top: 2, left: f.isActive ? 20 : 2,
            width: 18, height: 18, borderRadius: "50%", background: "#fff",
            transition: "left 0.18s", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </div>
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
          {f.isActive ? "Active" : "Inactive"} — {f.isActive ? "visible in course assignments" : "hidden from course assignments"}
        </span>
      </label>
    </div>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Faculty | null>(null);
  const [form, setForm]           = useState<Partial<Faculty>>({});
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null);

  const blank = (): Partial<Faculty> => ({
    name: "", designation: "", bio: "", avatar: "", email: "", phone: "", isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facultyApi.list(page, LIMIT);
      setFaculty(res.data.faculty ?? []);
      setTotal(res.data.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(blank()); setErr(""); setModalOpen(true); };
  const openEdit   = (f: Faculty) => { setEditing(f); setForm({ ...f }); setErr(""); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setErr("Name is required."); return; }
    setSaving(true); setErr("");
    try {
      if (editing) await facultyApi.update(editing._id, form);
      else         await facultyApi.create(form);
      closeModal(); load();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await facultyApi.remove(deleteTarget._id); setDeleteTarget(null); load(); }
    catch { /* ignore */ }
  };

  const activeCount   = faculty.filter(f => f.isActive).length;
  const inactiveCount = faculty.length - activeCount;
  const totalPages    = Math.ceil(total / LIMIT);

  return (
    <AdminGuard>
      <div className={adminStyles.shell}>
        <div className={adminStyles.inner}>
          <Sidebar />
          <div className={adminStyles.main}>
            <Topbar title="Faculty" />
            <div className={styles.page}>

              {/* Header */}
              <div className={styles.header}>
                <div className={styles.headerLeft}>
                  <h1>Faculty Members</h1>
                  <p>Manage instructors and assign them to courses</p>
                </div>
                <button className={adminStyles.btnPrimary} onClick={openCreate}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Faculty
                </button>
              </div>

              {/* Stats bar */}
              <div className={styles.statsBar}>
                <div className={styles.stat}>
                  <div className={`${styles.statIcon} ${styles.statIconTotal}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <div className={styles.statValue}>{total}</div>
                    <div className={styles.statLabel}>Total Faculty</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={`${styles.statIcon} ${styles.statIconActive}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <div className={styles.statValue}>{activeCount}</div>
                    <div className={styles.statLabel}>Active</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={`${styles.statIcon} ${styles.statIconInactive}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  </div>
                  <div>
                    <div className={styles.statValue}>{inactiveCount}</div>
                    <div className={styles.statLabel}>Inactive</div>
                  </div>
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className={styles.grid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.skeletonCard}>
                      <div style={{ position: "relative" }}>
                        <div className={styles.skeletonBanner} />
                        <div className={styles.skeletonCircle} />
                      </div>
                      <div className={styles.skeletonBody}>
                        <div className={styles.skeletonLine} style={{ width: "60%", marginTop: 8 }} />
                        <div className={styles.skeletonLine} style={{ width: "80%" }} />
                        <div className={styles.skeletonLine} style={{ width: "45%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !faculty.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIllustration}>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <p className={styles.emptyTitle}>No faculty yet</p>
                  <p className={styles.emptySub}>Add your first faculty member to assign them to courses.</p>
                  <button className={adminStyles.btnPrimary} onClick={openCreate}>+ Add Faculty</button>
                </div>
              ) : (
                <div className={styles.grid}>
                  {faculty.map((f, i) => (
                    <div key={f._id} className={styles.card}>

                      {/* Banner */}
                      <div className={styles.cardBanner} style={{ background: BANNERS[i % BANNERS.length] }}>
                        <div className={styles.avatarWrap}>
                          <div className={styles.avatar}>
                            {f.avatar
                              ? <img src={f.avatar} alt={f.name} />
                              : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BANNERS[i % BANNERS.length] }}>
                                  <span className={styles.avatarInitials}>{initials(f.name)}</span>
                                </div>
                              )
                            }
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className={styles.cardBody}>
                        <div className={styles.cardName}>{f.name}</div>
                        {f.designation && (
                          <div className={styles.cardDesig}>{f.designation}</div>
                        )}
                        <div className={styles.divider} />

                        {/* Contact */}
                        {(f.email || f.phone) && (
                          <div className={styles.contacts}>
                            {f.email && (
                              <div className={styles.contactRow}>
                                <span className={styles.contactIcon}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                  </svg>
                                </span>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>{f.email}</span>
                              </div>
                            )}
                            {f.phone && (
                              <div className={styles.contactRow}>
                                <span className={styles.contactIcon}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                                  </svg>
                                </span>
                                {f.phone}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bio */}
                        {f.bio && <p className={styles.bio}>{f.bio}</p>}
                      </div>

                      {/* Footer */}
                      <div className={styles.cardFooter}>
                        <span className={`${styles.statusBadge} ${f.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                          {f.isActive ? "Active" : "Inactive"}
                        </span>
                        <div className={styles.actionBtns}>
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnEdit}`}
                            onClick={() => openEdit(f)}
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDel}`}
                            onClick={() => setDeleteTarget(f)}
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={adminStyles.pagination} style={{ marginTop: 24, background: "#fff", borderRadius: 12, border: "1.5px solid #F0F0F5", padding: "12px 20px" }}>
                  <button className={adminStyles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>Page {page} of {totalPages}</span>
                  <button className={adminStyles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit Faculty Member" : "Add New Faculty"} width={620}>
        <FacultyForm f={form} setF={setForm} err={err} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
          <button className={adminStyles.btnOutline} onClick={closeModal}>Cancel</button>
          <button className={adminStyles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Faculty"}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" width={420}>
        <div className={styles.deleteWrap}>
          <div className={styles.deleteIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
          <p className={styles.deleteTitle}>Delete {deleteTarget?.name}?</p>
          <p className={styles.deleteText}>
            This faculty member will be permanently removed.<br/>
            Courses that reference them will lose this assignment.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button className={adminStyles.btnOutline} onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button
            style={{ padding: "9px 20px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            onClick={handleDelete}
          >
            Yes, Delete
          </button>
        </div>
      </Modal>
    </AdminGuard>
  );
}
