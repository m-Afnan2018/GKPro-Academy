"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStudentUser, clearStudentSession } from "@/lib/studentAuth";
import type { User } from "@/lib/api";
import styles from "./Navbar.module.css";

const navLinks = [
  { label: "Home",       href: "/" },
  { label: "Courses",    href: "/courses" },
  { label: "About us",  href: "/about" },
  { label: "Blog",       href: "/blogs" },
  { label: "Contact Us", href: "/contact" },
];

export default function Navbar() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    setUser(getStudentUser());
  }, []);

  const handleLogout = () => {
    clearStudentSession();
    setUser(null);
    setMenuOpen(false);
    router.push("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "";

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#D42B3A" />
              <path d="M8 12l8-4 8 4-8 4-8-4z" fill="white" opacity="0.9" />
              <path d="M8 12v6l8 4 8-4v-6" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7" />
            </svg>
          </div>
          <span className={styles.logoText}>GKPro</span>
        </Link>

        {/* Nav Links */}
        <ul className={styles.navLinks}>
          {navLinks.map((link) => (
            <li key={link.label} className={styles.navItem}>
              <Link href={link.href} className={styles.navLink}>{link.label}</Link>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className={styles.actions}>
          <button className={styles.searchBtn} aria-label="Search">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
          </button>

          {user ? (
            <div className={styles.avatarWrap}>
              <button className={styles.avatarBtn} onClick={() => setMenuOpen(v => !v)}>
                <span className={styles.avatarCircle}>{initials}</span>
                <span className={styles.avatarName}>{user.name.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropName}>{user.name}</div>
                  <div className={styles.dropEmail}>{user.email}</div>
                  <div className={styles.dropDivider} />
                  <Link href="/student/dashboard" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    My Dashboard
                  </Link>
                  <Link href="/student/courses" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    My Courses
                  </Link>
                  <Link href="/student/profile" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <div className={styles.dropDivider} />
                  <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/contact" className={styles.btnExpert}>Call to Expert</Link>
              <Link href="/login" className={styles.btnLogin}>Log In</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className={styles.hamburger} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
