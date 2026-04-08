"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { usersApi, enrollmentsApi, coursesApi, type User, type Enrollment, type Course } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 15;

export default function StudentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollMap, setEnrollMap] = useState<Record<string, Enrollment[]>>({});
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewEnrolls, setViewEnrolls] = useState<Enrollment[]>([]);

  // Enroll modal state
  const [enrollTarget, setEnrollTarget] = useState<User | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrollCourse, setEnrollCourse] = useState("");
  const [enrollMode, setEnrollMode] = useState<"online" | "recorded">("online");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await usersApi.list(page, LIMIT);
      // Filter to students only
      const allUsers = res.data.users ?? [];
      const students = allUsers.filter((u) => u.role === "student");
      setUsers(students);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  // Fetch enrollments for all loaded students
  useEffect(() => {
    if (!users.length) return;
    const tk = typeof window !== "undefined" ? localStorage.getItem("gkpro_admin_token") : null;
    if (!tk) return;
    // We fetch all enrollments and group by studentId
    fetch(`${BASE}/enrollments?limit=500`, { headers: { Authorization: `Bearer ${tk}` } })
      .then((r) => r.json())
      .then((json) => {
        const all: Enrollment[] = json?.data?.enrollments ?? [];
        const map: Record<string, Enrollment[]> = {};
        for (const e of all) {
          const sid = typeof e.studentId === "object" ? (e.studentId as User)._id : e.studentId as string;
          if (!map[sid]) map[sid] = [];
          map[sid].push(e);
        }
        setEnrollMap(map);
      })
      .catch(() => { });
  }, [users]);

  useEffect(() => {
    coursesApi.list(1, 200).then((r) => setAllCourses(r.data.courses ?? [])).catch(() => { });
  }, []);

  const openView = (u: User) => {
    setViewUser(u);
    setViewEnrolls(enrollMap[u._id] ?? []);
  };

  const openEnroll = (u: User) => {
    setEnrollTarget(u);
    setEnrollCourse("");
    setEnrollMode("online");
    setEnrollError("");
    setEnrollSuccess("");
  };

  const handleEnroll = async () => {
    if (!enrollTarget || !enrollCourse) { setEnrollError("Please select a course."); return; }
    setEnrolling(true); setEnrollError(""); setEnrollSuccess("");
    try {
      await enrollmentsApi.adminCreate(enrollTarget._id, enrollCourse, enrollMode);
      setEnrollSuccess(`${enrollTarget.name} has been enrolled successfully.`);
      // Refresh enroll map
      const tk = typeof window !== "undefined" ? localStorage.getItem("gkpro_admin_token") : null;
      if (tk) {
        const json = await fetch(`${BASE}/enrollments?limit=500`, { headers: { Authorization: `Bearer ${tk}` } }).then(r => r.json());
        const all: Enrollment[] = json?.data?.enrollments ?? [];
        const map: Record<string, Enrollment[]> = {};
        for (const e of all) {
          const sid = typeof e.studentId === "object" ? (e.studentId as User)._id : e.studentId as string;
          if (!map[sid]) map[sid] = [];
          map[sid].push(e);
        }
        setEnrollMap(map);
      }
    } catch (e: any) {
      setEnrollError(e.message ?? "Enrollment failed.");
    } finally {
      setEnrolling(false);
    }
  };

  // Determine available modes for selected course
  const selectedCourseObj = allCourses.find((c) => c._id === enrollCourse);
  const modeOptions: { value: "online" | "recorded"; label: string }[] = [];
  if (selectedCourseObj?.onlinePrice) modeOptions.push({ value: "online", label: `Online — ₹${selectedCourseObj.onlinePrice.toLocaleString("en-IN")}` });
  if (selectedCourseObj?.recordedPrice) modeOptions.push({ value: "recorded", label: `Recorded — ₹${selectedCourseObj.recordedPrice.toLocaleString("en-IN")}` });

  const filtered = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.phone ?? "").includes(s);
  });

  const totalPages = Math.ceil(total / LIMIT);

  const getCourseTitle = (e: Enrollment) => {
    const c = typeof e.courseId === "object" ? e.courseId as Course : null;
    return c?.title ?? "—";
  };

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Students" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg></span>
                    <input className={styles.searchInput} placeholder="Search by name, email or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !filtered.length ? <div className={styles.empty}><div className={styles.emptyIcon}>👨‍🎓</div><div className={styles.emptyText}>No students yet</div></div>
                  : (
                    <table className={styles.table}>
                      <thead>
                        <tr><th>Student</th><th>Phone</th><th>Enrolled Courses</th><th>Active</th><th>Joined</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {filtered.map((u) => {
                          const enrolls = enrollMap[u._id] ?? [];
                          const active = enrolls.filter((e) => e.status === "active").length;
                          return (
                            <tr key={u._id}>
                              <td>
                                <div className={styles.nameCell}>
                                  {
                                    u.avatarUrl ? (
                                      <img src={u.avatarUrl} alt={u.name} className={styles.nameAvatar} />
                                    ) : (
                                      <div className={styles.nameAvatar}>{u.name[0]?.toUpperCase()}</div>
                                    )
                                  }
                                  <div>
                                    <div className={styles.namePrimary}>{u.name}</div>
                                    <div className={styles.nameSecondary}>{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: 13, color: "#6B7280" }}>{u.phone || "—"}</td>
                              <td style={{ fontSize: 13 }}>{enrolls.length}</td>
                              <td>
                                {active > 0
                                  ? <Badge variant="green">{active} Active</Badge>
                                  : <Badge variant="gray">None</Badge>}
                              </td>
                              <td style={{ fontSize: 12, color: "#6B7280" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td>
                                <div className={styles.actions}>
                                  <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openView(u)}>View Details</button>
                                  <button className={`${styles.btnGhost} ${styles.btnGhostGreen}`} onClick={() => openEnroll(u)}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                    Enroll
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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

      {/* Student detail modal */}
      {viewUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewUser(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Student Details</h3>
              <button onClick={() => setViewUser(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6B7280" }}>×</button>
            </div>

            {/* Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#F9FAFB", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                {(viewUser as any).avatarUrl
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={(viewUser as any).avatarUrl} alt={viewUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : viewUser.name[0]?.toUpperCase()
                }
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{viewUser.name}</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>{viewUser.email}</div>
                {viewUser.phone && <div style={{ fontSize: 13, color: "#6B7280" }}>{viewUser.phone}</div>}
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Joined {new Date(viewUser.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Enrollments */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
              Enrolled Courses ({viewEnrolls.length})
            </div>
            {viewEnrolls.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "20px 0" }}>No enrollments yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {viewEnrolls.map((e) => (
                  <div key={e._id} style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{getCourseTitle(e)}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                        {e.mode === "online" ? "Online" : "Recorded"}
                        {" · "}Enrolled {new Date(e.enrolledAt).toLocaleDateString()}
                        {e.expiresAt && ` · Expires ${new Date(e.expiresAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50,
                      background: e.status === "active" ? "#D1FAE5" : "#F3F4F6",
                      color: e.status === "active" ? "#065F46" : "#6B7280"
                    }}>{e.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Enroll student modal */}
      <Modal open={!!enrollTarget} onClose={() => setEnrollTarget(null)} title="Enroll Student in Course" width={480}>
        {enrollTarget && (
          <div className={styles.form}>
            {/* Student info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F9FAFB", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                {(enrollTarget as any).avatarUrl
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={(enrollTarget as any).avatarUrl} alt={enrollTarget.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : enrollTarget.name[0]?.toUpperCase()
                }
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{enrollTarget.name}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{enrollTarget.email}</div>
              </div>
            </div>

            {enrollSuccess ? (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", borderRadius: 8, padding: "14px 16px", fontSize: 13, fontWeight: 500 }}>
                {enrollSuccess}
              </div>
            ) : (
              <>
                {enrollError && <div className={styles.errorBanner}>{enrollError}</div>}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Course *</label>
                  <select
                    className={styles.formSelect}
                    value={enrollCourse}
                    onChange={(e) => { setEnrollCourse(e.target.value); setEnrollMode("online"); setEnrollError(""); }}
                  >
                    <option value="">— Select a course —</option>
                    {allCourses.filter(c => c.status === "published").map((c) => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {enrollCourse && modeOptions.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mode *</label>
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      {modeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEnrollMode(opt.value)}
                          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `2px solid ${enrollMode === opt.value ? "#D42B3A" : "#E5E7EB"}`, background: enrollMode === opt.value ? "#FFF1F2" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: enrollMode === opt.value ? "#D42B3A" : "#374151", transition: "all 0.15s" }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {enrollCourse && modeOptions.length === 0 && (
                  <div style={{ fontSize: 13, color: "#DC2626", background: "#FEF2F2", padding: "10px 14px", borderRadius: 8 }}>
                    This course has no pricing set up yet.
                  </div>
                )}
              </>
            )}

            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setEnrollTarget(null)}>
                {enrollSuccess ? "Close" : "Cancel"}
              </button>
              {!enrollSuccess && (
                <button
                  className={styles.btnPrimary}
                  onClick={handleEnroll}
                  disabled={enrolling || !enrollCourse || modeOptions.length === 0}
                >
                  {enrolling ? "Enrolling…" : "Enroll Student"}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
