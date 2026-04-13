"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { enrollmentsApi, type Enrollment, type User, type Course, type Payment } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 15;

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewItem, setViewItem] = useState<Enrollment | null>(null);
  const [cancelItem, setCancelItem] = useState<Enrollment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await enrollmentsApi.list(page, LIMIT);
      setEnrollments(res.data.enrollments ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    if (!cancelItem) return;
    setCancelling(true);
    try { await enrollmentsApi.cancel(cancelItem._id); setCancelItem(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setCancelling(false); }
  };

  const getStudent = (e: Enrollment) => typeof e.studentId === "object" ? e.studentId as User : null;
  const getCourse = (e: Enrollment) => typeof e.courseId === "object" ? e.courseId as Course : null;
  const getPayment = (e: Enrollment) => typeof e.paymentId === "object" ? e.paymentId as Payment : null;

  const filtered = enrollments.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const student = getStudent(e);
    const course = getCourse(e);
    return (
      student?.name?.toLowerCase().includes(s) ||
      student?.email?.toLowerCase().includes(s) ||
      course?.title?.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.ceil(total / LIMIT);
  const statusBadge = (s: string) => s === "active" ? "green" : s === "cancelled" ? "red" : "gray";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Enrollments" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg></span>
                    <input className={styles.searchInput} placeholder="Search student or course…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !filtered.length ? <div className={styles.empty}><div className={styles.emptyIcon}>🎓</div><div className={styles.emptyText}>No enrollments yet</div></div>
                  : (
                    <table className={styles.table}>
                      <thead>
                        <tr><th>Student</th><th>Course</th><th>Mode</th><th>Order ID</th><th>Payment</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {filtered.map((e) => {
                          const student = getStudent(e);
                          const course = getCourse(e);
                          const payment = getPayment(e);
                          return (
                            <tr key={e._id}>
                              <td>
                                <div className={styles.nameCell}>
                                  {
                                    student?.avatarUrl ? (
                                      <img src={student.avatarUrl} alt={student.name} className={styles.nameAvatar} />
                                    ) : (
                                      <div className={styles.nameAvatar}>{student?.name?.[0]?.toUpperCase() ?? "?"}</div>
                                    )
                                  }
                                  <div>
                                    <div className={styles.namePrimary}>{student?.name ?? "—"}</div>
                                    <div className={styles.nameSecondary}>{student?.email ?? ""}</div>
                                    {(student as any)?.phone && <div className={styles.nameSecondary}>{(student as any).phone}</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: 13 }}>{course?.title ?? "—"}</td>
                              <td style={{ fontSize: 12, color: "#6B7280" }}>{e.mode === "online" ? "Online" : "Recorded"}</td>
                              <td>
                                {payment?.orderId ? (
                                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#374151", background: "#F3F4F6", padding: "3px 8px", borderRadius: 5 }}>{payment.orderId}</span>
                                ) : <span style={{ fontSize: 12, color: "#9CA3AF" }}>—</span>}
                              </td>
                              <td>
                                {payment ? (
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>₹{payment.amount?.toLocaleString("en-IN")}</div>
                                    <div style={{ fontSize: 11, color: "#6B7280", textTransform: "capitalize" }}>{payment.method}</div>
                                  </div>
                                ) : <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>Free</span>}
                              </td>
                              <td style={{ fontSize: 12 }}>{new Date(e.enrolledAt).toLocaleDateString("en-IN")}</td>
                              <td><Badge variant={statusBadge(e.status) as any}>{e.status}</Badge></td>
                              <td>
                                <div className={styles.actions}>
                                  <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => setViewItem(e)}>View</button>
                                  {e.status === "active" && (
                                    <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setCancelItem(e)}>Cancel</button>
                                  )}
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

      {/* View student detail modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Enrollment Details" width={520}>
        {viewItem && (() => {
          const student = getStudent(viewItem);
          const course = getCourse(viewItem);
          const payment = getPayment(viewItem);
          return (
            <div className={styles.form}>
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Student</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["Name", student?.name], ["Email", student?.email], ["Phone", (student as any)?.phone || "—"], ["Role", student?.role || "Student"]].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Enrollment</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["Course", course?.title],
                    ["Mode", viewItem.mode === "online" ? "Online (Live)" : "Recorded"],
                    ["Enrolled At", viewItem.enrolledAt ? new Date(viewItem.enrolledAt).toLocaleDateString() : "—"],
                    ["Expires At", viewItem.expiresAt ? new Date(viewItem.expiresAt).toLocaleDateString() : "—"],
                    ["Status", viewItem.status],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
              {payment && (
                <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Payment</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      ["Order ID", payment.orderId ?? "—"],
                      ["Amount", `₹${payment.amount?.toLocaleString("en-IN")}`],
                      ["Method", payment.method],
                      ["Status", payment.status],
                      ["Paid At", payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-IN") : "—"],
                      ["Razorpay Ref", payment.razorpayPaymentId ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", fontFamily: k === "Order ID" || k === "Razorpay Ref" ? "monospace" : "inherit" }}>{v || "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Book & delivery */}
              {(viewItem.bookType && viewItem.bookType !== "none") && (
                <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "16px 20px", border: "1px solid #FDE68A" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Book Add-on</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>Type</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{viewItem.bookType === "ebook" ? "eBook (PDF)" : "Handbook (Physical)"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>Book Price Paid</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>₹{(viewItem.bookPricePaid ?? 0).toLocaleString("en-IN")}</div>
                    </div>
                    {viewItem.deliveryAddress && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>Delivery Address</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{viewItem.deliveryAddress}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <Modal open={!!cancelItem} onClose={() => setCancelItem(null)} title="Cancel Enrollment" width={400}>
        {cancelItem && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Cancel enrollment for <strong>{getStudent(cancelItem)?.name}</strong>? This cannot be undone.</p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setCancelItem(null)}>Keep Active</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleCancel} disabled={cancelling}>{cancelling ? "Cancelling…" : "Cancel Enrollment"}</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
