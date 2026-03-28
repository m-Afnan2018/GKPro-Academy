"use client";
import { useRouter } from "next/navigation";
import { clearSession, getUser } from "@/lib/auth";
import styles from "./Topbar.module.css";

interface Props { title: string; }

export default function Topbar({ title }: Props) {
  const router = useRouter();
  const user = typeof window !== "undefined" ? getUser() : null;

  const logout = () => {
    clearSession();
    router.push("/admin/login");
  };

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.right}>
        {/* User chip */}
        <div className={styles.userChip}>
          <div className={styles.avatar}>
            {user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name ?? "Admin"}</span>
            <span className={styles.userRole}>{user?.role ?? "admin"}</span>
          </div>
        </div>

        {/* Logout */}
        <button className={styles.logoutBtn} onClick={logout} aria-label="Logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}
