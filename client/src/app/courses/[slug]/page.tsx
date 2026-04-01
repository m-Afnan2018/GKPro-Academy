"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { enrollmentsApi, type Course, type Faq, type Category } from "@/lib/api";
import { getStudentToken, getStudentUser } from "@/lib/studentAuth";
import styles from "./course.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
];

interface CourseDetail { course: Course; faqs: Faq[]; }

type Tab = "description" | "requirements" | "faculty" | "faq";
type Mode = "online" | "recorded";

export default function CourseDetailPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();

  const [data, setData]         = useState<CourseDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [related, setRelated]   = useState<Course[]>([]);
  const [tab, setTab]           = useState<Tab>("description");
  const [openFaq, setOpenFaq]   = useState<string | null>(null);

  const [selectedMode, setSelectedMode] = useState<Mode>("online");

  type BookType = "none" | "ebook" | "handbook";
  const [selectedBook, setSelectedBook]         = useState<BookType>("none");
  const [deliveryAddress, setDeliveryAddress]   = useState("");
  const [addressError, setAddressError]         = useState("");

  const [enrolling, setEnrolling]     = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollDone, setEnrollDone]   = useState(false);
  const [showModal, setShowModal]     = useState(false);

  // All active enrollments for this course (student may have bought both online + recorded)
  const [courseEnrollments, setCourseEnrollments] = useState<{ _id: string; mode: Mode }[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${BASE}/courses/${slug}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) { setError(json.message ?? "Course not found."); return; }
        const d: CourseDetail = json.data;
        setData(d);

        // Default mode based on availableModes setting
        const modes = d.course.availableModes ?? "both";
        if (modes === "online") setSelectedMode("online");
        else if (modes === "recorded") setSelectedMode("recorded");
        else if (d.course.onlinePrice) setSelectedMode("online");
        else if (d.course.recordedPrice) setSelectedMode("recorded");

        // Check if student is already enrolled
        const tk = typeof window !== "undefined" ? localStorage.getItem("gkpro_student_token") : null;
        if (tk) {
          fetch(`${BASE}/enrollments?limit=100`, { headers: { Authorization: `Bearer ${tk}` } })
            .then(r => r.json())
            .then(ej => {
              const enrollments: any[] = ej.data?.enrollments ?? [];
              const active = enrollments.filter((en: any) => {
                if (en.status !== "active") return false;
                const enCourseId = typeof en.courseId === "object" ? en.courseId?._id : en.courseId;
                return enCourseId === d.course._id;
              });
              if (active.length) setCourseEnrollments(active.map((en: any) => ({ _id: en._id, mode: en.mode })));
            })
            .catch(() => {});
        }

        // fetch related courses same category
        const catId = typeof d.course.categoryId === "object"
          ? (d.course.categoryId as any)._id
          : d.course.categoryId;
        fetch(`${BASE}/courses?category=${catId}&limit=4`)
          .then(r => r.json())
          .then(rj => {
            const all: Course[] = rj.data?.courses ?? [];
            setRelated(all.filter(c => c._id !== d.course._id).slice(0, 3));
          })
          .catch(() => {});
      })
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBuyNow = () => {
    const tk = getStudentToken();
    if (!tk) { router.push(`/login?next=/courses/${slug}`); return; }
    // Validate address before opening modal
    if (selectedBook === "handbook" && !deliveryAddress.trim()) {
      setAddressError("Please enter your delivery address for the handbook.");
      return;
    }
    setAddressError(""); setEnrollError(""); setEnrollDone(false);
    setShowModal(true);
  };

  const handleConfirmEnroll = async () => {
    if (!data) return;
    setEnrolling(true); setEnrollError("");
    const price = selectedMode === "online" ? data.course.onlinePrice : data.course.recordedPrice;

    try {
      const tk = getStudentToken();

      if (price && price > 0) {
        // Razorpay payment flow
        const orderRes = await fetch(`${BASE}/payments/razorpay/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
          body: JSON.stringify({ courseId: data.course._id, mode: selectedMode, bookType: selectedBook, deliveryAddress: selectedBook === "handbook" ? deliveryAddress : undefined }),
        }).then(r => r.json());

        if (!orderRes.success) {
          if (orderRes.message?.includes("already enrolled")) { setEnrollDone(true); return; }
          if (orderRes.message?.includes("not configured")) {
            await enrollmentsApi.create(data.course._id, selectedMode, selectedBook, selectedBook === "handbook" ? deliveryAddress : undefined);
            setEnrollDone(true); return;
          }
          throw new Error(orderRes.message ?? "Could not create payment order.");
        }

        await new Promise<void>((resolve, reject) => {
          if ((window as any).Razorpay) { resolve(); return; }
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load payment gateway"));
          document.body.appendChild(s);
        });

        const { orderId, amount, currency, key } = orderRes.data;

        await new Promise<void>((resolve, reject) => {
          const options = {
            key,
            amount,
            currency,
            name: "GKPro Academy",
            description: `${selectedMode === "online" ? "Online" : "Recorded"} — ${data.course.title}`,
            order_id: orderId,
            handler: async (response: any) => {
              try {
                const verifyRes = await fetch(`${BASE}/payments/razorpay/verify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    courseId: data.course._id,
                    mode: selectedMode,
                    bookType: selectedBook,
                    deliveryAddress: selectedBook === "handbook" ? deliveryAddress : undefined,
                  }),
                }).then(r => r.json());
                if (verifyRes.success) resolve();
                else reject(new Error(verifyRes.message ?? "Payment verification failed"));
              } catch (e) { reject(e); }
            },
            modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
            prefill: {
              name:    getStudentUser()?.name  ?? "",
              email:   getStudentUser()?.email ?? "",
              contact: getStudentUser()?.phone ?? "",
            },
            theme: { color: "#D42B3A" },
          };
          const rz = new (window as any).Razorpay(options);
          rz.on("payment.failed", () => reject(new Error("Payment failed")));
          rz.open();
        });
      } else {
        // Free enrollment
        await enrollmentsApi.create(data.course._id, selectedMode, selectedBook, selectedBook === "handbook" ? deliveryAddress : undefined);
      }

      setEnrollDone(true);
    } catch (e: any) {
      if (e.message !== "Payment cancelled") setEnrollError(e.message);
    } finally {
      setEnrolling(false);
    }
  };

  const closeModal = () => { setShowModal(false); setEnrollDone(false); setEnrollError(""); };

  const catName = data?.course?.categoryId && typeof data.course.categoryId === "object"
    ? (data.course.categoryId as Category).name
    : "";

  const coursePrice = data
    ? (selectedMode === "online" ? data.course.onlinePrice : data.course.recordedPrice)
    : null;

  const bookAddon = data?.course.bookEnabled
    ? (selectedBook === "ebook"    ? (data.course.eBookPrice    ?? 0)
     : selectedBook === "handbook" ? (data.course.handbookPrice ?? 0)
     : 0)
    : 0;

  const price = coursePrice != null ? coursePrice + bookAddon : null;

  const originalCoursePrice = data
    ? (selectedMode === "online" ? (data.course.onlineOriginalPrice ?? null) : (data.course.recordedOriginalPrice ?? null))
    : null;
  const discount = coursePrice && originalCoursePrice && originalCoursePrice > coursePrice
    ? Math.round((1 - coursePrice / originalCoursePrice) * 100)
    : 0;

  const availableModes = data?.course.availableModes ?? "both";
  const hasBoth = availableModes === "both" && !!(data?.course.onlinePrice && data?.course.recordedPrice);
  const hasOnlineOnly = availableModes === "online" || (!hasBoth && !!data?.course.onlinePrice && !data?.course.recordedPrice);
  const hasRecordedOnly = availableModes === "recorded" || (!hasBoth && !!data?.course.recordedPrice && !data?.course.onlinePrice);

  /* ── Specs table rows ─── */
  const specs = data ? [
    ...(data.course.numLectures ? [{ label: "No of Lectures", value: data.course.numLectures }] : [{ label: "No of Lectures", value: "70 – 75 Lectures (Approx)" }]),
    { label: "Mode", value: availableModes === "both" ? "Online (Live) + Recorded" : availableModes === "online" ? "Online (Live)" : "Recorded" },
    ...(data.course.duration   ? [{ label: "Duration",   value: data.course.duration }]   : []),
    ...(data.course.language   ? [{ label: "Language",   value: data.course.language }]   : []),
    ...(() => {
      const fac = data.course.faculty;
      if (fac && fac.length) return [{ label: "Faculty", value: fac.map(f => f.name).join(", ") }];
      return [{ label: "Faculty", value: "GKPro Expert Faculty" }];
    })(),
  ] : [];

  if (loading) return (
    <>
      <Navbar />
      <div className={styles.loadingPage}><div className={styles.spinner} /></div>
    </>
  );

  if (error || !data) return (
    <>
      <Navbar />
      <div className={styles.errorPage}>
        <h2>Course Not Found</h2>
        <p>{error || "This course does not exist."}</p>
        <Link href="/courses" className={styles.backLink}>← Browse Courses</Link>
      </div>
      <Footer />
    </>
  );

  const { course, faqs } = data;

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{catName} – {course.title}</h1>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link><span>›</span>
            <Link href="/courses">Courses</Link><span>›</span>
            {catName && <><Link href="/courses">{catName}</Link><span>›</span></>}
            <span>{course.title}</span>
          </div>
        </div>
        <div className={styles.heroChevrons}>
          {[0,1,2].map(i => (
            <svg key={i} width="22" height="14" viewBox="0 0 22 14" fill="none" opacity={0.4 - i * 0.12}>
              <polyline points="1 1 11 13 21 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ))}
        </div>
      </div>

      {/* ── Detail card ── */}
      <div className="container">
        <div className={styles.detailCard}>
          {/* Left: preview image */}
          <div className={styles.previewWrap}>
            <div className={styles.previewImg}>
              {course.thumbnailUrl
                ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )
                : <div className={styles.previewOverlay} />
              }
            </div>
          </div>

          {/* Right: purchase panel */}
          <div className={styles.purchasePanel}>
            <h2 className={styles.purchaseTitle}>
              The Complete {catName} – {course.title} Guideline 2026
            </h2>

            {/* Mode selector */}
            {hasBoth && (
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Choose Your Mode:</label>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  {(["online", "recorded"] as Mode[]).map((m) => {
                    const mPrice = m === "online" ? course.onlinePrice : course.recordedPrice;
                    if (!mPrice) return null;
                    return (
                      <button
                        key={m}
                        onClick={() => setSelectedMode(m)}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: `2px solid ${selectedMode === m ? "#D42B3A" : "#E5E7EB"}`,
                          background: selectedMode === m ? "#FFF1F2" : "#fff",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          color: selectedMode === m ? "#D42B3A" : "#374151",
                          transition: "all 0.15s",
                        }}
                      >
                        {m === "online" ? "Online (Live)" : "Recorded"}
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: selectedMode === m ? "#D42B3A" : "#6B7280" }}>
                          ₹{mPrice.toLocaleString("en-IN")}
                        </div>
                        {(() => {
                          const origP = m === "online" ? course.onlineOriginalPrice : course.recordedOriginalPrice;
                          if (!origP || origP <= mPrice) return null;
                          const pct = Math.round((1 - mPrice / origP) * 100);
                          return <div style={{ fontSize: 10, fontWeight: 700, color: "#D42B3A", marginTop: 1 }}>{pct}% off</div>;
                        })()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(hasOnlineOnly || hasRecordedOnly) && (
              <div className={styles.fieldRow} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: hasOnlineOnly ? "#EFF6FF" : "#F0FDF4", borderRadius: 8, border: `1.5px solid ${hasOnlineOnly ? "#BFDBFE" : "#BBF7D0"}` }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: hasOnlineOnly ? "#1D4ED8" : "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {hasOnlineOnly
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  }
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: hasOnlineOnly ? "#1D4ED8" : "#16A34A" }}>
                    {hasOnlineOnly ? "Online / Live Only" : "Recorded Only"}
                  </span>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                    {hasOnlineOnly ? "This course is available as live online classes." : "This course is available as pre-recorded video lectures."}
                  </p>
                </div>
              </div>
            )}

            {/* Book add-on selector */}
            {data?.course.bookEnabled && (data.course.eBookPrice || data.course.handbookPrice) && (
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Book Add-on:</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {/* No Book option */}
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${selectedBook === "none" ? "#D42B3A" : "#E5E7EB"}`, background: selectedBook === "none" ? "#FFF1F2" : "#fff" }}>
                    <input type="radio" name="bookType" value="none" checked={selectedBook === "none"} onChange={() => { setSelectedBook("none"); setAddressError(""); }} style={{ accentColor: "#D42B3A" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>No Book</span>
                  </label>
                  {/* eBook option */}
                  {data.course.eBookPrice ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${selectedBook === "ebook" ? "#D42B3A" : "#E5E7EB"}`, background: selectedBook === "ebook" ? "#FFF1F2" : "#fff" }}>
                      <input type="radio" name="bookType" value="ebook" checked={selectedBook === "ebook"} onChange={() => { setSelectedBook("ebook"); setAddressError(""); }} style={{ accentColor: "#D42B3A" }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                        eBook (PDF)
                        <span style={{ marginLeft: 8, fontSize: 12, color: "#D42B3A", fontWeight: 700 }}>+ ₹{data.course.eBookPrice.toLocaleString("en-IN")}</span>
                      </span>
                    </label>
                  ) : null}
                  {/* Handbook option */}
                  {data.course.handbookPrice ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${selectedBook === "handbook" ? "#D42B3A" : "#E5E7EB"}`, background: selectedBook === "handbook" ? "#FFF1F2" : "#fff" }}>
                      <input type="radio" name="bookType" value="handbook" checked={selectedBook === "handbook"} onChange={() => { setSelectedBook("handbook"); setAddressError(""); }} style={{ accentColor: "#D42B3A" }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                        Handbook (Physical)
                        <span style={{ marginLeft: 8, fontSize: 12, color: "#D42B3A", fontWeight: 700 }}>+ ₹{data.course.handbookPrice.toLocaleString("en-IN")}</span>
                      </span>
                    </label>
                  ) : null}
                </div>
                {/* Delivery address for handbook */}
                {selectedBook === "handbook" && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Delivery Address <span style={{ color: "#D42B3A" }}>*</span></label>
                    <textarea
                      rows={3}
                      placeholder="Full address with pin code…"
                      value={deliveryAddress}
                      onChange={(e) => { setDeliveryAddress(e.target.value); if (e.target.value.trim()) setAddressError(""); }}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${addressError ? "#DC2626" : "#E5E7EB"}`, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit" }}
                    />
                    {addressError && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 3 }}>{addressError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            {coursePrice != null && (
              <div className={styles.priceRow}>
                {originalCoursePrice && originalCoursePrice > coursePrice && (
                  <span className={styles.priceOld}>₹{originalCoursePrice.toLocaleString("en-IN")}</span>
                )}
                <span className={styles.priceNew}>₹{coursePrice.toLocaleString("en-IN")}</span>
                {discount > 0 && <span className={styles.discBadge}>{discount}% Off</span>}
              </div>
            )}
            {bookAddon > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#6B7280", padding: "2px 0" }}>
                <span>+ {selectedBook === "ebook" ? "eBook" : "Handbook"}</span>
                <span style={{ color: "#D42B3A", fontWeight: 600 }}>₹{bookAddon.toLocaleString("en-IN")}</span>
              </div>
            )}
            {bookAddon > 0 && coursePrice != null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 700, color: "#111827", borderTop: "1px solid #E5E7EB", paddingTop: 8, marginTop: 4 }}>
                <span>Total</span>
                <span>₹{price!.toLocaleString("en-IN")}</span>
              </div>
            )}

            {courseEnrollments.length > 0 ? (() => {
              const enrolledModes = courseEnrollments.map(e => e.mode);
              const alreadyHasSelected = enrolledModes.includes(selectedMode);
              // Link to the enrollment matching the selected mode, or the first one
              const linkEnrollment = courseEnrollments.find(e => e.mode === selectedMode) ?? courseEnrollments[0];
              const enrolledLabel = enrolledModes.map(m => m === "online" ? "Online" : "Recorded").join(" & ");
              return (
                <div>
                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#166534" }}>
                    You are enrolled in this course ({enrolledLabel}).
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Link
                      href={`/student/courses/${linkEnrollment._id}`}
                      className={styles.buyBtn}
                      style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
                    >
                      Continue Learning
                    </Link>
                    {!alreadyHasSelected && price && (
                      <button
                        className={styles.buyBtn}
                        style={{ flex: 1, background: "#1D4ED8" }}
                        onClick={handleBuyNow}
                      >
                        Also Buy {selectedMode === "online" ? "Online" : "Recorded"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <>
                <button className={styles.buyBtn} onClick={handleBuyNow} disabled={!price}>
                  {getStudentToken() ? "Enroll Now" : "Buy Now"}
                </button>
                {!getStudentToken() && (
                  <p className={styles.loginNote}>
                    Already have an account? <Link href="/login" className={styles.loginLink}>Log in</Link>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabsBar}>
          {(["description", "requirements", "faculty", "faq"] as Tab[]).map(t => (
            <button
              key={t}
              className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {tab === "description" && (
            <div className={styles.specsTable}>
              {specs.map((row, i) => (
                <div key={i} className={styles.specRow}>
                  <span className={styles.specLabel}>{row.label}</span>
                  <span className={styles.specValue}>{row.value}</span>
                </div>
              ))}
              {course.overview && (
                <div className={styles.overviewBlock}>
                  <h3 className={styles.overviewTitle}>{course.title} Course Overview</h3>
                  <p className={styles.overviewText}>{course.overview}</p>
                </div>
              )}
              {course.highlights && course.highlights.length > 0 && (
                <div className={styles.overviewBlock}>
                  <h3 className={styles.overviewTitle}>Course Highlights</h3>
                  {course.highlights.map((h, i) => (
                    <div key={i} className={styles.reqItem} style={{ marginBottom: 6 }}>
                      <span style={{ color: "#D42B3A", flexShrink: 0 }}>✓</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}
              {course.whoIsItFor && course.whoIsItFor.length > 0 && (
                <div className={styles.overviewBlock}>
                  <h3 className={styles.overviewTitle}>Who Is This Course For?</h3>
                  {course.whoIsItFor.map((w, i) => (
                    <div key={i} className={styles.reqItem} style={{ marginBottom: 6 }}>
                      <span className={styles.reqDot} />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "requirements" && (
            <div className={styles.reqList}>
              {(course.prerequisites && course.prerequisites.length > 0) || (course.technicalRequirements && course.technicalRequirements.length > 0) ? (
                <>
                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10, marginTop: 0 }}>Prerequisites / Prior Knowledge</h4>
                      {course.prerequisites.map((r, i) => (
                        <div key={i} className={styles.reqItem}>
                          <span className={styles.reqDot} />
                          <span>{r}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {course.technicalRequirements && course.technicalRequirements.length > 0 && (
                    <>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10, marginTop: course.prerequisites?.length ? 16 : 0 }}>Technical Requirements</h4>
                      {course.technicalRequirements.map((r, i) => (
                        <div key={i} className={styles.reqItem}>
                          <span className={styles.reqDot} />
                          <span>{r}</span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <p className={styles.emptyTab}>No specific requirements. This course is beginner-friendly.</p>
              )}
            </div>
          )}

          {tab === "faculty" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {course.faculty && course.faculty.length > 0 ? (
                course.faculty.map(fac => (
                  <div key={fac._id} className={styles.facultyCard}>
                    <div className={styles.facultyAvatar} style={fac.avatar ? { background: "none", padding: 0, overflow: "hidden" } : {}}>
                      {fac.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={fac.avatar} alt={fac.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className={styles.facultyName}>{fac.name}</h4>
                      {fac.designation && <p className={styles.facultyRole}>{fac.designation}</p>}
                      {fac.bio && <p className={styles.facultyBio}>{fac.bio}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.facultyCard}>
                  <div className={styles.facultyAvatar}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className={styles.facultyName}>GKPro Expert Faculty</h4>
                    <p className={styles.facultyRole}>Chartered Accountant · Senior Instructor</p>
                    <p className={styles.facultyBio}>Our faculty members are experienced Chartered Accountants with years of teaching expertise in CA Foundation, Intermediate and Final examinations.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "faq" && (
            <div className={styles.faqList}>
              {faqs.length > 0 ? faqs.map(f => (
                <div key={f._id} className={`${styles.faqItem} ${openFaq === f._id ? styles.faqOpen : ""}`}>
                  <button className={styles.faqQ} onClick={() => setOpenFaq(openFaq === f._id ? null : f._id)}>
                    <span>{f.question}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ transform: openFaq === f._id ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {openFaq === f._id && <div className={styles.faqA}>{f.answer}</div>}
                </div>
              )) : (
                <p className={styles.emptyTab}>No FAQs available for this course yet.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Related courses ── */}
        {related.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>Courses You May Like</h2>
            <div className={styles.relatedGrid}>
              {related.map((c, i) => {
                const rCatName = typeof c.categoryId === "object" ? (c.categoryId as Category).name : "";
                return (
                  <Link href={`/courses/${c.slug}`} key={c._id} className={styles.relCard}>
                    <div className={styles.relCardImg} style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}>
                      <span className={`${styles.relBadge} ${c.onlinePrice ? styles.badgeOnline : styles.badgeRecorded}`}>
                        {c.onlinePrice ? "Online" : "Recorded"}
                      </span>
                    </div>
                    <div className={styles.relCardBody}>
                      <h3 className={styles.relCardTitle}>{c.title}</h3>
                      {c.description && <p className={styles.relCardDesc}>{c.description}</p>}
                      <div className={styles.relCardPrice}>
                        {c.onlinePrice && <span className={styles.relPriceNew}>₹{c.onlinePrice.toLocaleString("en-IN")}</span>}
                        {c.recordedPrice && <span className={styles.relPriceNew} style={{ marginLeft: c.onlinePrice ? 8 : 0 }}>₹{c.recordedPrice.toLocaleString("en-IN")}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>

      <Footer />

      {/* ── Enrollment Modal ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            {enrollDone ? (
              <div className={styles.modalSuccess}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                </svg>
                <h3>Enrolled Successfully!</h3>
                <p>You are now enrolled in <strong>{course.title}</strong> ({selectedMode === "online" ? "Online" : "Recorded"}{selectedBook !== "none" ? ` + ${selectedBook === "ebook" ? "eBook" : "Handbook"}` : ""}).</p>
                <Link href="/student/courses" className={styles.modalSuccessBtn} onClick={closeModal}>
                  Go to My Courses →
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.modalHead}>
                  <h3>Confirm Enrollment</h3>
                  <button className={styles.modalClose} onClick={closeModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.modalPlanRow}>
                    <span className={styles.modalPlanType}>
                      {selectedMode === "online" ? "Online (Live)" : "Recorded"}
                    </span>
                    {coursePrice != null && <span className={styles.modalPlanPrice}>₹{coursePrice.toLocaleString("en-IN")}</span>}
                  </div>
                  {bookAddon > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 13, color: "#6B7280", borderTop: "1px solid #F3F4F6" }}>
                      <span>+ {selectedBook === "ebook" ? "eBook (PDF)" : "Handbook (Physical)"}</span>
                      <span style={{ color: "#D42B3A", fontWeight: 600 }}>₹{bookAddon.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {bookAddon > 0 && coursePrice != null && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 4px", fontSize: 14, fontWeight: 700, color: "#111827", borderTop: "1px solid #E5E7EB" }}>
                      <span>Total</span>
                      <span>₹{price!.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {selectedBook === "handbook" && deliveryAddress && (
                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#F9FAFB", borderRadius: 6, fontSize: 12, color: "#374151" }}>
                      <span style={{ fontWeight: 600 }}>Delivery to:</span> {deliveryAddress}
                    </div>
                  )}
                  {enrollError && <div className={styles.modalError}>{enrollError}</div>}
                </div>
                <div className={styles.modalFoot}>
                  <button className={styles.modalCancel} onClick={closeModal}>Cancel</button>
                  <button
                    className={styles.modalConfirm}
                    onClick={handleConfirmEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? "Processing…" : price ? `Pay ₹${price.toLocaleString("en-IN")}` : "Enroll Free"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
