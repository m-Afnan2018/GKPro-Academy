"use client";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import styles from "../admin.module.css";

export default function PlansPage() {
  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Plans" />
          <div className={styles.content}>
            <div className={styles.card} style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
              Plans have been removed. Course pricing is now set directly on each course (Online / Recorded).
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
