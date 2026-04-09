"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { enrollmentsApi, type Course, type Faq, type Category } from "@/lib/api";
import { getStudentToken, getStudentUser } from "@/lib/studentAuth";
import styles from "./course.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface CourseDetail { course: Course; faqs: Faq[]; }

type Tab = "about" | "description" | "requirements" | "faculty" | "testimonials" | "faq";
type Mode = "online" | "recorded";

const TABS: { key: Tab; label: string }[] = [
  { key: "about", label: "About" },
  { key: "description", label: "Description" },
  { key: "requirements", label: "Requirements" },
  { key: "faculty", label: "Faculty" },
  { key: "testimonials", label: "Testimonials" },
  { key: "faq", label: "FAQ" },
];

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [data, setData] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [related, setRelated] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const tabsBarRef = useRef<HTMLDivElement>(null);

  interface CourseTestimonial { _id: string; studentName: string; courseId?: { title: string } | null; courseName?: string; content: string; rating: number; photoUrl?: string; }
  const [testimonials, setTestimonials] = useState<CourseTestimonial[]>([]);

  const [selectedMode, setSelectedMode] = useState<Mode>("online");

  type BookType = "none" | "ebook" | "handbook";
  const [selectedBook, setSelectedBook] = useState<BookType>("none");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollDone, setEnrollDone] = useState(false);
  const [showModal, setShowModal] = useState(false);

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

        const modes = d.course.availableModes ?? "both";
        if (modes === "online") setSelectedMode("online");
        else if (modes === "recorded") setSelectedMode("recorded");
        else if (d.course.onlinePrice) setSelectedMode("online");
        else if (d.course.recordedPrice) setSelectedMode("recorded");

        if (d.course.bookEnabled) {
          if (d.course.handbookPrice) setSelectedBook("handbook");
          else if (d.course.eBookPrice) setSelectedBook("ebook");
        }

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
            .catch(() => { });
        }

        // Fetch course-specific testimonials
        fetch(`${BASE}/testimonials?courseId=${d.course._id}&limit=20`)
          .then(r => r.json())
          .then(tj => { if (tj?.data?.testimonials?.length) setTestimonials(tj.data.testimonials); })
          .catch(() => { });

        const catId = typeof d.course.categoryId === "object"
          ? (d.course.categoryId as any)._id
          : d.course.categoryId;
        fetch(`${BASE}/courses?category=${catId}&limit=4`)
          .then(r => r.json())
          .then(rj => {
            const all: Course[] = rj.data?.courses ?? [];
            setRelated(all.filter(c => c._id !== d.course._id).slice(0, 3));
          })
          .catch(() => { });
      })
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Scroll-spy: highlight active tab as user scrolls ── */
  useEffect(() => {
    if (!data) return;
    const navbarH = 70;
    const tabsH = 52;
    const offset = navbarH + tabsH + 16;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id as Tab);
          }
        });
      },
      { rootMargin: `-${offset}px 0px -55% 0px`, threshold: 0 }
    );

    TABS.forEach(t => {
      const el = document.getElementById(t.key);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [data]);

  const scrollToSection = (key: Tab) => {
    const el = document.getElementById(key);
    if (!el) return;
    const tabsH = tabsBarRef.current?.offsetHeight ?? 52;
    const offset = 70 + tabsH + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleBuyNow = () => {
    const tk = getStudentToken();
    if (!tk) { router.push(`/login?next=/courses/${slug}`); return; }
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
            key, amount, currency,
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
              name: getStudentUser()?.name ?? "",
              email: getStudentUser()?.email ?? "",
              contact: getStudentUser()?.phone ?? "",
            },
            theme: { color: "#D42B3A" },
          };
          const rz = new (window as any).Razorpay(options);
          rz.on("payment.failed", () => reject(new Error("Payment failed")));
          rz.open();
        });
      } else {
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
    ? (selectedBook === "ebook" ? (data.course.eBookPrice ?? 0)
      : selectedBook === "handbook" ? (data.course.handbookPrice ?? 0)
        : 0)
    : 0;

  const totalPrice = coursePrice != null ? coursePrice + bookAddon : null;

  const originalCoursePrice = data
    ? (selectedMode === "online" ? (data.course.onlineOriginalPrice ?? null) : (data.course.recordedOriginalPrice ?? null))
    : null;
  const discountPct = coursePrice && originalCoursePrice && originalCoursePrice > coursePrice
    ? Math.round((1 - coursePrice / originalCoursePrice) * 100)
    : 0;

  const availableModes = data?.course.availableModes ?? "both";
  const hasBoth = availableModes === "both" && !!(data?.course.onlinePrice && data?.course.recordedPrice);
  const hasOnlineOnly = availableModes === "online" || (!hasBoth && !!data?.course.onlinePrice && !data?.course.recordedPrice);
  const hasRecordedOnly = availableModes === "recorded" || (!hasBoth && !!data?.course.recordedPrice && !data?.course.onlinePrice);

  const TABS: { key: Tab; label: string }[] = [
    { key: "about", label: "About" },
    { key: "description", label: "Description" },
    { key: "requirements", label: "Requirements" },
    { key: "faculty", label: "Faculty" },
    { key: "testimonials", label: "Testimonials" },
    { key: "faq", label: "FAQ" },
  ];

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

  const catSlug = course.categoryId && typeof course.categoryId === "object"
    ? (course.categoryId as any).slug
    : null;

  return (
    <>
      <Navbar />

      <div className="container">
        <div className={styles.pageLayout}>

          {/* ══════════════ LEFT COLUMN ══════════════ */}
          <div className={styles.leftCol}>

            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
              <Link href="/">Home</Link><span>›</span>
              {catName && catSlug && <><Link href={`/category/${catSlug}`}>{catName}</Link><span>›</span></>}
              <span>{course.title}</span>
            </nav>

            {/* Title */}
            <h1 className={styles.courseTitle}>
              {catName ? `${catName} – ${course.title}` : course.title}
            </h1>

            {/* Meta sub-line */}
            <div className={styles.courseMeta}>
              {course.targetAudience && (
                <div className={styles.metaItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  For {course.targetAudience}
                </div>
              )}
              {course.startDate && (
                <div className={styles.metaItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Live Classes from: <strong>{new Date(course.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                  {course.validityMonths && <> | Valid till: <strong>{new Date(new Date(course.startDate).setMonth(new Date(course.startDate).getMonth() + course.validityMonths)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong></>}
                </div>
              )}
            </div>

            {/* ── Sticky Tab Bar ── */}
            <div className={styles.tabsBar} ref={tabsBarRef}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ""}`}
                  onClick={() => scrollToSection(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── All sections rendered, scroll-navigated ── */}
            <div className={styles.sectionsWrap}>

              {/* About */}
              <section id="about" className={styles.tabPanel}>
                <h2 className={styles.panelTitle}>About the Batch</h2>
                {course.highlights && course.highlights.length > 0 ? (
                  <ul className={styles.highlightList}>
                    {course.highlights.map((h, i) => (
                      <li key={i} className={styles.highlightItem}>
                        <span className={styles.highlightIcon}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className={styles.highlightList}>
                    {[
                      <><strong>800+ hrs of structured learning</strong> designed for CA Foundation 2026 aspirants with concept clarity + exam-focused preparation.</>,
                      <>Regular <strong>doubt-solving sessions</strong> with expert faculty to ensure clear understanding of every concept.</>,
                      <>Access to <strong>live classes + recorded lectures</strong>, along with class notes and practice material after every session.</>,
                    ].map((text, i) => (
                      <li key={i} className={styles.highlightItem}>
                        <span className={styles.highlightIcon}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        </span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {course.overview && <p className={styles.overviewText} style={{ marginTop: 20 }}>{course.overview}</p>}
              </section>

              {/* Description */}
              <section id="description" className={styles.tabPanel}>
                <h2 className={styles.panelTitle}>Description</h2>
                <div className={styles.specsTable}>
                  {course.numLectures && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>No of Lectures</span>
                      <span className={styles.specValue}>{course.numLectures}</span>
                    </div>
                  )}
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Mode</span>
                    <span className={styles.specValue}>
                      {availableModes === "both" ? "Online (Live) + Recorded" : availableModes === "online" ? "Online (Live)" : "Recorded"}
                    </span>
                  </div>
                  {course.duration && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>Duration</span>
                      <span className={styles.specValue}>{course.duration}</span>
                    </div>
                  )}
                  {course.language && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>Language</span>
                      <span className={styles.specValue}>{course.language}</span>
                    </div>
                  )}
                  {course.validity && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>Validity</span>
                      <span className={styles.specValue}>{course.validity}</span>
                    </div>
                  )}
                  {course.faculty && course.faculty.length > 0 && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>Faculty</span>
                      <span className={styles.specValue}>{course.faculty.map(f => f.name).join(", ")}</span>
                    </div>
                  )}
                  {course.studyMaterial && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>Study Material</span>
                      <span className={styles.specValue}>{course.studyMaterial}</span>
                    </div>
                  )}
                </div>
                {course.whoIsItFor && course.whoIsItFor.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3 className={styles.subHeading}>Who Is This Course For?</h3>
                    <div className={styles.reqList}>
                      {course.whoIsItFor.map((w, i) => (
                        <div key={i} className={styles.reqItem}>
                          <span className={styles.reqDot} /><span>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Requirements */}
              <section id="requirements" className={styles.tabPanel}>
                <h2 className={styles.panelTitle}>Requirements</h2>
                {(course.prerequisites && course.prerequisites.length > 0) || (course.technicalRequirements && course.technicalRequirements.length > 0) ? (
                  <>
                    {course.prerequisites && course.prerequisites.length > 0 && (
                      <>
                        <h3 className={styles.subHeading}>Prerequisites</h3>
                        <div className={styles.reqList}>
                          {course.prerequisites.map((r, i) => (
                            <div key={i} className={styles.reqItem}><span className={styles.reqDot} /><span>{r}</span></div>
                          ))}
                        </div>
                      </>
                    )}
                    {course.technicalRequirements && course.technicalRequirements.length > 0 && (
                      <>
                        <h3 className={styles.subHeading} style={{ marginTop: 20 }}>Technical Requirements</h3>
                        <div className={styles.reqList}>
                          {course.technicalRequirements.map((r, i) => (
                            <div key={i} className={styles.reqItem}><span className={styles.reqDot} /><span>{r}</span></div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className={styles.reqSections}>
                    {[
                      { title: "Windows:", items: ["Android 10 or above", "Minimum 4 GB RAM", "All processors except MediaTek supported"] },
                      { title: "iOS Devices:", items: ["iOS 17 or above"] },
                      { title: "Windows Laptop:", items: ["6th Gen Processor or higher (2.0 GHz+)", "Windows 10 or above", "Minimum 4 GB RAM", "Windows 10 N not supported", "Lectures will not play on PC"] },
                      { title: "macOS Devices:", items: ["macOS 13 (Ventura) or above"] },
                      { title: "Internet Requirement:", items: ["Minimum 10 Mbps speed", "Stable internet connection required"] },
                    ].map(sec => (
                      <div key={sec.title} className={styles.reqSection}>
                        <h4 className={styles.reqSectionTitle}>{sec.title}</h4>
                        <div className={styles.reqList}>
                          {sec.items.map((item, i) => (
                            <div key={i} className={styles.reqItem}><span className={styles.reqDot} /><span>{item}</span></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Faculty */}
              <section id="faculty" className={styles.tabPanel}>
                <h2 className={styles.panelTitle}>Faculty</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {course.faculty && course.faculty.length > 0 ? (
                    course.faculty.map(fac => (
                      <div key={fac._id} className={styles.facultyCard}>
                        <div className={styles.facultyAvatarWrap}>
                          {fac.avatar ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={fac.avatar} alt={fac.name} className={styles.facultyImg} />
                          ) : (
                            <div className={styles.facultyAvatar}>
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                              </svg>
                            </div>
                          )}
                          {fac.designation && <p className={styles.facultyDesig}>{fac.designation}</p>}
                        </div>
                        <div className={styles.facultyInfo}>
                          <h4 className={styles.facultyName}>{fac.name}</h4>
                          {fac.designation && <p className={styles.facultyRole}>{fac.designation}</p>}
                          {fac.bio && <p className={styles.facultyBio}>{fac.bio}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.facultyCard}>
                      <div className={styles.facultyAvatarWrap}>
                        <div className={styles.facultyAvatar}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <p className={styles.facultyDesig}>Co-Founder &amp; Managing Director</p>
                      </div>
                      <div className={styles.facultyInfo}>
                        <h4 className={styles.facultyName}>GKPro Expert Faculty</h4>
                        <p className={styles.facultyRole}>Chartered Accountant · Senior Instructor</p>
                        <p className={styles.facultyBio}>Our faculty members are experienced Chartered Accountants with years of teaching expertise in CA Foundation, Intermediate and Final examinations.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Testimonials */}
              <section id="testimonials" className={styles.tabPanel}>
                <h2 className={styles.panelTitle}>Student Testimonials</h2>
                {testimonials.length > 0 ? (
                  <div className={styles.testimonialGrid}>
                    {testimonials.map(t => (
                      <div key={t._id} className={styles.testimonialCard}>
                        <div className={styles.testimonialTop}>
                          <div className={styles.testimonialAvatar}>
                            {t.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={t.photoUrl} alt={t.studentName} className={styles.testimonialAvatarImg} />
                            ) : (
                              <span className={styles.testimonialAvatarInitial}>{t.studentName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className={styles.testimonialName}>{t.studentName.split("")[0].toUpperCase() + t.studentName.toLowerCase().slice(1)}</div>
                          </div>
                        </div>
                        <p className={styles.testimonialText}>{t.content}</p>
                        <div className={styles.testimonialStars}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                              fill={i < t.rating ? "var(--primary)" : "none"}
                              stroke={i < t.rating ? "var(--primary)" : "#D1D5DB"}
                              strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyTab}>No testimonials yet for this course.</p>
                )}
              </section>

              {/* FAQ */}
              <section id="faq" className={styles.tabPanel}>
                <h2 className={styles.panelTitle}>Faq</h2>
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
              </section>

            </div>
            {/* end sectionsWrap */}

            {/* ── Related courses ── */}
            {related.length > 0 && (
              <div className={styles.relatedSection}>
                <h2 className={styles.relatedTitle}>Courses You May Like</h2>
                <div className={styles.relatedGrid}>
                  {related.map((c, i) => {
                    const gradients = [
                      "linear-gradient(135deg,#1a1a2e 0%,#3a3a5c 100%)",
                      "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
                      "linear-gradient(135deg,#1c3a4a 0%,#0f4c75 100%)",
                    ];
                    const onlineP = c.onlinePrice ?? 0;
                    const recordedP = c.recordedPrice ?? 0;
                    const leadPrice = onlineP && recordedP ? Math.min(onlineP, recordedP) : onlineP || recordedP;
                    const origP = onlineP && recordedP
                      ? null
                      : (onlineP ? (c.onlineOriginalPrice ?? null) : (c.recordedOriginalPrice ?? null));
                    const relPct = leadPrice && origP && origP > leadPrice
                      ? Math.round((1 - leadPrice / origP) * 100) : 0;
                    return (
                      <Link href={`/courses/${c.slug}`} key={c._id} className={styles.relCard}>
                        <div className={styles.relCardImg} style={{ background: gradients[i % gradients.length] }}>
                          {c.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.thumbnailUrl} alt={c.title}
                              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                          <span className={`${styles.relBadge} ${c.onlinePrice ? styles.badgeOnline : styles.badgeRecorded}`}>
                            {c.onlinePrice ? "Online" : "Recorded"}
                          </span>
                        </div>
                        <div className={styles.relCardBody}>
                          <h3 className={styles.relCardTitle}>{c.title}</h3>
                          {c.description && <p className={styles.relCardDesc}>{c.description}</p>}
                          <div className={styles.relCardPrice}>
                            {origP && origP > leadPrice && (
                              <span className={styles.relPriceOld}>₹{origP.toLocaleString("en-IN")}</span>
                            )}
                            {leadPrice > 0 && (
                              <span className={styles.relPriceNew}>₹{leadPrice.toLocaleString("en-IN")}</span>
                            )}
                            {relPct > 0 && <span className={styles.relDiscount}>{relPct}% Off</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
          {/* end leftCol */}

          {/* ══════════════ RIGHT STICKY CARD ══════════════ */}
          <div className={styles.rightCol}>
            <div className={styles.purchaseCard}>

              {/* Thumbnail */}
              <div className={styles.cardThumb}>
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnailUrl} alt={course.title} className={styles.cardThumbImg} />
                ) : (
                  <div className={styles.cardThumbFallback} />
                )}
                <div className={styles.cardThumbOverlay} />
                <div className={styles.cardThumbLabel}>
                  <span className={styles.cardThumbTitle}>{course.title}</span>
                </div>
              </div>

              <div className={styles.cardBody}>
                {/* Course name + badges */}
                <div className={styles.cardNameRow}>
                  {/*<h3 className={styles.cardCourseName}>{course.title}</h3>*/}
                  <div className={styles.cardBadges}>
                    {course.isNew && <span className={styles.badge} style={{ background: "#EEF2FF", color: "#4F46E5" }}>New</span>}
                    {course.language && <span className={styles.badge} style={{ background: "#FFF7ED", color: "#C2410C" }}>{course.language}</span>}
                    {hasBoth && <span className={styles.badge} style={{ background: "#F0FDF4", color: "#166534" }}>Live + Recorded</span>}
                    {hasOnlineOnly && <span className={styles.badge} style={{ background: "#EFF6FF", color: "#1D4ED8" }}>Live Only</span>}
                    {hasRecordedOnly && <span className={styles.badge} style={{ background: "#FFF7ED", color: "#C2410C" }}>Recorded Only</span>}
                  </div>
                </div>

                {/* Validity */}
                {course.validityMonths && (
                  <p className={styles.cardValidity}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    Validity: {course.validityMonths} Months Access
                  </p>
                )}

                {/* Mode selector */}
                {hasBoth && (
                  <div className={styles.modeSection}>
                    <p className={styles.modeSectionLabel}>Choose Your Mode:</p>
                    <div className={styles.modeTabs}>
                      {(["online", "recorded"] as Mode[]).map(m => {
                        const mPrice = m === "online" ? course.onlinePrice : course.recordedPrice;
                        if (!mPrice) return null;
                        return (
                          <button
                            key={m}
                            className={`${styles.modeTab} ${selectedMode === m ? styles.modeTabActive : ""}`}
                            onClick={() => setSelectedMode(m)}
                          >
                            {m === "online" ? "Online" : "Recorded"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Single-mode info */}
                {(hasOnlineOnly || hasRecordedOnly) && (
                  <div className={styles.singleModeInfo} style={{ background: hasOnlineOnly ? "#EFF6FF" : "#F0FDF4", borderColor: hasOnlineOnly ? "#BFDBFE" : "#BBF7D0" }}>
                    <span style={{ fontWeight: 700, color: hasOnlineOnly ? "#1D4ED8" : "#16A34A" }}>
                      {hasOnlineOnly ? "Online / Live Only" : "Recorded Only"}
                    </span>
                  </div>
                )}

                {/* Book add-on */}
                {data?.course.bookEnabled && (data.course.eBookPrice || data.course.handbookPrice) && (
                  <div className={styles.bookSection}>
                    <p className={styles.modeSectionLabel}>Choose Your Mode:</p>
                    <div className={styles.bookOptions}>
                      {data.course.eBookPrice ? (
                        <label className={`${styles.bookOption} ${selectedBook === "ebook" ? styles.bookOptionActive : ""}`}>
                          <input type="radio" name="bookType" value="ebook" checked={selectedBook === "ebook"}
                            onChange={() => { setSelectedBook("ebook"); setAddressError(""); }} />
                          <span>eBook (PDF) <em>+₹{data.course.eBookPrice.toLocaleString("en-IN")}</em></span>
                        </label>
                      ) : null}
                      {data.course.handbookPrice ? (
                        <label className={`${styles.bookOption} ${selectedBook === "handbook" ? styles.bookOptionActive : ""}`}>
                          <input type="radio" name="bookType" value="handbook" checked={selectedBook === "handbook"}
                            onChange={() => { setSelectedBook("handbook"); setAddressError(""); }} />
                          <span>Handbook (Physical) <em>+₹{data.course.handbookPrice.toLocaleString("en-IN")}</em></span>
                        </label>
                      ) : null}
                    </div>
                    {selectedBook === "handbook" && (
                      <div style={{ marginTop: 8 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                          Delivery Address <span style={{ color: "#D42B3A" }}>*</span>
                        </label>
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
                  <div className={styles.priceBlock}>
                    <div className={styles.priceRow}>
                      <span className={styles.priceNew}>₹{coursePrice.toLocaleString("en-IN")}</span>
                      {originalCoursePrice && originalCoursePrice > coursePrice && (
                        <span className={styles.priceOld}>₹{originalCoursePrice.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                    {discountPct > 0 && (
                      <div className={styles.discBadge}>Discount of {discountPct}% applied</div>
                    )}
                    {bookAddon > 0 && (
                      <div className={styles.totalRow}>
                        <span>Total</span>
                        <span>₹{totalPrice!.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Enrolled / Buy */}
                {courseEnrollments.length > 0 ? (() => {
                  const enrolledModes = courseEnrollments.map(e => e.mode);
                  const alreadyHasSelected = enrolledModes.includes(selectedMode);
                  const linkEnrollment = courseEnrollments.find(e => e.mode === selectedMode) ?? courseEnrollments[0];
                  const enrolledLabel = enrolledModes.map(m => m === "online" ? "Online" : "Recorded").join(" & ");
                  return (
                    <div>
                      <div className={styles.enrolledBadge}>
                        You are enrolled ({enrolledLabel}).
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <Link href={`/student/courses/${linkEnrollment._id}`} className={styles.buyBtn}
                          style={{ flex: 1, textAlign: "center", textDecoration: "none" }}>
                          Continue Learning
                        </Link>
                        {!alreadyHasSelected && coursePrice && (
                          <button className={styles.buyBtn} style={{ flex: 1, background: "#1D4ED8" }} onClick={handleBuyNow}>
                            Also Buy {selectedMode === "online" ? "Online" : "Recorded"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <>
                    <button className={styles.buyBtn} onClick={handleBuyNow} disabled={!coursePrice}>
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
              {/* end cardBody */}
            </div>
            {/* end purchaseCard */}
          </div>
          {/* end rightCol */}

        </div>
        {/* end pageLayout */}

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
                  <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
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
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.modalPlanRow}>
                    <span className={styles.modalPlanType}>{selectedMode === "online" ? "Online (Live)" : "Recorded"}</span>
                    {coursePrice != null && <span className={styles.modalPlanPrice}>₹{coursePrice.toLocaleString("en-IN")}</span>}
                  </div>
                  {bookAddon > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", borderTop: "1px solid #F3F4F6", paddingTop: 6 }}>
                      <span>+ {selectedBook === "ebook" ? "eBook (PDF)" : "Handbook (Physical)"}</span>
                      <span style={{ color: "#D42B3A", fontWeight: 600 }}>₹{bookAddon.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {bookAddon > 0 && coursePrice != null && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#111827", borderTop: "1px solid #E5E7EB", paddingTop: 8, marginTop: 4 }}>
                      <span>Total</span>
                      <span>₹{totalPrice!.toLocaleString("en-IN")}</span>
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
                  <button className={styles.modalConfirm} onClick={handleConfirmEnroll} disabled={enrolling}>
                    {enrolling ? "Processing…" : coursePrice && coursePrice > 0 ? "Pay Now" : "Enroll Free"}
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
