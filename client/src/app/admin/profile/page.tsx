"use client";
import { useState, useRef } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import { authApi } from "@/lib/api";
import { getUser, saveSession, getToken } from "@/lib/auth";
import styles from "../admin.module.css";

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");

export default function AdminProfilePage() {
  const user = typeof window !== "undefined" ? getUser() : null;

  const [name, setName]         = useState(user?.name ?? "");
  const [phone, setPhone]       = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [avatar, setAvatar]     = useState(user?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (user?.name ?? "A").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const handleAvatarUpload = async (file: File) => {
    setUploading(true); setError("");
    try {
      const tk = getToken();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${SERVER_BASE}/api/upload`, {
        method: "POST",
        headers: tk ? { Authorization: `Bearer ${tk}` } : {},
        body: fd,
      }).then((r) => r.json());
      if (!res.success) throw new Error(res.message ?? "Upload failed");
      const url = SERVER_BASE + res.data.url;
      setAvatar(url);
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
    if (password && password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setSaving(true);
    try {
      const body: Record<string, any> = { name, phone, avatarUrl: avatar || null };
      if (password) body.password = password;
      const res = await authApi.updateMe(body);
      saveSession(getToken()!, res.data);
      setSuccess("Profile updated successfully.");
      setPassword(""); setConfirm("");
    } catch (err: any) {
      setError(err.message ?? "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="My Profile" />
          <div className={styles.content}>
            <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Profile Card */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #F0F0F5", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Avatar section */}
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--primary)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", border: "3px solid #F0F0F5" }}>
                      {avatar
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : initials
                      }
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      title="Change photo"
                      style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: uploading ? "#9CA3AF" : "#111827", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer" }}
                    >
                      {uploading
                        ? <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "block", animation: "spin 0.7s linear infinite" }} />
                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      }
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{user?.name}</div>
                    <div style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 8px" }}>{user?.email}</div>
                    <span style={{ display: "inline-block", padding: "3px 12px", background: "#FEE2E2", color: "var(--primary)", fontSize: 11, fontWeight: 700, borderRadius: 50, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {user?.role ?? "Admin"}
                    </span>
                  </div>
                </div>

                <div style={{ height: 1, background: "#F0F0F5" }} />

                {success && <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", borderRadius: 8, padding: "11px 14px", fontSize: 13 }}>{success}</div>}
                {error   && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 8, padding: "11px 14px", fontSize: 13 }}>{error}</div>}

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Personal Information</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className={styles.formLabel}>Full Name *</label>
                      <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className={styles.formLabel}>Phone</label>
                      <input className={styles.formInput} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9999999999" />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label className={styles.formLabel}>Email address</label>
                    <input className={styles.formInput} value={user?.email ?? ""} disabled style={{ background: "#F9FAFB", color: "#9CA3AF", cursor: "not-allowed" }} />
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Email cannot be changed.</p>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginTop: 4 }}>Change Password</div>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: -10 }}>Leave blank to keep your current password.</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className={styles.formLabel}>New Password</label>
                      <input className={styles.formInput} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label className={styles.formLabel}>Confirm Password</label>
                      <input className={styles.formInput} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" />
                    </div>
                  </div>

                  <div className={styles.formActions} style={{ paddingTop: 8 }}>
                    <button type="submit" className={styles.btnPrimary} disabled={saving || uploading}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Info card */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #F0F0F5", padding: "18px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["Member since", user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"],
                  ["Account status", "Active"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#6B7280" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: label === "Account status" ? "#16A34A" : "#111827" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminGuard>
  );
}
