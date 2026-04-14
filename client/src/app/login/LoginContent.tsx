"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { saveStudentSession, getStudentToken } from "@/lib/studentAuth";
import { saveSession, getToken } from "@/lib/auth";
import styles from "./login.module.css";
import Image from "next/image";
import commonImages from "@/constants/commonImages";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function AuthPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") ?? "";
  const defaultTab   = searchParams.get("tab") === "register" ? "register" : "login";

  const [tab, setTab] = useState<"login" | "register" | "verify-signup" | "forgot" | "reset">(defaultTab as any);

  // Forgot / Reset state
  const [fpEmail, setFpEmail]           = useState("");
  const [fpLoading, setFpLoading]       = useState(false);
  const [fpError, setFpError]           = useState("");
  const [fpSuccess, setFpSuccess]       = useState("");
  const [resetOtp, setResetOtp]         = useState("");
  const [resetPw, setResetPw]           = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError]     = useState("");
  const [showResetPw, setShowResetPw]   = useState(false);

  // Login state
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError]       = useState("");
  const [loginLoading, setLoginLoading]   = useState(false);
  const [showLoginPw, setShowLoginPw]     = useState(false);

  // Register state
  const [regName, setRegName]         = useState("");
  const [regPhone, setRegPhone]       = useState("");
  const [regEmail, setRegEmail]       = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm]   = useState("");
  const [regError, setRegError]       = useState("");
  const [regLoading, setRegLoading]   = useState(false);
  const [showRegPw, setShowRegPw]         = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Signup OTP verification state
  const [svOtp, setSvOtp]           = useState("");
  const [svLoading, setSvLoading]   = useState(false);
  const [svError, setSvError]       = useState("");
  const [svResending, setSvResending] = useState(false);
  const [svResent, setSvResent]     = useState(false);

  useEffect(() => {
    // Redirect already-logged-in users
    if (getToken()) { router.replace("/admin/dashboard"); return; }
    if (getStudentToken()) { router.replace("/student/dashboard"); return; }
  }, [router]);

  const switchTab = (t: "login" | "register" | "verify-signup" | "forgot" | "reset") => {
    setTab(t);
    setLoginError(""); setRegError(""); setFpError(""); setResetError(""); setSvError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(""); setLoginLoading(true);
    try {
      const res = await authApi.login(loginEmail, loginPassword);
      const { token, user } = res.data;

      if (user.role === "admin" || user.role === "manager") {
        saveSession(token, user);
        router.push("/admin/dashboard");
      } else {
        saveStudentSession(token, user);
        router.push(next || "/student/dashboard");
      }
    } catch (err: any) {
      setLoginError(err.message ?? "Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
    if (regPassword.length < 6)     { setRegError("Password must be at least 6 characters."); return; }
    setRegLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPassword }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Registration failed.");
      // Move to OTP verification step
      setSvOtp(""); setSvError(""); setSvResent(false);
      setTab("verify-signup");
    } catch (err: any) {
      setRegError(err.message ?? "Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSvError(""); setSvLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/verify-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, otp: svOtp }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Verification failed.");
      const { token, user } = json.data;
      saveStudentSession(token, user);
      router.push(next || "/student/dashboard");
    } catch (err: any) {
      setSvError(err.message ?? "Something went wrong.");
    } finally {
      setSvLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    setSvResending(true); setSvError(""); setSvResent(false);
    try {
      const res = await fetch(`${BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPassword }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Could not resend OTP.");
      setSvResent(true);
      setSvOtp("");
    } catch (err: any) {
      setSvError(err.message ?? "Could not resend OTP.");
    } finally {
      setSvResending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError(""); setFpSuccess(""); setFpLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Failed to send OTP.");
      setFpSuccess("OTP sent! Check your inbox (and spam folder).");
      setTab("reset");
    } catch (err: any) {
      setFpError(err.message ?? "Something went wrong.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (resetPw !== resetConfirm) { setResetError("Passwords do not match."); return; }
    if (resetPw.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    setResetLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp: resetOtp, newPassword: resetPw }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Reset failed.");
      // Auto-login the returned token
      const { token, user } = json.data;
      if (user.role === "admin" || user.role === "manager") {
        saveSession(token, user);
        router.push("/admin/dashboard");
      } else {
        saveStudentSession(token, user);
        router.push(next || "/student/dashboard");
      }
    } catch (err: any) {
      setResetError(err.message ?? "Something went wrong.");
    } finally {
      setResetLoading(false);
    }
  };

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          {/*<svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#D42B3A"/>
            <path d="M8 12l8-4 8 4-8 4-8-4z" fill="white" opacity="0.9"/>
            <path d="M8 12v6l8 4 8-4v-6" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7"/>
          </svg>
          <div>
            <div className={styles.logoName}>GKPro</div>
            <div className={styles.logoSub}>Academy</div>
          </div>*/}
          <Image src={commonImages.logo} width={150} height={150} alt="logo" style={{width: '150px', height: 'auto', objectFit: 'cover'}}/>
        </Link>

        {/* Tab switcher */}
        {/*<div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => switchTab("login")}
          >
            Sign In
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "register" ? styles.tabActive : ""}`}
            onClick={() => switchTab("register")}
          >
            Create Account
          </button>
          <span
            className={styles.tabSlider}
            style={{ transform: tab === "register" ? "translateX(100%)" : "translateX(0)" }}
          />
        </div>*/}

        {/* ── Login Form ── */}
        {tab === "login" && (
          <>
            <h1 className={styles.heading}>Welcome back</h1>
            <p className={styles.sub}>Sign in to your GKPro account to continue.</p>

            {loginError && <div className={styles.errorBox}>{loginError}</div>}

            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.group}>
                <label className={styles.label}>Email address</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="you@email.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.group}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showLoginPw ? "text" : "password"}
                    className={styles.input}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowLoginPw(v => !v)}>
                    <EyeIcon open={showLoginPw} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
                <button
                  type="button"
                  className={styles.switchLink}
                  style={{ fontSize: 12 }}
                  onClick={() => { setFpEmail(loginEmail); setFpError(""); setFpSuccess(""); setTab("forgot"); }}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loginLoading}>
                {loginLoading && <span className={styles.spinner} />}
                {loginLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className={styles.footer}>
              Don&apos;t have an account?{" "}
              <button className={styles.switchLink} onClick={() => switchTab("register")}>
                Create one free
              </button>
            </p>
          </>
        )}

        {/* ── Register Form ── */}
        {tab === "register" && (
          <>
            <h1 className={styles.heading}>Join GKPro Academy</h1>
            <p className={styles.sub}>Create your free student account and start learning.</p>

            {regError && <div className={styles.errorBox}>{regError}</div>}

            <form onSubmit={handleRegister} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.group}>
                  <label className={styles.label}>Full Name *</label>
                  <input
                    className={styles.input}
                    placeholder="Rahul Sharma"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>Phone</label>
                  <input
                    className={styles.input}
                    type="tel"
                    placeholder="+91 99999 99999"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className={styles.group}>
                <label className={styles.label}>Email address *</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="you@email.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.group}>
                  <label className={styles.label}>Password *</label>
                  <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                    <input
                      type={showRegPw ? "text" : "password"}
                      className={styles.input}
                      placeholder="Min 6 chars"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowRegPw(v => !v)}>
                      <EyeIcon open={showRegPw} />
                    </button>
                  </div>
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>Confirm Password *</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      type={showRegConfirm ? "text" : "password"}
                      className={styles.input}
                      placeholder="Repeat password"
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowRegConfirm(v => !v)}>
                      <EyeIcon open={showRegConfirm} />
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={regLoading}>
                {regLoading && <span className={styles.spinner} />}
                {regLoading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className={styles.footer}>
              Already have an account?{" "}
              <button className={styles.switchLink} onClick={() => switchTab("login")}>
                Sign in
              </button>
            </p>
          </>
        )}

        {/* ── Verify Signup OTP ── */}
        {tab === "verify-signup" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "#FFF1F2", border: "2px solid #FECDD3",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 26,
              }}>✉️</div>
              <h1 className={styles.heading} style={{ marginBottom: 6 }}>Check your inbox</h1>
              <p className={styles.sub} style={{ marginBottom: 0 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: "#111827" }}>{regEmail}</strong>
              </p>
            </div>

            {svError   && <div className={styles.errorBox}>{svError}</div>}
            {svResent  && (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", borderRadius: 8, padding: "11px 14px", fontSize: 13, marginBottom: 18 }}>
                A new OTP has been sent to your email.
              </div>
            )}

            <form onSubmit={handleVerifySignup} className={styles.form}>
              <div className={styles.group}>
                <label className={styles.label}>Enter 6-digit OTP</label>
                {/* Individual digit boxes */}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 4 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={svOtp[i] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 1);
                        const arr = svOtp.split("");
                        arr[i] = val;
                        setSvOtp(arr.join("").slice(0, 6));
                        if (val && i < 5) {
                          (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !svOtp[i] && i > 0) {
                          (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                        setSvOtp(pasted);
                        const next = Math.min(pasted.length, 5);
                        (document.getElementById(`otp-${next}`) as HTMLInputElement)?.focus();
                      }}
                      style={{
                        width: 48, height: 56,
                        textAlign: "center",
                        fontSize: 22, fontWeight: 700,
                        border: `2px solid ${svOtp[i] ? "#D42B3A" : "#E5E7EB"}`,
                        borderRadius: 10,
                        outline: "none",
                        background: svOtp[i] ? "#FFF1F2" : "#F9FAFB",
                        color: "#111827",
                        transition: "border-color 0.15s, background 0.15s",
                        caretColor: "transparent",
                      }}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
                <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
                  Code expires in 10 minutes
                </p>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={svLoading || svOtp.length < 6}
              >
                {svLoading && <span className={styles.spinner} />}
                {svLoading ? "Verifying…" : "Verify & Create Account"}
              </button>
            </form>

            <p className={styles.footer} style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
              <button
                className={styles.switchLink}
                style={{ fontSize: 12 }}
                onClick={handleResendSignupOtp}
                disabled={svResending}
              >
                {svResending ? "Sending…" : "Resend OTP"}
              </button>
              <button
                className={styles.switchLink}
                style={{ fontSize: 12 }}
                onClick={() => { setSvOtp(""); setSvError(""); switchTab("register"); }}
              >
                ← Change email
              </button>
            </p>
          </>
        )}

        {/* ── Forgot Password ── */}
        {tab === "forgot" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "#FFF1F2", border: "1.5px solid #FECDD3",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px", fontSize: 22,
              }}>🔐</div>
              <h1 className={styles.heading} style={{ marginBottom: 4 }}>Forgot Password?</h1>
              <p className={styles.sub} style={{ marginBottom: 0 }}>
                Enter your registered email and we&apos;ll send you a 6-digit OTP.
              </p>
            </div>

            {fpError  && <div className={styles.errorBox}>{fpError}</div>}
            {fpSuccess && (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", borderRadius: 8, padding: "11px 14px", fontSize: 13, marginBottom: 18 }}>
                {fpSuccess}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className={styles.form}>
              <div className={styles.group}>
                <label className={styles.label}>Email address</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="you@email.com"
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={fpLoading}>
                {fpLoading && <span className={styles.spinner} />}
                {fpLoading ? "Sending OTP…" : "Send OTP"}
              </button>
            </form>

            <p className={styles.footer}>
              <button className={styles.switchLink} onClick={() => setTab("login")}>
                ← Back to Sign in
              </button>
            </p>
          </>
        )}

        {/* ── Reset Password ── */}
        {tab === "reset" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "#F0FDF4", border: "1.5px solid #BBF7D0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px", fontSize: 22,
              }}>✉️</div>
              <h1 className={styles.heading} style={{ marginBottom: 4 }}>Enter OTP</h1>
              <p className={styles.sub} style={{ marginBottom: 0 }}>
                We sent a 6-digit OTP to <strong>{fpEmail}</strong>.<br />
                Enter it below along with your new password.
              </p>
            </div>

            {resetError && <div className={styles.errorBox}>{resetError}</div>}

            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.group}>
                <label className={styles.label}>6-Digit OTP</label>
                <input
                  className={styles.input}
                  style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center", paddingLeft: 14 }}
                  placeholder="• • • • • •"
                  value={resetOtp}
                  onChange={e => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>

              <div className={styles.group}>
                <label className={styles.label}>New Password</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showResetPw ? "text" : "password"}
                    className={styles.input}
                    placeholder="Min 6 characters"
                    value={resetPw}
                    onChange={e => setResetPw(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowResetPw(v => !v)}>
                    <EyeIcon open={showResetPw} />
                  </button>
                </div>
              </div>

              <div className={styles.group}>
                <label className={styles.label}>Confirm New Password</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showResetPw ? "text" : "password"}
                    className={styles.input}
                    placeholder="Repeat password"
                    value={resetConfirm}
                    onChange={e => setResetConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={resetLoading}>
                {resetLoading && <span className={styles.spinner} />}
                {resetLoading ? "Resetting…" : "Reset Password"}
              </button>
            </form>

            <p className={styles.footer} style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <button className={styles.switchLink} style={{ fontSize: 12 }}
                onClick={() => { setFpError(""); setFpSuccess(""); setTab("forgot"); }}>
                ← Resend OTP
              </button>
              <button className={styles.switchLink} style={{ fontSize: 12 }}
                onClick={() => setTab("login")}>
                Back to Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}
