"use client";
import { useState } from "react";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { authApi } from "@/lib/api";
import { getStudentUser, saveStudentSession, getStudentToken } from "@/lib/studentAuth";
import styles from "./profile.module.css";

export default function StudentProfilePage() {
  const user = getStudentUser();

  const [name, setName]         = useState(user?.name ?? "");
  const [phone, setPhone]       = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (password && password !== confirm) { setError("Passwords do not match."); return; }
    if (password && password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setSaving(true);
    try {
      const body: Record<string, string> = { name, phone };
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
              <div className={styles.avatar}>{initials}</div>
              <div>
                <div className={styles.avatarName}>{user?.name}</div>
                <div className={styles.avatarEmail}>{user?.email}</div>
                <span className={styles.roleBadge}>Student</span>
              </div>
            </div>

            <div className={styles.divider} />

            {success && <div className={styles.successBox}>{success}</div>}
            {error   && <div className={styles.errorBox}>{error}</div>}

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
