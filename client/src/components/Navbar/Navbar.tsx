"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStudentUser, clearStudentSession } from "@/lib/studentAuth";
import type { User, Category, SubCategory } from "@/lib/api";
import styles from "./Navbar.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [subcats, setSubcats]         = useState<SubCategory[]>([]);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [hoveredCat, setHoveredCat]   = useState<Category | null>(null);
  const coursesRef                    = useRef<HTMLLIElement>(null);
  const closeTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUser(getStudentUser());
    // fetch categories + all subcategories in parallel
    Promise.all([
      fetch(`${BASE}/categories?limit=50`).then(r => r.json()),
      fetch(`${BASE}/subcategories?limit=100`).then(r => r.json()),
    ]).then(([cj, sj]) => {
      if (cj.success) setCategories(cj.data.categories ?? []);
      if (sj.success) setSubcats(sj.data.subcategories ?? []);
    }).catch(() => {});
  }, []);

  /* subcats for a given category id */
  const subcatsFor = (catId: string) =>
    subcats.filter(s => {
      if (!s.categoryId) return false;
      return typeof s.categoryId === "object"
        ? (s.categoryId as Category)._id === catId
        : s.categoryId === catId;
    });

  /* hover helpers — keep dropdown open while mouse is inside */
  const openDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCoursesOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => {
      setCoursesOpen(false);
      setHoveredCat(null);
    }, 150);
  };

  const handleLogout = () => {
    clearStudentSession();
    setUser(null);
    setMenuOpen(false);
    router.push("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "";

  const close = () => { setCoursesOpen(false); setHoveredCat(null); };

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
          <li className={styles.navItem}>
            <Link href="/" className={styles.navLink}>Home</Link>
          </li>

          {/* Courses mega-menu */}
          <li
            className={styles.navItem}
            ref={coursesRef}
            onMouseEnter={openDropdown}
            onMouseLeave={scheduleClose}
          >
            <Link
              href="/courses"
              className={`${styles.navLink} ${coursesOpen ? styles.navLinkActive : ""}`}
            >
              Courses
              <svg
                width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transition: "transform 0.2s", transform: coursesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </Link>

            {coursesOpen && (
              <div
                className={styles.megaMenu}
                onMouseEnter={openDropdown}
                onMouseLeave={scheduleClose}
              >
                {/* Left panel — categories */}
                <div className={styles.megaLeft}>
                  <p className={styles.megaHeading}>Categories</p>
                  {categories.map(cat => (
                    <div
                      key={cat._id}
                      className={`${styles.megaCatRow} ${hoveredCat?._id === cat._id ? styles.megaCatRowActive : ""}`}
                      onMouseEnter={() => setHoveredCat(cat)}
                    >
                      <Link
                        href={`/category/${cat.slug}`}
                        className={styles.megaCatLink}
                        onClick={close}
                      >
                        {cat.name}
                        {cat.isComingSoon && <span className={styles.soonBadge}>Soon</span>}
                      </Link>
                      {subcatsFor(cat._id).length > 0 && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </div>
                  ))}
                  <div className={styles.megaDivider} />
                  <Link href="/courses" className={styles.megaAllLink} onClick={close}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    All Courses
                  </Link>
                </div>

                {/* Right panel — only shown when hovered category has subcats */}
                {hoveredCat && subcatsFor(hoveredCat._id).length > 0 && (
                  <div className={styles.megaRight}>
                    <p className={styles.megaHeading}>{hoveredCat.name}</p>
                    <div className={styles.megaSubGrid}>
                      {subcatsFor(hoveredCat._id).map(sub => (
                        <Link
                          key={sub._id}
                          href={`/category/${hoveredCat.slug}?sub=${sub.slug}`}
                          className={styles.megaSubItem}
                          onClick={close}
                        >
                          <div className={styles.megaSubIcon}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                          </div>
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </li>

          <li className={styles.navItem}>
            <Link href="/about" className={styles.navLink}>About us</Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/blogs" className={styles.navLink}>Blog</Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/contact" className={styles.navLink}>Contact Us</Link>
          </li>
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
                  <Link href="/student/dashboard" className={styles.dropItem} onClick={() => setMenuOpen(false)}>My Dashboard</Link>
                  <Link href="/student/courses"   className={styles.dropItem} onClick={() => setMenuOpen(false)}>My Courses</Link>
                  <Link href="/student/profile"   className={styles.dropItem} onClick={() => setMenuOpen(false)}>Profile</Link>
                  <div className={styles.dropDivider} />
                  <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/contact" className={styles.btnExpert}>Call to Expert</Link>
              <Link href="/login"   className={styles.btnLogin}>Log In</Link>
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
