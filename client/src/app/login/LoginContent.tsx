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

function AuthPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") ?? "";
  const defaultTab   = searchParams.get("tab") === "register" ? "register" : "login";

  const [tab, setTab] = useState<"login" | "register">(defaultTab);

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

  useEffect(() => {
    // Redirect already-logged-in users
    if (getToken()) { router.replace("/admin/dashboard"); return; }
    if (getStudentToken()) { router.replace("/student/dashboard"); return; }
  }, [router]);

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    setLoginError(""); setRegError("");
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
      const res = await authApi.register(regName, regEmail, regPhone, regPassword);
      const { token, user } = res.data;
      saveStudentSession(token, user);
      router.push(next || "/student/dashboard");
    } catch (err: any) {
      setRegError(err.message ?? "Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
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
