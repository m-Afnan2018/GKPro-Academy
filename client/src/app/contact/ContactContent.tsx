"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./contact.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const CONTACT_INFO = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    title: "Address",
    lines: ["Vishwa Karma Road, Doraha, Ludhiana,", "Punjab, India – 141421"],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    title: "Email Address",
    lines: ["info@gkproacademy.com"],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.5z"/>
      </svg>
    ),
    title: "Phone Number",
    lines: ["+8427075296"],
  },
];

export default function ContactPage() {
  const [form, setForm]     = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields."); return;
    }
    setSending(true); setError("");
    try {
      const res = await fetch(`${BASE}/leads/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: "N/A",
          notes: `Subject: ${form.subject}\n\n${form.message}`,
          source: "website",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to send.");
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Contact Us</h1>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Contact Us</span>
          </div>
        </div>
        <div className={styles.heroChevrons}>
          {[0, 1, 2].map(i => (
            <svg key={i} width="22" height="14" viewBox="0 0 22 14" fill="none" opacity={0.4 - i * 0.12}>
              <polyline points="1 1 11 13 21 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className={styles.mainSection}>
        <div className="container">
          <div className={styles.contentGrid}>

            {/* Left: info */}
            <div className={styles.infoCol}>
              <h2 className={styles.infoHeading}>
                We're always excited to<br />hear from you!
              </h2>
              <div className={styles.infoUnderline} />

              <div className={styles.infoCards}>
                {CONTACT_INFO.map((item) => (
                  <div key={item.title} className={styles.infoCard}>
                    <div className={styles.infoIconWrap}>{item.icon}</div>
                    <div>
                      <h4 className={styles.infoTitle}>{item.title}</h4>
                      {item.lines.map((line, i) => (
                        <p key={i} className={styles.infoLine}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <div className={styles.formCol}>
              <div className={styles.formCard}>
                <h3 className={styles.formTitle}>Get in Touch</h3>
                <p className={styles.formSub}>Feel free to contact with us, we don't spam your email.</p>

                {sent ? (
                  <div className={styles.successMsg}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                    </svg>
                    <h4>Message Sent!</h4>
                    <p>Thank you for reaching out. We'll get back to you shortly.</p>
                    <button className={styles.sendAgainBtn} onClick={() => setSent(false)}>
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.formField}>
                      <input
                        className={styles.formInput}
                        name="name"
                        placeholder="Full Name*"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className={styles.formField}>
                      <input
                        className={styles.formInput}
                        name="email"
                        type="email"
                        placeholder="Email Address*"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className={styles.formField}>
                      <input
                        className={styles.formInput}
                        name="subject"
                        placeholder="Subject *"
                        value={form.subject}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.formField}>
                      <textarea
                        className={`${styles.formInput} ${styles.formTextarea}`}
                        name="message"
                        placeholder="Your Message*"
                        value={form.message}
                        onChange={handleChange}
                        rows={4}
                        required
                      />
                    </div>

                    {error && <div className={styles.errorMsg}>{error}</div>}

                    <button type="submit" className={styles.submitBtn} disabled={sending}>
                      {sending ? "Sending…" : (
                        <>
                          Send Message
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Map */}
      {/*<div className={styles.mapSection}>
        <iframe
          className={styles.mapFrame}
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3424.6!2d76.0!3d30.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDU0JzAwLjAiTiA3NsKwMDAnMDAuMCJF!5e0!3m2!1sen!2sin!4v1234567890"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="GKPro Academy Location"
        />
      </div>*/}

      <Footer />
    </>
  );
}
