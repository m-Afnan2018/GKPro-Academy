"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { demoBookingsApi, type DemoBooking, type Course } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

export default function DemoBookingsPage() {
  const [bookings, setBookings]   = useState<DemoBooking[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [editBooking, setEditBooking] = useState<DemoBooking | null>(null);
  const [editStatus, setEditStatus]   = useState<DemoBooking["status"]>("pending");
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState("");

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
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.phone.includes(q);
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openEdit = (b: DemoBooking) => { setEditBooking(b); setEditStatus(b.status); setSaveError(""); };

  const handleSave = async () => {
    if (!editBooking) return;
    setSaving(true); setSaveError("");
    try { await demoBookingsApi.update(editBooking._id, { status: editStatus }); setEditBooking(null); load(); }
    catch (e: any) { setSaveError(e.message); }
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
  const statusBadge = (s: string) => s === "completed" ? "green" : s === "confirmed" ? "blue" : s === "cancelled" ? "red" : "yellow";
  const courseName = (b: DemoBooking) => {
    if (!b.courseId) return "—";
    if (typeof b.courseId === "object") return (b.courseId as Course).title;
    return "—";
  };

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Demo Bookings" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg></span>
                    <input className={styles.searchInput} placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option><option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !filtered.length ? <div className={styles.empty}><div className={styles.emptyIcon}>🎯</div><div className={styles.emptyText}>No bookings found</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Name</th><th>Phone</th><th>Course</th><th>Slot</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filtered.map((b) => (
                        <tr key={b._id}>
                          <td className={styles.namePrimary}>{b.name}</td>
                          <td>{b.phone}</td>
                          <td style={{ fontSize: 12, color: "#6B7280" }}>{courseName(b)}</td>
                          <td>{new Date(b.slotTime).toLocaleString()}</td>
                          <td><Badge variant={statusBadge(b.status) as any}>{b.status}</Badge></td>
                          <td>
                            <div className={styles.actions}>
                              <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(b)}>Update</button>
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteBooking(b)}>Delete</button>
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

      <Modal open={!!editBooking} onClose={() => setEditBooking(null)} title="Update Booking" width={400}>
        {editBooking && (
          <div className={styles.form}>
            {saveError && <div className={styles.errorBanner}>{saveError}</div>}
            <p style={{ fontSize: 13, color: "#6B7280" }}><strong>{editBooking.name}</strong> · {editBooking.phone}</p>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={editStatus} onChange={(e) => setEditStatus(e.target.value as DemoBooking["status"])}>
                <option value="pending">Pending</option><option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setEditBooking(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Update"}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteBooking} onClose={() => setDeleteBooking(null)} title="Delete Booking" width={400}>
        {deleteBooking && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>Delete booking from <strong>{deleteBooking.name}</strong>? This cannot be undone.</p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteBooking(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
