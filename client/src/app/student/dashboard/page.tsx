"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { enrollmentsApi, type Enrollment, type Batch, type CoursePlan, type Course } from "@/lib/api";
import { getStudentUser } from "@/lib/studentAuth";
import styles from "./dashboard.module.css";

export default function StudentDashboard() {
  const user = getStudentUser();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enrollmentsApi.list(1, 50);
      setEnrollments(res.data.enrollments ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active  = enrollments.filter((e) => e.status === "active");
  const expired = enrollments.filter((e) => e.status === "expired");

  const courseTitle = (e: Enrollment) => {
    const batch = e.batchId as Partial<Batch>;
    if (batch && typeof batch === "object" && batch.courseId) {
      const c = batch.courseId as Partial<Course>;
      return typeof c === "object" ? c.title : "—";
    }
    return "—";
  };

  const courseSlug = (e: Enrollment): string | null => {
    const batch = e.batchId as Partial<Batch>;
    if (batch && typeof batch === "object" && batch.courseId) {
      const c = batch.courseId as Partial<Course>;
      return typeof c === "object" ? (c.slug ?? null) : null;
    }
    return null;
  };

  const batchName = (e: Enrollment) => {
    const batch = e.batchId as Partial<Batch>;
    return batch && typeof batch === "object" ? batch.name : "—";
  };

  const planType = (e: Enrollment) => {
    const plan = e.planId as Partial<CoursePlan>;
    return plan && typeof plan === "object" ? plan.planType : "—";
  };

  const statusColor = (s: string) => s === "active" ? styles.badgeGreen : s === "expired" ? styles.badgeGray : styles.badgeRed;

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  return (
    <StudentGuard>
      <StudentNav />
      <div className={styles.page}>
        <div className={styles.container}>

          {/* Hero welcome card */}
          <div className={styles.welcome}>
            <div className={styles.welcomeAvatar}>{initials}</div>
            <div>
              <h1 className={styles.welcomeName}>Welcome back, {user?.name?.split(" ")[0]}!</h1>
              <p className={styles.welcomeSub}>{user?.email}</p>
            </div>
            <Link href="/courses" className={styles.browseBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Browse Courses
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statNum}>{enrollments.length}</div>
              <div className={styles.statLabel}>Total Enrollments</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum} style={{ color: "#16A34A" }}>{active.length}</div>
              <div className={styles.statLabel}>Active Courses</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum} style={{ color: "#9CA3AF" }}>{expired.length}</div>
              <div className={styles.statLabel}>Expired</div>
            </div>
          </div>

          {/* Enrollment list */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>My Enrollments</h2>

            {error && <div className={styles.errorBox}>{error}</div>}

            {loading ? (
              <div className={styles.loadingRow}>
                {[1,2,3].map((i) => <div key={i} className={styles.skeleton} />)}
              </div>
            ) : !enrollments.length ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className={styles.emptyTitle}>No enrollments yet</p>
                <p className={styles.emptySub}>Browse our courses and enroll to start learning.</p>
                <Link href="/courses" className={styles.emptyBtn}>Explore Courses</Link>
              </div>
            ) : (
              <div className={styles.cards}>
                {enrollments.map((e) => (
                  <div key={e._id} className={styles.enrollCard}>
                    <div className={styles.enrollTop}>
                      <div className={styles.courseIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className={`${styles.badge} ${statusColor(e.status)}`}>{e.status}</span>
                    </div>
                    <h3 className={styles.enrollTitle}>{courseTitle(e)}</h3>
                    <div className={styles.enrollMeta}>
                      <span>{batchName(e)}</span>
                      <span>·</span>
                      <span className={styles.planTag}>{planType(e)} plan</span>
                    </div>
                    <div className={styles.enrollDates}>
                      <span>Enrolled: {new Date(e.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {e.expiresAt && (
                        <span>Expires: {new Date(e.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      )}
                    </div>
                    {e.status === "active" && courseSlug(e) && (
                      <Link href={`/student/learn/${courseSlug(e)}`} className={styles.learnBtn}>
                        Continue Learning →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </StudentGuard>
  );
}
