"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStudentUser, clearStudentSession } from "@/lib/studentAuth";
import styles from "./StudentNav.module.css";

export default function StudentNav() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getStudentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearStudentSession();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  const navLinks = [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "My Courses", href: "/student/courses" },
    { label: "Purchases", href: "/student/purchases" },
    { label: "Profile", href: "/student/profile" },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#D42B3A" />
            <path d="M8 12l8-4 8 4-8 4-8-4z" fill="white" opacity="0.9" />
            <path d="M8 12v6l8 4 8-4v-6" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7" />
          </svg>
          <span className={styles.logoText}>GKPro</span>
        </Link>

        <ul className={styles.links}>
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={`${styles.link} ${pathname.startsWith(l.href) ? styles.active : ""}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.right}>
          <Link href="/courses" className={styles.browseCta}>Browse Courses</Link>
          <div className={styles.avatarWrap}>
            <button className={styles.avatar} onClick={() => setMenuOpen(v => !v)}>
              {initials}
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropName}>{user?.name}</div>
                <div className={styles.dropEmail}>{user?.email}</div>
                <div className={styles.divider} />
                <Link href="/student/profile" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  My Profile
                </Link>
                <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
                    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
