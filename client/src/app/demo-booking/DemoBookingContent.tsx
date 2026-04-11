"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { demoBookingsApi } from "@/lib/api";
import styles from "./demo-booking.module.css";

const TIME_SLOTS = [
  "9:00 AM – 10:00 AM",
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM",
  "2:00 PM – 3:00 PM",
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
];

const COURSES = [
  "CA Foundation",
  "CA Intermediate",
  "CA Final",
  "CMA Foundation",
  "CMA Intermediate",
  "CMA Final",
  "CS Foundation",
  "CS Executive",
  "CS Professional",
  "Other",
];

export default function DemoBookingPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", course: "",
    preferredDate: "", preferredTime: "", message: "",
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Name, email and phone are required."); return;
    }
    if (!form.preferredDate || !form.preferredTime) {
      setError("Please select a preferred date and time slot."); return;
    }
    setError(""); setLoading(true);
    try {
      await demoBookingsApi.create(form);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>

          {/* ── Left Panel ── */}
          <div className={styles.leftPanel}>
            <div className={styles.imageOverlay} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&fit=crop&q=80"
              alt="Students studying"
              className={styles.bgImage}
            />
            <div className={styles.leftContent}>
              <Link href="/" className={styles.leftLogo}>
                <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#D42B3A" />
                  <path d="M8 12l8-4 8 4-8 4-8-4z" fill="white" opacity="0.9" />
                  <path d="M8 12v6l8 4 8-4v-6" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7" />
                </svg>
                <span>GKPro Academy</span>
              </Link>

              <div className={styles.leftBody}>
                <div className={styles.leftTag}>Free Demo Class</div>
                <h1 className={styles.leftTitle}>
                  Experience Learning<br />Before You Enroll
                </h1>
                <p className={styles.leftSub}>
                  Attend a live demo session with our expert faculty and get a taste of the GKPro learning experience — completely free, no commitments.
                </p>

                <div className={styles.features}>
                  {[
                    { icon: "🎯", text: "1-on-1 session with expert faculty" },
                    { icon: "📚", text: "Course overview & study plan" },
                    { icon: "💬", text: "Get all your doubts cleared" },
                    { icon: "⚡", text: "Flexible time slots available" },
                  ].map((f, i) => (
                    <div key={i} className={styles.featureRow}>
                      <span className={styles.featureIcon}>{f.icon}</span>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.trustRow}>
                  <div className={styles.trustItem}>
                    <span className={styles.trustNum}>15,000+</span>
                    <span className={styles.trustLabel}>Students Enrolled</span>
                  </div>
                  <div className={styles.trustDivider} />
                  <div className={styles.trustItem}>
                    <span className={styles.trustNum}>98%</span>
                    <span className={styles.trustLabel}>Satisfaction Rate</span>
                  </div>
                  <div className={styles.trustDivider} />
                  <div className={styles.trustItem}>
                    <span className={styles.trustNum}>50+</span>
                    <span className={styles.trustLabel}>Expert Faculty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className={styles.rightPanel}>
            {submitted ? (
              <div className={styles.successBox}>
                <div className={styles.successIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="9 12 11 14 15 10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className={styles.successTitle}>Booking Confirmed!</h2>
                <p className={styles.successSub}>
                  Thank you, <strong>{form.name}</strong>! We&apos;ve received your demo booking request. Our team will contact you on <strong>{form.phone}</strong> to confirm your slot.
                </p>
                <div className={styles.successDetails}>
                  <div className={styles.successRow}>
                    <span className={styles.successLabel}>Course Interest</span>
                    <span className={styles.successValue}>{form.course || "Not specified"}</span>
                  </div>
                  <div className={styles.successRow}>
                    <span className={styles.successLabel}>Preferred Date</span>
                    <span className={styles.successValue}>
                      {new Date(form.preferredDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className={styles.successRow}>
                    <span className={styles.successLabel}>Preferred Time</span>
                    <span className={styles.successValue}>{form.preferredTime}</span>
                  </div>
                </div>
                <div className={styles.successActions}>
                  <Link href="/courses" className={styles.successPrimaryBtn}>Browse Courses</Link>
                  <button className={styles.successSecondaryBtn} onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", course: "", preferredDate: "", preferredTime: "", message: "" }); }}>
                    Book Another
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Book Your Free Demo</h2>
                  <p className={styles.formSub}>Fill in your details and we&apos;ll get back to you within 2 hours.</p>
                </div>

                {error && <div className={styles.errorBox}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                  {/* Row 1: Name + Phone */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
                      <div className={styles.inputWrap}>
                        <span className={styles.inputIcon}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        <input
                          className={styles.input}
                          placeholder="Rahul Sharma"
                          value={form.name}
                          onChange={e => set("name", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Phone Number <span className={styles.req}>*</span></label>
                      <div className={styles.inputWrap}>
                        <span className={styles.inputIcon}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l1.94-1.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" />
                          </svg>
                        </span>
                        <input
                          className={styles.input}
                          type="tel"
                          placeholder="+91 99999 99999"
                          value={form.phone}
                          onChange={e => set("phone", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Address <span className={styles.req}>*</span></label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputIcon}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </span>
                      <input
                        className={styles.input}
                        type="email"
                        placeholder="you@email.com"
                        value={form.email}
                        onChange={e => set("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Course interest */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Course Interest</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputIcon}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <select
                        className={`${styles.input} ${styles.select}`}
                        value={form.course}
                        onChange={e => set("course", e.target.value)}
                      >
                        <option value="">— Select a course —</option>
                        {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Date + Time */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Preferred Date <span className={styles.req}>*</span></label>
                      <div className={styles.inputWrap}>
                        <span className={styles.inputIcon}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                          </svg>
                        </span>
                        <input
                          className={styles.input}
                          type="date"
                          min={minDateStr}
                          value={form.preferredDate}
                          onChange={e => set("preferredDate", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Preferred Time <span className={styles.req}>*</span></label>
                      <div className={styles.inputWrap}>
                        <span className={styles.inputIcon}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" strokeLinecap="round" />
                          </svg>
                        </span>
                        <select
                          className={`${styles.input} ${styles.select}`}
                          value={form.preferredTime}
                          onChange={e => set("preferredTime", e.target.value)}
                          required
                        >
                          <option value="">— Select time —</option>
                          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Message <span className={styles.optional}>(Optional)</span></label>
                    <textarea
                      className={styles.textarea}
                      rows={3}
                      placeholder="Any specific topics you want to cover, doubts, or questions…"
                      value={form.message}
                      onChange={e => set("message", e.target.value)}
                    />
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? (
                      <><span className={styles.spinner} /> Booking…</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinecap="round" />
                        </svg>
                        Book My Free Demo
                      </>
                    )}
                  </button>

                  <p className={styles.privacyNote}>
                    By submitting, you agree to be contacted by our team. We respect your privacy and won&apos;t spam you.
                  </p>
                </form>
              </>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
