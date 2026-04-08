"use client";
import { useState, useRef } from "react";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { authApi } from "@/lib/api";
import { getStudentUser, saveStudentSession, getStudentToken } from "@/lib/studentAuth";
import styles from "./profile.module.css";

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");

export default function StudentProfilePage() {
  const user = getStudentUser();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  const handleAvatarUpload = async (file: File) => {
    setUploading(true); setError(""); setSuccess("");
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
      const newUrl = res.data.avatarUrl;
      setAvatar(newUrl);
      // Persist updated user to session so navbar/other pages reflect the new avatar
      saveStudentSession(tk!, res.data.user);
      setSuccess("Profile photo updated.");
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (password && password !== confirm) { setError("Passwords do not match."); return; }
    if (password && password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSaving(true);
    try {
      const body: Record<string, any> = { name, phone, avatarUrl: avatar || null };
      if (password) body.password = password;
      const res = await authApi.updateMe(body);
      const token = getStudentToken()!;
      saveStudentSession(token, res.data);
      setSuccess("Profile updated successfully.");
      setPassword(""); setConfirm("");
    } catch (err: any) {
      setError(err.message ?? "Update failed.");
    } finally {
      setSaving(false);
    }
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

            {success && <div className={styles.successBox}>{success}</div>}
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
                  <input className={styles.input} type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>Confirm Password</label>
                  <input className={styles.input} type="password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" />
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
    </StudentGuard>
  );
}
