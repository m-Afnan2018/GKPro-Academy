"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { approvalsApi, type Approval } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // Reject modal
  const [rejectItem, setRejectItem]     = useState<Approval | null>(null);
  const [rejectNotes, setRejectNotes]   = useState("");
  const [rejecting, setRejecting]       = useState(false);
  const [rejectError, setRejectError]   = useState("");

  // Approve in-place loading
  const [approvingId, setApprovingId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await approvalsApi.pending(page, LIMIT);
      setApprovals(res.data.approvals ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await approvalsApi.approve(id);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectItem) return;
    setRejecting(true);
    setRejectError("");
    try {
      await approvalsApi.reject(rejectItem._id, rejectNotes);
      setRejectItem(null);
      setRejectNotes("");
      load();
    } catch (e: any) {
      setRejectError(e.message);
    } finally {
      setRejecting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const statusBadge = (s: string) =>
    s === "approved" ? "green" : s === "rejected" ? "red" : "yellow";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Approval Queue" />
          <div className={styles.content}>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.card}>
              {/* Header row */}
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    Pending approvals
                  </span>
                </div>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{total} items</span>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !approvals.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>✅</div>
                  <div className={styles.emptyText}>No pending approvals</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Type</th>
                      <th>Submitted By</th>
                      <th>Submitted At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map((a) => (
                      <tr key={a._id}>
                        <td>
                          <div className={styles.namePrimary} style={{ fontFamily: "monospace", fontSize: 12 }}>
                            {a.entityId}
                          </div>
                        </td>
                        <td>
                          <Badge variant="blue">{a.entityType}</Badge>
                        </td>
                        <td>
                          <div className={styles.nameCell}>
                            <div className={styles.nameAvatar}>
                              {a.submittedBy?.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <div className={styles.namePrimary}>{a.submittedBy?.name ?? "—"}</div>
                              <div className={styles.nameSecondary}>{a.submittedBy?.email ?? ""}</div>
                            </div>
                          </div>
                        </td>
                        <td>{new Date(a.submittedAt).toLocaleDateString()}</td>
                        <td>
                          <Badge variant={statusBadge(a.status) as any}>{a.status}</Badge>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={`${styles.btnGhost} ${styles.btnGhostBlue}`}
                              style={{ color: "#059669", borderColor: "#059669" }}
                              onClick={() => handleApprove(a._id)}
                              disabled={approvingId === a._id}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {approvingId === a._id ? "…" : "Approve"}
                            </button>
                            <button
                              className={`${styles.btnGhost} ${styles.btnGhostRed}`}
                              onClick={() => { setRejectItem(a); setRejectNotes(""); setRejectError(""); }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <span>Page {page} of {totalPages} · {total} items</span>
                  <div className={styles.pages}>
                    <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <button
                          key={pg}
                          className={`${styles.pageBtn} ${pg === page ? styles.pageBtnActive : ""}`}
                          onClick={() => setPage(pg)}
                        >{pg}</button>
                      );
                    })}
                    <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal open={!!rejectItem} onClose={() => setRejectItem(null)} title="Reject Submission" width={480}>
        {rejectItem && (
          <div className={styles.form}>
            {rejectError && <div className={styles.errorBanner}>{rejectError}</div>}
            <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>
              Rejecting <strong>{rejectItem.entityType}</strong> submitted by{" "}
              <strong>{rejectItem.submittedBy?.name ?? "unknown"}</strong>.
            </p>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Review notes (optional)</label>
              <textarea
                className={styles.formTextarea}
                rows={4}
                placeholder="Explain the reason for rejection…"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
              />
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setRejectItem(null)}>Cancel</button>
              <button
                className={styles.btnPrimary}
                style={{ background: "#DC2626" }}
                onClick={handleReject}
                disabled={rejecting}
              >
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
