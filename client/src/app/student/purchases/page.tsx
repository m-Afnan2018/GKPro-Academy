"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { enrollmentsApi, type Enrollment, type Course, type Payment } from "@/lib/api";
import styles from "./purchases.module.css";

const BOOK_LABELS: Record<string, string> = {
  ebook:    "eBook (PDF)",
  handbook: "Handbook (Physical)",
  none:     "No Book",
};

export default function PurchasesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enrollmentsApi.list(1, 200);
      setEnrollments(res.data.enrollments ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getCourse  = (e: Enrollment) => typeof e.courseId === "object" && e.courseId ? e.courseId as Partial<Course> : null;
  const getPayment = (e: Enrollment) => typeof e.paymentId === "object" && e.paymentId ? e.paymentId as Payment : null;

  const totalSpent = enrollments.reduce((sum, e) => sum + (getPayment(e)?.amount ?? 0), 0);

  if (loading) return (
    <StudentGuard>
      <StudentNav />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Loading your purchases…</p>
          </div>
        </div>
      </div>
    </StudentGuard>
  );

  return (
    <StudentGuard>
      <StudentNav />
      <div className={styles.page}>
        <div className={styles.container}>

          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Purchase History</h1>
              <p className={styles.subtitle}>{enrollments.length} order{enrollments.length !== 1 ? "s" : ""} · Total spent: <strong>₹{totalSpent.toLocaleString("en-IN")}</strong></p>
            </div>
            <Link href="/courses" className={styles.browseBtn}>Browse More Courses</Link>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          {!enrollments.length ? (
            <div className={styles.empty}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
                <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round"/>
              </svg>
              <p className={styles.emptyTitle}>No purchases yet</p>
              <p className={styles.emptySub}>Enroll in a course to see your orders here.</p>
              <Link href="/courses" className={styles.emptyBtn}>Explore Courses</Link>
            </div>
          ) : (
            <div className={styles.list}>
              {enrollments.map(e => {
                const payment  = getPayment(e);
                const course   = getCourse(e);
                const bookLabel = e.bookType && e.bookType !== "none" ? BOOK_LABELS[e.bookType] : null;
                const paidAt   = payment?.paidAt ?? e.enrolledAt;

                return (
                  <div key={e._id} className={styles.receipt}>
                    {/* Top row: order id + status */}
                    <div className={styles.receiptHead}>
                      <div className={styles.orderBlock}>
                        {payment?.orderId ? (
                          <>
                            <span className={styles.orderLabel}>Order ID</span>
                            <span className={styles.orderId}>{payment.orderId}</span>
                          </>
                        ) : (
                          <span className={styles.freeTag}>Free Enrollment</span>
                        )}
                        <span className={styles.orderDate}>
                          {new Date(paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <span className={`${styles.statusBadge} ${e.status === "active" ? styles.statusActive : e.status === "cancelled" ? styles.statusCancelled : styles.statusExpired}`}>
                        {e.status}
                      </span>
                    </div>

                    {/* Course name */}
                    <div className={styles.receiptBody}>
                      <div className={styles.courseRow}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className={styles.courseName}>{course?.title ?? "—"}</span>
                      </div>

                      {/* Details grid */}
                      <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailKey}>Mode</span>
                          <span className={styles.detailVal}>{e.mode === "online" ? "Online (Live)" : "Recorded"}</span>
                        </div>
                        {bookLabel && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailKey}>Book</span>
                            <span className={styles.detailVal}>{bookLabel}</span>
                          </div>
                        )}
                        <div className={styles.detailItem}>
                          <span className={styles.detailKey}>Payment</span>
                          <span className={styles.detailVal} style={{ textTransform: "capitalize" }}>
                            {payment ? (payment.isManual ? "Manual" : "Razorpay") : "Free"}
                          </span>
                        </div>
                        {payment?.razorpayPaymentId && (
                          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                            <span className={styles.detailKey}>Payment Ref</span>
                            <span className={styles.detailVal} style={{ fontFamily: "monospace", fontSize: 12 }}>{payment.razorpayPaymentId}</span>
                          </div>
                        )}
                        {e.deliveryAddress && (
                          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                            <span className={styles.detailKey}>Delivery Address</span>
                            <span className={styles.detailVal}>{e.deliveryAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className={styles.receiptFoot}>
                      <div className={styles.priceLines}>
                        {payment && e.pricePaid != null && e.pricePaid > 0 && (
                          <div className={styles.priceLine}>
                            <span>Course ({e.mode === "online" ? "Online" : "Recorded"})</span>
                            <span>₹{e.pricePaid.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        {payment && e.bookPricePaid != null && e.bookPricePaid > 0 && (
                          <div className={styles.priceLine}>
                            <span>{bookLabel ?? "Book"} add-on</span>
                            <span>₹{e.bookPricePaid.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        <div className={styles.priceTotal}>
                          <span>Total Paid</span>
                          <span>{payment ? `₹${payment.amount.toLocaleString("en-IN")}` : <span style={{ color: "#16A34A" }}>Free</span>}</span>
                        </div>
                      </div>
                      {e.status === "active" && (
                        <Link href={`/student/courses/${e._id}`} className={styles.learnBtn}>
                          Go to Course →
                        </Link>
                      )}
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
