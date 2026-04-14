"use client";
import { useState, useRef } from "react";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { authApi } from "@/lib/api";
import { getStudentUser, saveStudentSession, getStudentToken } from "@/lib/studentAuth";
import styles from "./profile.module.css";

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");

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

export default function StudentProfilePage() {
  const user = getStudentUser();

  const [name, setName]       = useState(user?.name ?? "");
  const [phone, setPhone]     = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [avatar, setAvatar]     = useState(user?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // password visibility
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // confirmation popup
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccess, setShowSuccess]           = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  const handleAvatarUpload = async (file: File) => {
    setUploading(true); setError("");
    try {
      const tk = getStudentToken();
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch(`${SERVER_BASE}/api/auth/me/avatar`, {
        method: "PATCH",
        headers: tk ? { Authorization: `Bearer ${tk}` } : {},
        body: fd,
      }).then((r) => r.json());
      if (!res.success) throw new Error(res.message ?? "Upload failed");
      setAvatar(res.data.avatarUrl);
      saveStudentSession(tk!, res.data.user);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* Called after user confirms in the popup */
  const doSave = async () => {
    setShowConfirmModal(false);
    setError(""); setSaving(true);
    try {
      const body: Record<string, any> = { name, phone, avatarUrl: avatar || null };
      if (password) body.password = password;
      const res = await authApi.updateMe(body);
      saveStudentSession(getStudentToken()!, res.data);
      setPassword(""); setConfirm("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message ?? "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  /* Validate then open confirm popup */
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password && password !== confirm) { setError("Passwords do not match."); return; }
    if (password && password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setShowConfirmModal(true);
  };

  return (
    <StudentGuard>
      <StudentNav />
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>My Profile</h1>

          <div className={styles.profileCard}>
            {/* Avatar block */}
            <div className={styles.avatarSection}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div className={styles.avatar} style={avatar ? { padding: 0, overflow: "hidden" } : {}}>
                  {avatar
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : initials
                  }
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title="Change photo"
                  style={{ position: "absolute", bottom: 2, right: 2, width: 24, height: 24, borderRadius: "50%", background: uploading ? "#9CA3AF" : "#111827", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer" }}
                >
                  {uploading
                    ? <span style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "block", animation: "spin 0.7s linear infinite" }} />
                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  }
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }} />
              </div>
              <div>
                <div className={styles.avatarName}>{user?.name}</div>
                <div className={styles.avatarEmail}>{user?.email}</div>
                <span className={styles.roleBadge}>Student</span>
              </div>
            </div>

            <div className={styles.divider} />

            {error && <div className={styles.errorBox}>{error}</div>}

            <form onSubmit={handleSave} className={styles.form}>
              <h2 className={styles.sectionHead}>Personal Information</h2>

              <div className={styles.row}>
                <div className={styles.group}>
                  <label className={styles.label}>Full Name *</label>
                  <input className={styles.input} value={name}
                    onChange={(e) => setName(e.target.value)} required placeholder="Your full name" />
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>Phone</label>
                  <input className={styles.input} type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)} placeholder="+91 9999999999" />
                </div>
              </div>

              <div className={styles.group}>
                <label className={styles.label}>Email address</label>
                <input className={`${styles.input} ${styles.inputDisabled}`} value={user?.email ?? ""} disabled />
                <p className={styles.hint}>Email cannot be changed.</p>
              </div>

              <h2 className={styles.sectionHead} style={{ marginTop: 8 }}>Change Password</h2>
              <p className={styles.hint} style={{ marginTop: -4 }}>Leave blank to keep your current password.</p>

              <div className={styles.row}>
                <div className={styles.group}>
                  <label className={styles.label}>New Password</label>
                  <div className={styles.pwWrap}>
                    <input
                      className={styles.input}
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>Confirm Password</label>
                  <div className={styles.pwWrap}>
                    <input
                      className={styles.input}
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat new password"
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving && <span className={styles.spinner} />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Account info card */}
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Member since</span>
              <span className={styles.infoVal}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Account status</span>
              <span className={`${styles.infoVal} ${styles.activeText}`}>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div className={styles.overlay} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D42B3A" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className={styles.modalTitle}>Save Changes?</h3>
            <p className={styles.modalText}>
              Are you sure you want to update your profile
              {password ? " and change your password" : ""}?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button className={styles.modalConfirm} onClick={doSave}>
                Yes, Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Toast ── */}
      {showSuccess && (
        <div className={styles.toast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
          </svg>
          Profile updated successfully!
        </div>
      )}
    </StudentGuard>
  );
}
