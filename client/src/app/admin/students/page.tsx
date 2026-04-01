"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import { usersApi, type User, type Enrollment, type Course } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 15;

export default function StudentsPage() {
  const [users, setUsers]           = useState<User[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [enrollMap, setEnrollMap]   = useState<Record<string, Enrollment[]>>({});
  const [viewUser, setViewUser]     = useState<User | null>(null);
  const [viewEnrolls, setViewEnrolls] = useState<Enrollment[]>([]);

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
      .catch(() => {});
  }, [users]);

  const openView = (u: User) => {
    setViewUser(u);
    setViewEnrolls(enrollMap[u._id] ?? []);
  };

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
                    <span className={styles.searchIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg></span>
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
                        const active  = enrolls.filter((e) => e.status === "active").length;
                        return (
                          <tr key={u._id}>
                            <td>
                              <div className={styles.nameCell}>
                                <div className={styles.nameAvatar}>{u.name[0]?.toUpperCase()}</div>
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
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openView(u)}>View Details</button>
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
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {viewUser.name[0]?.toUpperCase()}
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
    </AdminGuard>
  );
}
