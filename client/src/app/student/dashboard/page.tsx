"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { studentEnrollmentsApi, type Enrollment, type Course, type Payment } from "@/lib/api";
import { getStudentUser } from "@/lib/studentAuth";
import styles from "./dashboard.module.css";

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
  "linear-gradient(135deg,#1a0533 0%,#4a1060 100%)",
  "linear-gradient(135deg,#0d1b2a 0%,#1b4332 100%)",
  "linear-gradient(135deg,#2d1b69 0%,#11998e 100%)",
  "linear-gradient(135deg,#16213e 0%,#0f3460 100%)",
];

const BOOK_LABELS: Record<string, string> = {
  ebook: "eBook (PDF)",
  handbook: "Handbook",
  none: "No Book",
};

export default function StudentDashboard() {
  const user = getStudentUser();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentEnrollmentsApi.list(1, 100);
      setEnrollments(res.data.enrollments ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const courseExpiry = (e: Enrollment): string | null =>
    (typeof e.courseId === "object" && e.courseId ? (e.courseId as any).expiryDate : null) ?? null;

  const isDateExpired = (e: Enrollment) => {
    const d = courseExpiry(e);
    return !!(d && new Date(d) < new Date());
  };

  const active    = enrollments.filter(e => e.status === "active" && !isDateExpired(e));
  const completed = enrollments.filter(e => e.status === "expired" || e.status === "cancelled" || isDateExpired(e));
  const featured  = active[0] ?? null;

  const getCourse  = (e: Enrollment) => typeof e.courseId === "object" && e.courseId ? e.courseId as Partial<Course> : null;
  const getPayment = (e: Enrollment) => typeof e.paymentId === "object" && e.paymentId ? e.paymentId as Payment : null;

  const courseTitle = (e: Enrollment) => getCourse(e)?.title ?? "—";
  const courseThumbnail = (e: Enrollment) => (getCourse(e) as any)?.thumbnailUrl ?? null;

  const expiryLabel = (e: Enrollment): string | null => {
    const d = courseExpiry(e);
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const modeBadge = (mode: string) => {
    if (mode === "online")   return { label: "Online",   cls: styles.modeLive };
    if (mode === "recorded") return { label: "Recorded", cls: styles.modeRecorded };
    return null;
  };

  const totalSpent = enrollments.reduce((sum, e) => {
    const p = getPayment(e);
    return sum + (p?.amount ?? 0);
  }, 0);

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  return (
    <StudentGuard>
      <StudentNav />
      <div className={styles.page}>
        <div className={styles.container}>

          {/* Welcome card */}
          <div className={styles.welcome}>
            <div className={styles.welcomeAvatar}>{initials}</div>
            <div className={styles.welcomeInfo}>
              <h1 className={styles.welcomeName}>Welcome back, {user?.name?.split(" ")[0]}!</h1>
              <p className={styles.welcomeSub}>{user?.email}</p>
            </div>
            <Link href="/courses" className={styles.browseBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Explore Courses
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statNum}>{enrollments.length}</div>
              <div className={styles.statLabel}>Total Enrolled</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum} style={{ color: "#16A34A" }}>{active.length}</div>
              <div className={styles.statLabel}>Active Courses</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum} style={{ color: "#9CA3AF" }}>{completed.length}</div>
              <div className={styles.statLabel}>Completed</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum} style={{ color: "#D42B3A", fontSize: 24 }}>₹{totalSpent.toLocaleString("en-IN")}</div>
              <div className={styles.statLabel}>Total Spent</div>
            </div>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          {loading ? (
            <div className={styles.loadingGrid}>
              {[1,2,3,4].map(i => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : !enrollments.length ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className={styles.emptyTitle}>No enrollments yet</p>
              <p className={styles.emptySub}>Browse our courses and start your learning journey.</p>
              <Link href="/courses" className={styles.emptyBtn}>Explore Courses</Link>
            </div>
          ) : (
            <>
              {/* Continue Learning */}
              {featured && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Continue Learning</h2>
                  <div className={styles.featured} style={{ background: courseThumbnail(featured) ? undefined : CARD_GRADIENTS[0] }}>
                    {courseThumbnail(featured) && <img src={courseThumbnail(featured)!} alt="" className={styles.featuredBg} />}
                    <div className={styles.featuredOverlay} />
                    <div className={styles.featuredContent}>
                      <div className={styles.featuredTags}>
                        <span className={styles.featuredActive}>Active</span>
                        {featured.mode && <span className={modeBadge(featured.mode)?.cls ?? ""}>{modeBadge(featured.mode)?.label}</span>}
                      </div>
                      <h3 className={styles.featuredTitle}>{courseTitle(featured)}</h3>
                      <p className={styles.featuredMeta}>{featured.mode === "online" ? "Online (Live)" : "Recorded"}</p>
                      {expiryLabel(featured) !== null ? (
                        <p className={styles.featuredExpiry} style={{ color: isDateExpired(featured) ? "#FCA5A5" : "rgba(255,255,255,0.85)" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "inline", verticalAlign: "middle", marginRight: 4, marginBottom: 1 }}>
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {isDateExpired(featured) ? "Expired" : "Access until"}: {expiryLabel(featured)}
                        </p>
                      ) : (
                        <p className={styles.featuredExpiry}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "inline", verticalAlign: "middle", marginRight: 4, marginBottom: 1 }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          Lifetime Access
                        </p>
                      )}
                      <Link href={`/student/courses/${featured._id}`} className={styles.featuredBtn}>Continue Learning →</Link>
                    </div>
                  </div>
                </div>
              )}

              {/* My Enrollments */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>My Enrollments</h2>
                  <Link href="/student/courses" className={styles.viewAll}>View All →</Link>
                </div>
                <div className={styles.cards}>
                  {enrollments.slice(0, 6).map((e, i) => {
                    const thumb  = courseThumbnail(e);
                    const expiry = expiryLabel(e);
                    const expired = isDateExpired(e);
                    const mb     = modeBadge(e.mode);
                    return (
                      <div key={e._id} className={styles.enrollCard}>
                        <div className={styles.cardHeader} style={{ background: thumb ? undefined : CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}>
                          {thumb && <img src={thumb} alt="" className={styles.cardThumb} />}
                          <div className={styles.cardHeaderOverlay} />
                          <div className={styles.cardHeaderContent}>
                            {mb && <span className={`${styles.modeTag} ${mb.cls}`}>{mb.label}</span>}
                          </div>
                        </div>
                        <div className={styles.cardBody}>
                          <div className={styles.cardTopRow}>
                            <span className={`${styles.badge} ${e.status === "active" ? styles.badgeGreen : e.status === "expired" ? styles.badgeGray : styles.badgeRed}`}>
                              {e.status}
                            </span>
                            <span className={styles.planTag}>{e.mode}</span>
                          </div>
                          <h3 className={styles.enrollTitle}>{courseTitle(e)}</h3>
                          {expiry ? (
                            <div style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "5px 10px", borderRadius: 6, marginTop: 2,
                              background: expired ? "#FEF2F2" : "#F0FDF4",
                              border: `1px solid ${expired ? "#FECACA" : "#BBF7D0"}`,
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={expired ? "#DC2626" : "#16A34A"} strokeWidth="2.5">
                                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span style={{ fontSize: 12, fontWeight: 700, color: expired ? "#DC2626" : "#16A34A" }}>
                                {expired ? "Expired" : "Access until"}: {expiry}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, marginTop: 2, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A" }}>Lifetime Access</span>
                            </div>
                          )}
                          {e.status === "active" && !expired && (
                            <Link href={`/student/courses/${e._id}`} className={styles.learnBtn}>Continue →</Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Purchase History */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Purchase History</h2>
                <div className={styles.receipts}>
                  {enrollments.map(e => {
                    const payment = getPayment(e);
                    const course  = getCourse(e);
                    const bookLabel = e.bookType && e.bookType !== "none" ? BOOK_LABELS[e.bookType] ?? e.bookType : null;
                    const paidAt = payment?.paidAt ?? e.enrolledAt;
                    return (
                      <div key={e._id} className={styles.receipt}>
                        {/* Receipt header */}
                        <div className={styles.receiptHead}>
                          <div>
                            <div className={styles.receiptOrderId}>
                              {payment?.orderId ? (
                                <><span className={styles.orderIdLabel}>Order ID</span> {payment.orderId}</>
                              ) : (
                                <span style={{ color: "#9CA3AF" }}>Free Enrollment</span>
                              )}
                            </div>
                            <div className={styles.receiptDate}>
                              {paidAt ? new Date(paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </div>
                          </div>
                          <span className={`${styles.receiptStatus} ${e.status === "active" ? styles.receiptStatusActive : e.status === "cancelled" ? styles.receiptStatusCancelled : styles.receiptStatusExpired}`}>
                            {e.status}
                          </span>
                        </div>

                        {/* Course + details */}
                        <div className={styles.receiptBody}>
                          <div className={styles.receiptCourse}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className={styles.receiptCourseName}>{course?.title ?? "—"}</span>
                          </div>

                          <div className={styles.receiptMeta}>
                            <div className={styles.receiptMetaItem}>
                              <span className={styles.metaKey}>Mode</span>
                              <span className={styles.metaVal}>{e.mode === "online" ? "Online (Live)" : "Recorded"}</span>
                            </div>
                            {bookLabel && (
                              <div className={styles.receiptMetaItem}>
                                <span className={styles.metaKey}>Book</span>
                                <span className={styles.metaVal}>{bookLabel}</span>
                              </div>
                            )}
                            {e.deliveryAddress && (
                              <div className={styles.receiptMetaItem} style={{ gridColumn: "1 / -1" }}>
                                <span className={styles.metaKey}>Delivery Address</span>
                                <span className={styles.metaVal}>{e.deliveryAddress}</span>
                              </div>
                            )}
                            <div className={styles.receiptMetaItem}>
                              <span className={styles.metaKey}>Access Until</span>
                              <span className={styles.metaVal} style={{ color: isDateExpired(e) ? "#DC2626" : courseExpiry(e) ? "#111827" : "#16A34A" }}>
                                {courseExpiry(e)
                                  ? new Date(courseExpiry(e)!).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                                  : "Lifetime"}
                              </span>
                            </div>
                            <div className={styles.receiptMetaItem}>
                              <span className={styles.metaKey}>Payment</span>
                              <span className={styles.metaVal} style={{ textTransform: "capitalize" }}>
                                {payment ? (payment.isManual ? "Manual" : "Razorpay") : "Free"}
                              </span>
                            </div>
                            {payment?.razorpayPaymentId && (
                              <div className={styles.receiptMetaItem} style={{ gridColumn: "1 / -1" }}>
                                <span className={styles.metaKey}>Payment Ref</span>
                                <span className={styles.metaVal} style={{ fontFamily: "monospace", fontSize: 11 }}>{payment.razorpayPaymentId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price breakdown */}
                        <div className={styles.receiptFoot}>
                          {payment && (
                            <>
                              {e.pricePaid != null && e.pricePaid > 0 && (
                                <div className={styles.receiptLine}>
                                  <span>Course ({e.mode === "online" ? "Online" : "Recorded"})</span>
                                  <span>₹{e.pricePaid.toLocaleString("en-IN")}</span>
                                </div>
                              )}
                              {e.bookPricePaid != null && e.bookPricePaid > 0 && (
                                <div className={styles.receiptLine}>
                                  <span>{bookLabel ?? "Book"} add-on</span>
                                  <span>₹{e.bookPricePaid.toLocaleString("en-IN")}</span>
                                </div>
                              )}
                              <div className={styles.receiptTotal}>
                                <span>Total Paid</span>
                                <span>₹{payment.amount.toLocaleString("en-IN")}</span>
                              </div>
                            </>
                          )}
                          {!payment && (
                            <div className={styles.receiptTotal}>
                              <span>Total Paid</span>
                              <span style={{ color: "#16A34A" }}>Free</span>
                            </div>
                          )}
                          {e.status === "active" && !isDateExpired(e) && (
                            <Link href={`/student/courses/${e._id}`} className={styles.receiptLearnBtn}>
                              Go to Course →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </StudentGuard>
  );
}
