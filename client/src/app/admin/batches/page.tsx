"use client";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import styles from "../admin.module.css";

export default function BatchesPage() {
  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Batches" />
          <div className={styles.content}>
            <div className={styles.card} style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
              Batches have been removed. Courses now have Online and Recorded pricing options directly.
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
