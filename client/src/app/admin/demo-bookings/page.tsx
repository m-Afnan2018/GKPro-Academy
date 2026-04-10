"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { demoBookingsApi, type DemoBooking } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B", confirmed: "#3B82F6", completed: "#16A34A", cancelled: "#DC2626",
};

export default function DemoBookingsPage() {
  const [bookings, setBookings]   = useState<DemoBooking[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // View modal
  const [viewBooking, setViewBooking] = useState<DemoBooking | null>(null);

  // Edit modal
  const [editBooking, setEditBooking]   = useState<DemoBooking | null>(null);
  const [editStatus, setEditStatus]     = useState<DemoBooking["status"]>("pending");
  const [editNote, setEditNote]         = useState("");
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState("");

  // Delete modal
  const [deleteBooking, setDeleteBooking] = useState<DemoBooking | null>(null);
  const [deleting, setDeleting]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await demoBookingsApi.list(page, LIMIT);
      setBookings(res.data.bookings ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.phone.includes(q) || (b.email ?? "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openEdit = (b: DemoBooking) => {
    setEditBooking(b);
    setEditStatus(b.status);
    setEditNote(b.adminNote ?? "");
    setSaveError("");
  };

  const handleSave = async () => {
    if (!editBooking) return;
    setSaving(true); setSaveError("");
    try {
      await demoBookingsApi.update(editBooking._id, { status: editStatus, adminNote: editNote });
      setEditBooking(null);
      load();
    } catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteBooking) return;
    setDeleting(true);
    try { await demoBookingsApi.remove(deleteBooking._id); setDeleteBooking(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const statusBadge = (s: string) =>
    s === "completed" ? "green" : s === "confirmed" ? "blue" : s === "cancelled" ? "red" : "yellow";

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Stats
  const pending   = bookings.filter(b => b.status === "pending").length;
  const confirmed = bookings.filter(b => b.status === "confirmed").length;
  const completed = bookings.filter(b => b.status === "completed").length;

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Demo Bookings" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Bookings", value: total, color: "#6366F1", bg: "#EEF2FF" },
                { label: "Pending",        value: pending,   color: "#F59E0B", bg: "#FFFBEB" },
                { label: "Confirmed",      value: confirmed, color: "#3B82F6", bg: "#EFF6FF" },
                { label: "Completed",      value: completed, color: "#16A34A", bg: "#F0FDF4" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", border: "1.5px solid #F0F0F5", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                      </svg>
                    </span>
                    <input className={styles.searchInput} placeholder="Search name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total bookings</span>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !filtered.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🎯</div>
                  <div className={styles.emptyText}>No bookings found</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Contact</th>
                      <th>Course Interest</th>
                      <th>Preferred Slot</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(b => (
                      <tr key={b._id}>
                        <td>
                          <div className={styles.namePrimary}>{b.name}</div>
                          <div className={styles.nameSecondary}>{b.email ?? "—"}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13 }}>{b.phone}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: "#374151" }}>{b.course || "—"}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: "#374151" }}>
                            {b.preferredDate ? formatDate(b.preferredDate) : "—"}
                          </div>
                          {b.preferredTime && (
                            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{b.preferredTime}</div>
                          )}
                        </td>
                        <td>
                          <Badge variant={statusBadge(b.status) as any}>{b.status}</Badge>
                        </td>
                        <td style={{ fontSize: 12, color: "#9CA3AF" }}>
                          {new Date(b.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={`${styles.btnGhost} ${styles.btnGhostGreen}`}
                              onClick={() => setViewBooking(b)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              View
                            </button>
                            <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(b)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Update
                            </button>
                            <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteBooking(b)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <span>Page {page} of {totalPages} · {total} bookings</span>
                  <div className={styles.pages}>
                    <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return <button key={pg} className={`${styles.pageBtn} ${pg === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(pg)}>{pg}</button>;
                    })}
                    <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── View Modal ── */}
      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details" width={500}>
        {viewBooking && (
          <div>
            {/* Status pill */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>
                Submitted {new Date(viewBooking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: `${STATUS_COLORS[viewBooking.status]}18`, color: STATUS_COLORS[viewBooking.status] }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[viewBooking.status] }} />
                {viewBooking.status.charAt(0).toUpperCase() + viewBooking.status.slice(1)}
              </span>
            </div>

            {/* Details grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden", marginBottom: 20 }}>
              {[
                { label: "Full Name",       value: viewBooking.name },
                { label: "Email",           value: viewBooking.email },
                { label: "Phone",           value: viewBooking.phone },
                { label: "Course Interest", value: viewBooking.course || "—" },
                { label: "Preferred Date",  value: viewBooking.preferredDate ? new Date(viewBooking.preferredDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—" },
                { label: "Preferred Time",  value: viewBooking.preferredTime || "—" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", padding: "11px 16px", borderBottom: "1px solid #F0F0F5", gap: 12 }}>
                  <span style={{ width: 130, fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
              {viewBooking.message && (
                <div style={{ padding: "11px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Message</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{viewBooking.message}</div>
                </div>
              )}
            </div>

            {viewBooking.adminNote && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Admin Note</div>
                <div style={{ fontSize: 13, color: "#78350F" }}>{viewBooking.adminNote}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={styles.btnOutline} onClick={() => setViewBooking(null)}>Close</button>
              <button className={styles.btnPrimary} onClick={() => { setViewBooking(null); openEdit(viewBooking); }}>Update Status</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editBooking} onClose={() => setEditBooking(null)} title="Update Booking" width={440}>
        {editBooking && (
          <div className={styles.form}>
            {saveError && <div className={styles.errorBanner}>{saveError}</div>}
            <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 16px", fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: "#111827" }}>{editBooking.name}</span>
              <span style={{ color: "#6B7280", marginLeft: 8 }}>{editBooking.phone}</span>
              {editBooking.course && <span style={{ color: "#6B7280", marginLeft: 8 }}>· {editBooking.course}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={editStatus} onChange={e => setEditStatus(e.target.value as DemoBooking["status"])}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Admin Note (internal)</label>
              <textarea
                className={styles.formTextarea}
                rows={3}
                placeholder="Internal notes about this booking…"
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
              />
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setEditBooking(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={!!deleteBooking} onClose={() => setDeleteBooking(null)} title="Delete Booking" width={400}>
        {deleteBooking && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Delete booking from <strong>{deleteBooking.name}</strong>? This cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteBooking(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
