"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { enrollmentsApi, type Enrollment, type Course } from "@/lib/api";
import styles from "./courses.module.css";

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filter, setFilter]           = useState<"all" | "active" | "expired">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enrollmentsApi.list(1, 100);
      setEnrollments(res.data.enrollments ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? enrollments : enrollments.filter((e) => e.status === filter);

  const courseTitle = (e: Enrollment): string => {
    const batch = (e as any).batchId;
    if (batch?.courseId?.title) return batch.courseId.title;
    const c = e.courseId as Partial<Course>;
    return typeof c === "object" && c ? c.title ?? "—" : "—";
  };

  const courseSlug = (e: Enrollment): string => {
    const batch = (e as any).batchId;
    if (batch?.courseId?.slug) return batch.courseId.slug;
    const c = e.courseId as Partial<Course>;
    return typeof c === "object" && c ? c.slug ?? "" : "";
  };

  const courseThumbnail = (e: Enrollment): string => {
    return (e as any).batchId?.courseId?.thumbnailUrl ?? "";
  };

  const enrollmentMode = (e: Enrollment): string => {
    const m = (e as any).batchId?.mode ?? e.mode;
    if (m === "recorded") return "Recorded";
    if (m === "one_on_one") return "One-on-One";
    return "Online (Live)";
  };

  const statusColor = (s: string) =>
    s === "active" ? styles.badgeGreen : s === "expired" ? styles.badgeGray : styles.badgeRed;

  const counts = {
    all:     enrollments.length,
    active:  enrollments.filter((e) => e.status === "active").length,
    expired: enrollments.filter((e) => e.status === "expired").length,
  };

  return (
    <StudentGuard>
      <StudentNav />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>My Courses</h1>
            <Link href="/courses" className={styles.browseBtn}>+ Browse More</Link>
          </div>

          {/* Filter tabs */}
          <div className={styles.tabs}>
            {(["all", "active", "expired"] as const).map((t) => (
              <button key={t} className={`${styles.tab} ${filter === t ? styles.tabActive : ""}`}
                onClick={() => setFilter(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className={styles.tabCount}>{counts[t]}</span>
              </button>
            ))}
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          {loading ? (
            <div className={styles.grid}>
              {[1,2,3,4].map((i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : !filtered.length ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No {filter !== "all" ? filter : ""} enrollments</p>
              <Link href="/courses" className={styles.emptyBtn}>Explore Courses</Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((e) => {
                const slug = courseSlug(e);
                return (
                  <div key={e._id} className={styles.card}>
                    {/* Thumbnail */}
                    <div style={{ height: 140, background: "linear-gradient(135deg,#1a1a2e,#3a3a5c)", borderRadius: "12px 12px 0 0", overflow: "hidden", position: "relative", marginBottom: 14 }}>
                      {courseThumbnail(e) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={courseThumbnail(e)} alt={courseTitle(e)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      <span style={{ position: "absolute", top: 10, right: 10 }} className={`${styles.badge} ${statusColor(e.status)}`}>{e.status}</span>
                    </div>
                    <div style={{ padding: "0 16px" }}>
                    <h3 className={styles.cardTitle}>{courseTitle(e)}</h3>
                    <p className={styles.cardBatch}>{enrollmentMode(e)}</p>
                    <div className={styles.cardDates}>
                      <span>Enrolled {new Date(e.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {e.expiresAt && (
                        <span>· Expires {new Date(e.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      {e.status === "active" && (
                        <Link href={`/student/courses/${e._id}`} className={styles.learnBtn}>Continue Learning →</Link>
                      )}
                      {slug && (
                        <Link href={`/courses/${slug}`} className={styles.cardLink}>View Details</Link>
                      )}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentGuard>
  );
}
