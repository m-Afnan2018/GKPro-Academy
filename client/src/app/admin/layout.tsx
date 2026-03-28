import type { Metadata } from "next";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "GKPro Admin Panel",
  description: "GKPro Academy administration dashboard",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
