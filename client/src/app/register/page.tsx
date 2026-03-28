"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { saveStudentSession, getStudentToken } from "@/lib/studentAuth";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  useEffect(() => {
    if (getStudentToken()) router.replace("/student/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await authApi.register(name, email, phone, password);
      const { token, user } = res.data;
      saveStudentSession(token, user);
      router.push("/student/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <Link href="/" className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#D42B3A" />
            <path d="M8 12l8-4 8 4-8 4-8-4z" fill="white" opacity="0.9" />
            <path d="M8 12v6l8 4 8-4v-6" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7" />
          </svg>
          <div>
            <div className={styles.logoName}>GKPro</div>
            <div className={styles.logoSub}>Student Portal</div>
          </div>
        </Link>

        <h1 className={styles.heading}>Create your account</h1>
        <p className={styles.sub}>Join GKPro Academy and start learning today.</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.group}>
              <label className={styles.label}>Full Name *</label>
              <input className={styles.input} placeholder="Rahul Sharma"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Phone</label>
              <input className={styles.input} type="tel" placeholder="+91 9999999999"
                value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Email address *</label>
            <input className={styles.input} type="email" placeholder="you@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div className={styles.row}>
            <div className={styles.group}>
              <label className={styles.label}>Password *</label>
              <div className={styles.inputWrap}>
                <input type={showPw ? "text" : "password"} className={styles.input}
                  placeholder="Min 6 chars" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                  {showPw ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Confirm Password *</label>
              <input type={showPw ? "text" : "password"} className={styles.input}
                placeholder="Repeat password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading && <span className={styles.spinner} />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
