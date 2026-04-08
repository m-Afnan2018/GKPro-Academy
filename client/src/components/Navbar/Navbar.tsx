"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from 'next/image'
import { useRouter } from "next/navigation";
import { getStudentUser, clearStudentSession } from "@/lib/studentAuth";
import type { User, Category, SubCategory } from "@/lib/api";
import styles from "./Navbar.module.css";
import commonImages from "@/constants/commonImages";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface QuickResult {
  courses: { _id: string; title: string; slug: string; thumbnailUrl?: string; onlinePrice?: number; recordedPrice?: number }[];
  blogs: { _id: string; title: string; slug: string; imageUrl?: string }[];
  categories: { _id: string; name: string; slug: string }[];
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcats, setSubcats] = useState<SubCategory[]>([]);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<Category | null>(null);
  const coursesRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [quickResults, setQuickResults] = useState<QuickResult | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setUser(getStudentUser());
    Promise.all([
      fetch(`${BASE}/categories?limit=50`).then(r => r.json()),
      fetch(`${BASE}/subcategories?limit=100`).then(r => r.json()),
    ]).then(([cj, sj]) => {
      if (cj.success) setCategories(cj.data.categories ?? []);
      if (sj.success) setSubcats(sj.data.subcategories ?? []);
    }).catch(() => { });
  }, []);

  /* close search and mobile menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setQuickResults(null);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* focus input when search opens */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!val.trim()) { setQuickResults(null); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${BASE}/search?q=${encodeURIComponent(val.trim())}&type=all&limit=3`).then(r => r.json());
        setQuickResults(res.data ?? null);
      } catch { }
      finally { setSearching(false); }
    }, 350);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    setSearchOpen(false);
    setQuickResults(null);
    setSearchInput("");
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuickResults(null);
    setSearchInput("");
  };

  const hasQuick = quickResults && (
    quickResults.courses.length > 0 ||
    quickResults.blogs.length > 0 ||
    quickResults.categories.length > 0
  );

  /* courses mega-menu helpers */
  const subcatsFor = (catId: string) =>
    subcats.filter(s => {
      if (!s.categoryId) return false;
      return typeof s.categoryId === "object"
        ? (s.categoryId as Category)._id === catId
        : s.categoryId === catId;
    });

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
    <nav className={styles.navbar} ref={navRef}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image src={commonImages.logo} width={100} height={100} alt="GKPro Academy" />
        </Link>

        {/* Nav Links */}
        <ul className={styles.navLinks}>
          <li className={styles.navItem}>
            <Link href="/" className={styles.navLink}>Home</Link>
          </li>

          {/* Courses mega-menu */}
          <li className={styles.navItem} ref={coursesRef} onMouseEnter={openDropdown} onMouseLeave={scheduleClose}>
            <Link href="/courses" className={`${styles.navLink} ${coursesOpen ? styles.navLinkActive : ""}`}>
              Courses
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transition: "transform 0.2s", transform: coursesOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </Link>

            {coursesOpen && (
              <div className={styles.megaMenu} onMouseEnter={openDropdown} onMouseLeave={scheduleClose}>
                <div className={styles.megaLeft}>
                  <p className={styles.megaHeading}>Categories</p>
                  {categories.map(cat => (
                    <div key={cat._id}
                      className={`${styles.megaCatRow} ${hoveredCat?._id === cat._id ? styles.megaCatRowActive : ""}`}
                      onMouseEnter={() => setHoveredCat(cat)}
                    >
                      <Link href={`/category/${cat.slug}`} className={styles.megaCatLink} onClick={close}>
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
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    All Courses
                  </Link>
                </div>
                {hoveredCat && subcatsFor(hoveredCat._id).length > 0 && (
                  <div className={styles.megaRight}>
                    <p className={styles.megaHeading}>{hoveredCat.name}</p>
                    <div className={styles.megaSubGrid}>
                      {subcatsFor(hoveredCat._id).map(sub => (
                        <Link key={sub._id} href={`/category/${hoveredCat.slug}?sub=${sub.slug}`} className={styles.megaSubItem} onClick={close}>
                          <div className={styles.megaSubIcon}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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

          <li className={styles.navItem}><Link href="/about" className={styles.navLink}>About us</Link></li>
          <li className={styles.navItem}><Link href="/blogs" className={styles.navLink}>Blog</Link></li>
          <li className={styles.navItem}><Link href="/contact" className={styles.navLink}>Contact Us</Link></li>
        </ul>

        {/* Right Actions */}
        <div className={styles.actions}>
          {/* Search button / inline bar */}
          <div className={styles.searchWrap} ref={searchRef}>
            {searchOpen ? (
              <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={styles.searchBarIcon}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchInputRef}
                  className={styles.searchBarInput}
                  placeholder="Search courses, blogs…"
                  value={searchInput}
                  onChange={e => handleSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Escape" && closeSearch()}
                />
                <button type="button" className={styles.searchBarClose} onClick={closeSearch}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Quick results dropdown */}
                {searchInput.trim() && (
                  <div className={styles.quickDrop}>
                    {searching ? (
                      <div className={styles.quickLoading}>
                        <div className={styles.quickSpinner} />
                        <span>Searching…</span>
                      </div>
                    ) : !hasQuick ? (
                      <div className={styles.quickEmpty}>No results for &ldquo;{searchInput}&rdquo;</div>
                    ) : (
                      <>
                        {quickResults!.courses.length > 0 && (
                          <div className={styles.quickSection}>
                            <div className={styles.quickSectionTitle}>Courses</div>
                            {quickResults!.courses.map(c => (
                              <Link key={c._id} href={`/courses/${c.slug}`} className={styles.quickItem} onClick={closeSearch}>
                                <div className={styles.quickItemIcon}>
                                  {c.thumbnailUrl
                                    ? <img src={c.thumbnailUrl} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                                  }
                                </div>
                                <div className={styles.quickItemBody}>
                                  <span className={styles.quickItemTitle}>{c.title}</span>
                                  {(c.onlinePrice || c.recordedPrice) && (
                                    <span className={styles.quickItemSub}>
                                      ₹{(c.onlinePrice || c.recordedPrice)!.toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}

                        {quickResults!.blogs.length > 0 && (
                          <div className={styles.quickSection}>
                            <div className={styles.quickSectionTitle}>Blogs</div>
                            {quickResults!.blogs.map(b => (
                              <Link key={b._id} href={`/blogs/${b.slug}`} className={styles.quickItem} onClick={closeSearch}>
                                <div className={styles.quickItemIcon}>
                                  {b.imageUrl
                                    ? <img src={b.imageUrl} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                  }
                                </div>
                                <span className={styles.quickItemTitle}>{b.title}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {quickResults!.categories.length > 0 && (
                          <div className={styles.quickSection}>
                            <div className={styles.quickSectionTitle}>Categories</div>
                            {quickResults!.categories.map(c => (
                              <Link key={c._id} href={`/category/${c.slug}`} className={styles.quickItem} onClick={closeSearch}>
                                <div className={styles.quickItemIcon}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" /></svg>
                                </div>
                                <span className={styles.quickItemTitle}>{c.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        <button type="submit" className={styles.quickSeeAll}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                          </svg>
                          See all results for &ldquo;{searchInput}&rdquo;
                        </button>
                      </>
                    )}
                  </div>
                )}
              </form>
            ) : (
              <button className={styles.searchBtn} aria-label="Search" onClick={() => setSearchOpen(true)}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

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
                  <Link href="/student/courses" className={styles.dropItem} onClick={() => setMenuOpen(false)}>My Courses</Link>
                  <Link href="/student/profile" className={styles.dropItem} onClick={() => setMenuOpen(false)}>Profile</Link>
                  <div className={styles.dropDivider} />
                  <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>Sign out</button>
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

        <button
          className={styles.hamburger}
          aria-label="Menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <>
              <span /><span /><span />
            </>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <ul className={styles.mobileNavLinks}>
            <li className={styles.mobileNavItem}>
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            </li>
            <li className={styles.mobileNavItem}>
              <div className={styles.mobileNavHeading}>Courses</div>
              <ul className={styles.mobileSubList}>
                <li className={styles.mobileSubItem}>
                  <Link href="/courses" onClick={() => setMobileMenuOpen(false)}>All Courses</Link>
                </li>
                {categories.map((cat) => {
                  const subs = subcatsFor(cat._id);
                  const isExpanded = expandedCat === cat._id;
                  return (
                  <li key={cat._id} className={styles.mobileSubItem}>
                    <div className={styles.mobileCatRow}>
                      <Link href={`/category/${cat.slug}`} onClick={() => setMobileMenuOpen(false)} className={styles.mobileCatLink}>
                        {cat.name}
                      </Link>
                      {subs.length > 0 && (
                        <button className={styles.mobileCatToggle} onClick={(e) => { e.preventDefault(); setExpandedCat(isExpanded ? null : cat._id); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {subs.length > 0 && (
                      <div className={`${styles.mobileNestedWrap} ${isExpanded ? styles.expanded : ""}`}>
                        <div className={styles.mobileNestedInner}>
                          <ul className={styles.mobileNestedList}>
                            {subs.map(sub => (
                              <li key={sub._id} className={styles.mobileNestedItem}>
                                <Link href={`/category/${cat.slug}?sub=${sub.slug}`} onClick={() => setMobileMenuOpen(false)}>
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </li>
                )})}
              </ul>
            </li>
            <li className={styles.mobileNavItem}>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About us</Link>
            </li>
            <li className={styles.mobileNavItem}>
              <Link href="/blogs" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            </li>
            <li className={styles.mobileNavItem}>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
            </li>
            {!user && (
              <li className={styles.mobileNavItem}>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--primary)" }}>
                  Log In
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
