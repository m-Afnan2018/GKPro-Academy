"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import StatsCard from "@/components/admin/StatsCard/StatsCard";
import Badge from "@/components/admin/Badge/Badge";
import { dashboardApi, type Payment } from "@/lib/api";
import styles from "../admin.module.css";
import pageStyles from "./dashboard.module.css";

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  pendingApprovals: number;
  recentPayments: Payment[];
}

export default function DashboardPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    dashboardApi.stats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Dashboard" />
          <div className={styles.content}>

            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* Stats cards */}
            <div className={styles.statsGrid}>
              <StatsCard
                label="Total Users"
                value={loading ? "—" : stats?.totalUsers ?? 0}
                color="blue"
                sub="Registered accounts"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                  </svg>
                }
              />
              <StatsCard
                label="Total Courses"
                value={loading ? "—" : stats?.totalCourses ?? 0}
                color="green"
                sub="All statuses"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              />
              <StatsCard
                label="Enrollments"
                value={loading ? "—" : stats?.totalEnrollments ?? 0}
                color="yellow"
                sub="Active & expired"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              />
              <StatsCard
                label="Pending Approvals"
                value={loading ? "—" : stats?.pendingApprovals ?? 0}
                color="red"
                sub="Needs review"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
              />
            </div>

            {/* Recent Payments */}
            <div className={styles.card}>
              <div className={pageStyles.cardHeader}>
                <h2 className={pageStyles.cardTitle}>Recent Payments</h2>
                <a href="/admin/approvals" className={pageStyles.cardLink}>View all →</a>
              </div>

              {loading ? (
                <div className={pageStyles.loadingRows}>
                  {[1,2,3].map(i => <div key={i} className={pageStyles.skeletonRow} />)}
                </div>
              ) : !stats?.recentPayments?.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>💳</div>
                  <div className={styles.emptyText}>No payments yet</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPayments.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div className={styles.nameCell}>
                            <div className={styles.nameAvatar}>
                              {(p.studentId as any)?.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <div className={styles.namePrimary}>
                                {(p.studentId as any)?.name ?? "—"}
                              </div>
                              <div className={styles.nameSecondary}>
                                {(p.studentId as any)?.email ?? ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>₹{p.amount.toLocaleString()}</strong>
                          <span style={{ color: "#9CA3AF", fontSize: 11, marginLeft: 4 }}>
                            {p.currency}
                          </span>
                        </td>
                        <td style={{ textTransform: "capitalize" }}>{p.method}</td>
                        <td>
                          <Badge variant={
                            p.status === "captured" ? "green"
                            : p.status === "pending" ? "yellow"
                            : p.status === "refunded" ? "blue"
                            : "red"
                          }>
                            {p.status}
                          </Badge>
                        </td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick links */}
            <div className={pageStyles.quickLinks}>
              {[
                { label: "Manage Users",     href: "/admin/users",     color: "#DBEAFE", text: "#1D4ED8" },
                { label: "Manage Courses",   href: "/admin/courses",   color: "#DCFCE7", text: "#166534" },
                { label: "Review Approvals", href: "/admin/approvals", color: "#FEE2E2", text: "#991B1B" },
              ].map((l) => (
                <a key={l.label} href={l.href}
                  className={pageStyles.quickLink}
                  style={{ background: l.color, color: l.text }}
                >
                  {l.label} →
                </a>
              ))}
            </div>

          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
