"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { batchesApi, enrollmentsApi, type Course, type CoursePlan, type Faq, type Category, type Batch } from "@/lib/api";
import { getStudentToken, getStudentUser } from "@/lib/studentAuth";
import styles from "./course.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
];

interface CourseDetail { course: Course; plans: CoursePlan[]; faqs: Faq[]; }

type Tab = "description" | "requirements" | "faculty" | "faq";

export default function CourseDetailPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();

  const [data, setData]         = useState<CourseDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [batches, setBatches]   = useState<Batch[]>([]);
  const [related, setRelated]   = useState<Course[]>([]);
  const [tab, setTab]           = useState<Tab>("description");
  const [openFaq, setOpenFaq]   = useState<string | null>(null);

  // Selected mode/plan
  const [selectedMode, setSelectedMode]   = useState("");
  const [selectedPlan, setSelectedPlan]   = useState<CoursePlan | null>(null);

  // Enrollment modal
  const [enrolling, setEnrolling]         = useState(false);
  const [enrollError, setEnrollError]     = useState("");
  const [enrollDone, setEnrollDone]       = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [showModal, setShowModal]         = useState(false);

  // Existing enrollment (for upgrade flow)
  const [existingEnrollment, setExistingEnrollment] = useState<{ _id: string; batchId: any; planId: any } | null>(null);
  const [upgradeMode, setUpgradeMode]               = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${BASE}/courses/${slug}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) { setError(json.message ?? "Course not found."); return; }
        const d: CourseDetail = json.data;
        setData(d);
        if (d.plans.length) setSelectedPlan(d.plans[0]);
        // fetch batches (public now)
        fetch(`${BASE}/batches?courseId=${d.course._id}&limit=50`)
          .then(r => r.json())
          .then(bj => {
            const bs: Batch[] = bj.data?.batches ?? [];
            setBatches(bs);
            if (bs.length) setSelectedMode(bs[0].mode);
          })
          .catch(() => {});
        // Check if student is already enrolled in this course
        const tk = typeof window !== "undefined" ? localStorage.getItem("gkpro_student_token") : null;
        if (tk) {
          fetch(`${BASE}/enrollments?limit=100`, { headers: { Authorization: `Bearer ${tk}` } })
            .then(r => r.json())
            .then(ej => {
              const enrollments: any[] = ej.data?.enrollments ?? [];
              const active = enrollments.find((en: any) => {
                if (en.status !== "active") return false;
                const enCourseId = en.batchId?.courseId?._id ?? en.batchId?.courseId;
                return enCourseId === d.course._id;
              });
              if (active) setExistingEnrollment(active);
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

  const handleBuyNow = async (isUpgrade = false) => {
    const tk = getStudentToken();
    if (!tk) { router.push(`/login?next=/courses/${slug}`); return; }
    if (!selectedPlan) return;
    setUpgradeMode(isUpgrade);
    setEnrollError(""); setEnrollDone(false); setSelectedBatch("");
    setShowModal(true);
    const batch = batches.find(b => b.mode === selectedMode) ?? batches[0];
    if (batch) setSelectedBatch(batch._id);
  };

  const handleConfirmEnroll = async () => {
    if (!selectedPlan || !selectedBatch) return;
    setEnrolling(true); setEnrollError("");
    try {
      const tk = getStudentToken();
      const upgradeEnrollmentId = upgradeMode && existingEnrollment ? existingEnrollment._id : undefined;
      // Try Razorpay first
      const orderRes = await fetch(`${BASE}/payments/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
        body: JSON.stringify({ planId: selectedPlan._id, batchId: selectedBatch, upgradeEnrollmentId }),
      }).then(r => r.json());

      if (!orderRes.success) {
        // Already enrolled — treat as success so user gets redirect to courses
        if (orderRes.message?.includes("already enrolled")) {
          setEnrollDone(true); return;
        }
        // Razorpay not configured — fallback to free enrollment
        if (orderRes.message?.includes("not configured")) {
          await enrollmentsApi.create(selectedBatch, selectedPlan._id);
          setEnrollDone(true); return;
        }
        throw new Error(orderRes.message ?? "Could not create payment order.");
      }

      // Load Razorpay script
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
          description: `${selectedPlan.planType} - ${data?.course.title}`,
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
                  planId: selectedPlan._id,
                  batchId: selectedBatch,
                  upgradeEnrollmentId,
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

      setEnrollDone(true);
    } catch (e: any) {
      if (e.message !== "Payment cancelled") setEnrollError(e.message);
    } finally {
      setEnrolling(false);
    }
  };

  const closeModal = () => { setShowModal(false); setEnrollDone(false); setEnrollError(""); };

  const catName = data ? (
    typeof data.course.categoryId === "object"
      ? (data.course.categoryId as Category).name
      : ""
  ) : "";

  const activePlan = selectedPlan ?? data?.plans[0];
  const originalPrice = activePlan ? Math.round(activePlan.price / 0.85 / 100) * 100 : 0;
  const discount = activePlan && originalPrice
    ? Math.round((1 - activePlan.price / originalPrice) * 100) : 0;

  const modeLabel = (m: string) => m === "recorded" ? "Recorded" : m === "one_on_one" ? "One-on-One" : "Online (Live)";

  /* ── Specs table rows ─── */
  const specs = data ? [
    { label: "No of Lectures",  value: "70 – 75 Lectures (Approx)" },
    { label: "Duration",        value: activePlan ? `${activePlan.validityDays} Days Access` : "—" },
    { label: "Mode",            value: selectedMode ? modeLabel(selectedMode) : "—" },
    { label: "Validity",        value: activePlan ? `${activePlan.validityDays} Days from Activation` : "—" },
    { label: "Study Material",  value: activePlan?.features?.join(" | ") || "Included" },
    { label: "Faculty",         value: "GKPro Expert Faculty" },
    { label: "Plan",            value: activePlan?.planType ? activePlan.planType.charAt(0).toUpperCase() + activePlan.planType.slice(1) : "—" },
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

  const { course, plans, faqs } = data;

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
        {/* Decorative chevrons */}
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
              <div className={styles.previewOverlay} />
              <button className={styles.previewPlay}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: purchase panel */}
          <div className={styles.purchasePanel}>
            <h2 className={styles.purchaseTitle}>
              The Complete {catName} – {course.title} Guideline 2026
            </h2>

            {/* Mode dropdown */}
            {batches.length > 0 && (
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Choose Your Mode:</label>
                <select
                  className={styles.fieldSelect}
                  value={selectedMode}
                  onChange={e => setSelectedMode(e.target.value)}
                >
                  <option value="">Select Mode</option>
                  {[...new Set(batches.map(b => b.mode))].map(m => (
                    <option key={m} value={m}>{modeLabel(m)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Plan dropdown */}
            {plans.length > 0 && (
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Choose Your Plan:</label>
                <select
                  className={styles.fieldSelect}
                  value={selectedPlan?._id ?? ""}
                  onChange={e => setSelectedPlan(plans.find(p => p._id === e.target.value) ?? null)}
                >
                  <option value="">Select Plan</option>
                  {plans.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.planType.charAt(0).toUpperCase() + p.planType.slice(1)} — ₹{p.price.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price */}
            {activePlan && (
              <div className={styles.priceRow}>
                <span className={styles.priceOld}>₹{originalPrice.toLocaleString("en-IN")}</span>
                <span className={styles.priceNew}>₹{activePlan.price.toLocaleString("en-IN")}</span>
                {discount > 0 && <span className={styles.discBadge}>{discount}% Off</span>}
              </div>
            )}

            {existingEnrollment ? (() => {
              const existingPlanId  = typeof existingEnrollment.planId  === "object" ? existingEnrollment.planId?._id  : existingEnrollment.planId;
              const existingBatchId = typeof existingEnrollment.batchId === "object" ? existingEnrollment.batchId?._id : existingEnrollment.batchId;
              const candidateBatch  = batches.find(b => b.mode === selectedMode) ?? batches[0];
              const isSame = selectedPlan?._id === existingPlanId && candidateBatch?._id === existingBatchId;
              return (
                <div>
                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#166534" }}>
                    You are enrolled in this course.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Link
                      href={`/student/courses/${existingEnrollment._id}`}
                      className={styles.buyBtn}
                      style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
                    >
                      Continue Learning
                    </Link>
                    {!isSame && (
                      <button
                        className={styles.buyBtn}
                        style={{ flex: 1, background: "#1D4ED8" }}
                        onClick={() => handleBuyNow(true)}
                      >
                        Change Plan
                      </button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <>
                <button className={styles.buyBtn} onClick={() => handleBuyNow(false)}>
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
          {/* Description tab */}
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
            </div>
          )}

          {/* Requirements tab */}
          {tab === "requirements" && (
            <div className={styles.reqList}>
              {course.technicalRequirements && course.technicalRequirements.length > 0 ? (
                course.technicalRequirements.map((r, i) => (
                  <div key={i} className={styles.reqItem}>
                    <span className={styles.reqDot} />
                    <span>{r}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyTab}>No specific requirements. This course is beginner-friendly.</p>
              )}
            </div>
          )}

          {/* Faculty tab */}
          {tab === "faculty" && (
            <div className={styles.facultyCard}>
              <div className={styles.facultyAvatar}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h4 className={styles.facultyName}>GKPro Expert Faculty</h4>
                <p className={styles.facultyRole}>Chartered Accountant · Senior Instructor</p>
                <p className={styles.facultyBio}>
                  Our faculty members are experienced Chartered Accountants with years of teaching
                  expertise in CA Foundation, Intermediate and Final examinations.
                </p>
              </div>
            </div>
          )}

          {/* FAQ tab */}
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
                      <span className={`${styles.relBadge} ${i % 2 === 0 ? styles.badgeOnline : styles.badgeRecorded}`}>
                        {i % 2 === 0 ? "Online" : "Recorded"}
                      </span>
                    </div>
                    <div className={styles.relCardBody}>
                      <h3 className={styles.relCardTitle}>{c.title}</h3>
                      {c.description && <p className={styles.relCardDesc}>{c.description}</p>}
                      <div className={styles.relCardPrice}>
                        <span className={styles.relPriceOld}>₹10,100</span>
                        <span className={styles.relPriceNew}>₹8500</span>
                        <span className={styles.relDiscount}>15% Off</span>
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
                <h3>{upgradeMode ? "Plan Changed Successfully!" : "Enrolled Successfully!"}</h3>
                <p>{upgradeMode ? "Your enrollment has been updated to the new plan." : <>You are now enrolled in <strong>{course.title}</strong>.</>}</p>
                <Link href="/student/courses" className={styles.modalSuccessBtn} onClick={closeModal}>
                  Go to My Courses →
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.modalHead}>
                  <h3>{upgradeMode ? "Change Plan / Switch Batch" : "Confirm Enrollment"}</h3>
                  <button className={styles.modalClose} onClick={closeModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.modalBody}>
                  {activePlan && (
                    <div className={styles.modalPlanRow}>
                      <span className={styles.modalPlanType}>
                        {activePlan.planType.charAt(0).toUpperCase() + activePlan.planType.slice(1)} Plan
                      </span>
                      <span className={styles.modalPlanPrice}>₹{activePlan.price.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {batches.length > 1 && (
                    <>
                      <label className={styles.modalLabel}>Select Batch</label>
                      <select className={styles.modalSelect} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                        <option value="">— Choose a batch —</option>
                        {batches.filter(b => !selectedMode || b.mode === selectedMode).map(b => (
                          <option key={b._id} value={b._id}>
                            {b.name} · {modeLabel(b.mode)} · {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  {enrollError && <div className={styles.modalError}>{enrollError}</div>}
                </div>
                <div className={styles.modalFoot}>
                  <button className={styles.modalCancel} onClick={closeModal}>Cancel</button>
                  <button
                    className={styles.modalConfirm}
                    onClick={handleConfirmEnroll}
                    disabled={enrolling || !selectedBatch}
                  >
                    {enrolling ? "Processing…" : activePlan?.price
                    ? `${upgradeMode ? "Pay & Change Plan" : "Pay"} ₹${activePlan.price.toLocaleString("en-IN")}`
                    : upgradeMode ? "Confirm Change" : "Confirm & Enroll"}
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
