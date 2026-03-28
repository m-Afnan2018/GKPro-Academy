"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import { paymentsApi, type Payment, type User } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await paymentsApi.list(page, LIMIT);
      setPayments(res.data.payments ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = payments.filter((p) => {
    const name = typeof p.studentId === "object" ? (p.studentId as User).name : "";
    const q = search.toLowerCase();
    const matchSearch = !q || name.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(total / LIMIT);
  const statusBadge = (s: string) => s === "captured" ? "green" : s === "failed" || s === "refunded" ? "red" : "yellow";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Payments" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                      </svg>
                    </span>
                    <input className={styles.searchInput} placeholder="Search by student…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="captured">Captured</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
              </div>

              {loading ? <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
                : !filtered.length ? <div className={styles.empty}><div className={styles.emptyIcon}>💰</div><div className={styles.emptyText}>No payments found</div></div>
                : (
                  <table className={styles.table}>
                    <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid At</th></tr></thead>
                    <tbody>
                      {filtered.map((p) => {
                        const student = typeof p.studentId === "object" ? p.studentId as User : null;
                        return (
                          <tr key={p._id}>
                            <td>
                              <div className={styles.nameCell}>
                                <div className={styles.nameAvatar}>{student?.name?.[0]?.toUpperCase() ?? "?"}</div>
                                <div>
                                  <div className={styles.namePrimary}>{student?.name ?? "—"}</div>
                                  <div className={styles.nameSecondary}>{student?.email ?? ""}</div>
                                </div>
                              </div>
                            </td>
                            <td><strong>₹{p.amount.toLocaleString()}</strong> <span style={{ fontSize: 11, color: "#9CA3AF" }}>{p.currency}</span></td>
                            <td><Badge variant="blue">{p.method}</Badge></td>
                            <td><Badge variant={statusBadge(p.status) as any}>{p.status}</Badge></td>
                            <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <span>Page {page} of {totalPages} · {total} payments</span>
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
    </AdminGuard>
  );
}
