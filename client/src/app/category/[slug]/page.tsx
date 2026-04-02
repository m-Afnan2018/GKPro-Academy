"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import type { Category, SubCategory, Course } from "@/lib/api";
import styles from "./category.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const LIMIT = 9;

/* ── helpers ─────────────────────────────────────── */
function getPrice(course: Course): {
    sale: number | null;
    original: number | null;
} {
    // Use the lower price to display as the lead price
    const online = course.onlinePrice ?? null;
    const recorded = course.recordedPrice ?? null;
    if (online && recorded)
        return { sale: Math.min(online, recorded), original: null };
    if (online)
        return { sale: online, original: course.onlineOriginalPrice ?? null };
    if (recorded)
        return {
            sale: recorded,
            original: course.recordedOriginalPrice ?? null,
        };
    return { sale: null, original: null };
}

function discount(sale: number, original: number): number {
    return Math.round((1 - sale / original) * 100);
}

function ModeBadge({ course }: { course: Course }) {
    const modes =
        course.availableModes ??
        (course.onlinePrice && course.recordedPrice
            ? "both"
            : course.onlinePrice
              ? "online"
              : "recorded");
    if (modes === "both")
        return (
            <span className={`${styles.modeBadge} ${styles.badgeBoth}`}>
                Online &amp; Recorded
            </span>
        );
    if (modes === "online")
        return (
            <span className={`${styles.modeBadge} ${styles.badgeOnline}`}>
                Online
            </span>
        );
    if (modes === "recorded")
        return (
            <span className={`${styles.modeBadge} ${styles.badgeRecorded}`}>
                Recorded
            </span>
        );
    return null;
}

/* ── Page ────────────────────────────────────────── */
export default function CategoryPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params?.slug as string;
    const subSlug = searchParams?.get("sub") ?? null; // ?sub=foundation-accounting

    const [category, setCategory] = useState<Category | null>(null);
    const [subcats, setSubcats] = useState<SubCategory[]>([]);
    const [activeSubcat, setActiveSubcat] = useState<SubCategory | null>(null);
    const [didAutoSelect, setDidAutoSelect] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [catLoading, setCatLoading] = useState(true);
    const [error, setError] = useState("");

    /* fetch category by slug */
    useEffect(() => {
        if (!slug) return;
        setCatLoading(true);
        fetch(`${BASE}/categories/slug/${slug}`)
            .then((r) => r.json())
            .then((j) => {
                if (!j.success) {
                    setError("Category not found.");
                    return;
                }
                setCategory(j.data);
            })
            .catch(() => setError("Failed to load category."))
            .finally(() => setCatLoading(false));
    }, [slug]);

    /* fetch subcategories once category is known */
    useEffect(() => {
        if (!category) return;
        fetch(`${BASE}/subcategories?categoryId=${category._id}&limit=50`)
            .then((r) => r.json())
            .then((j) => {
                if (j.success) setSubcats(j.data.subcategories ?? []);
            })
            .catch(() => {});
    }, [category]);

    /* auto-select subcategory from ?sub= query param */
    useEffect(() => {
        if (!subSlug || !subcats.length || didAutoSelect) return;
        const match = subcats.find((s) => s.slug === subSlug);
        if (match) {
            setActiveSubcat(match);
            setDidAutoSelect(true);
        }
    }, [subSlug, subcats, didAutoSelect]);

    /* fetch courses */
    const loadCourses = useCallback(async () => {
        if (!category) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                category: category.slug,
            });
            if (activeSubcat) params.set("subcategoryId", activeSubcat._id);
            const res = await fetch(`${BASE}/courses?${params}`).then((r) =>
                r.json(),
            );
            setCourses(res.data?.courses ?? []);
            setTotal(res.data?.total ?? 0);
        } catch {
        } finally {
            setLoading(false);
        }
    }, [category, activeSubcat, page]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    /* reset page when tab changes */
    useEffect(() => {
        setPage(1);
    }, [activeSubcat]);

    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    if (error)
        return (
            <>
                <Navbar />
                <div
                    style={{
                        minHeight: "60vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <p style={{ fontSize: 18, color: "#6B7280" }}>{error}</p>
                    <Link
                        href="/courses"
                        style={{ color: "var(--primary)", fontWeight: 600 }}
                    >
                        Browse all courses →
                    </Link>
                </div>
                <Footer />
            </>
        );

    const catName = catLoading ? "" : (category?.name ?? "");

    return (
        <>
            <Navbar />

            {/* ── Hero ── */}
            <div className={styles.hero}>
                {category?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={category.imageUrl}
                        alt={catName}
                        className={styles.heroBg}
                    />
                )}
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    {catLoading ? (
                        <div
                            style={{
                                width: 220,
                                height: 44,
                                borderRadius: 8,
                                background: "rgba(255,255,255,0.12)",
                                animation: "pulse 1.5s infinite",
                            }}
                        />
                    ) : (
                        <h1 className={styles.heroTitle}>{catName}</h1>
                    )}
                    <div className={styles.heroBreadcrumb}>
                        <Link href="/">Home</Link>
                        <span>›</span>
                        <Link href="/courses">Courses</Link>
                        <span>›</span>
                        <span>{catName}</span>
                    </div>
                </div>
            </div>

            {/* ── Subcategory tab bar ── */}
            {subcats.length > 0 && (
                <div className={styles.subcatWrap}>
                    <div className={styles.subcatInner}>
                        <button
                            className={`${styles.subcatTab} ${!activeSubcat ? styles.subcatTabActive : ""}`}
                            onClick={() => setActiveSubcat(null)}
                        >
                            All
                        </button>
                        {subcats.map((s) => (
                            <button
                                key={s._id}
                                className={`${styles.subcatTab} ${activeSubcat?._id === s._id ? styles.subcatTabActive : ""}`}
                                onClick={() => setActiveSubcat(s)}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Main content ── */}
            <div className="container">
                {/* Section header */}
                <div className={styles.pageHead}>
                    <h2 className={styles.pageTitle}>
                        {activeSubcat
                            ? `${catName} – ${activeSubcat.name}`
                            : catName}
                    </h2>
                    <p className={styles.pageSub}>
                        Join GKPro Academy and get expert-led live classes,
                        personalised coaching, and a proven learning path to
                        achieve your goals – stress-free!
                    </p>
                </div>

                {/* Course grid */}
                {loading ? (
                    <div className={styles.grid}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={styles.skeleton} />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className={styles.empty}>
                        <svg
                            width="56"
                            height="56"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#D1D5DB"
                            strokeWidth="1.2"
                        >
                            <path
                                d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <p>
                            No courses found
                            {activeSubcat
                                ? ` in ${activeSubcat.name}`
                                : " in this category"}
                            .
                        </p>
                        {activeSubcat && (
                            <button
                                style={{
                                    padding: "10px 28px",
                                    background: "var(--primary)",
                                    color: "#fff",
                                    borderRadius: 50,
                                    fontWeight: 600,
                                    fontSize: 14,
                                    border: "none",
                                    cursor: "pointer",
                                }}
                                onClick={() => setActiveSubcat(null)}
                            >
                                View All {catName}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {courses.map((c) => {
                            const { sale, original } = getPrice(c);
                            const pct =
                                sale && original && original > sale
                                    ? discount(sale, original)
                                    : 0;
                            return (
                                <Link
                                    href={`/courses/${c.slug}`}
                                    key={c._id}
                                    className={styles.card}
                                >
                                    <div className={styles.cardImg}>
                                        {c.thumbnailUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={c.thumbnailUrl}
                                                alt={c.title}
                                                className={styles.cardImgEl}
                                            />
                                        )}
                                        <div
                                            className={styles.cardImgOverlay}
                                        />
                                        <ModeBadge course={c} />
                                    </div>
                                    <div className={styles.cardBody}>
                                        <h3 className={styles.cardTitle}>
                                            {c.title}
                                        </h3>
                                        {c.description && (
                                            <p className={styles.cardDesc}>
                                                {c.description}
                                            </p>
                                        )}
                                        <div className={styles.cardPrice}>
                                            {original &&
                                                original > (sale ?? 0) && (
                                                    <span
                                                        className={
                                                            styles.priceOld
                                                        }
                                                    >
                                                        ₹
                                                        {original.toLocaleString(
                                                            "en-IN",
                                                        )}
                                                    </span>
                                                )}
                                            {sale ? (
                                                <span
                                                    className={styles.priceNew}
                                                >
                                                    ₹
                                                    {sale.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </span>
                                            ) : (
                                                <span
                                                    className={styles.priceFree}
                                                >
                                                    Free
                                                </span>
                                            )}
                                            {pct > 0 && (
                                                <span
                                                    className={
                                                        styles.discountBadge
                                                    }
                                                >
                                                    {pct}% Off
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            className={styles.pageArrow}
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                        ).map((p) => (
                            <button
                                key={p}
                                className={`${styles.pageNum} ${page === p ? styles.pageActive : ""}`}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            className={styles.pageArrow}
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Category overview */}
                {category?.description && (
                    <div className={styles.overview}>
                        <h2 className={styles.overviewTitle}>
                            {catName} Course Overview
                        </h2>
                        <div className={styles.overviewBody}>
                            {category.description
                                .split("\n\n")
                                .map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                        </div>
                    </div>
                )}

                <div style={{ height: 40 }} />
            </div>

            <Footer />
        </>
    );
}
