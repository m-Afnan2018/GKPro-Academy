"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { usersApi, type User } from "@/lib/api";
import { getUser as getAdminUser } from "@/lib/auth";
import styles from "../admin.module.css";

const LIMIT = 15;

const ROLE_BADGE: Record<string, "red" | "blue" | "gray"> = {
  admin: "red",
  manager: "blue",
  student: "gray",
};

/* ── small section divider used inside modals ── */
function Section({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: "#9CA3AF",
      textTransform: "uppercase", letterSpacing: "0.8px",
      borderBottom: "1px solid #F3F4F6", paddingBottom: 6, marginBottom: 2,
    }}>
      {title}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [meId, setMeId] = useState("");
  useEffect(() => { setMeId(getAdminUser()?._id ?? ""); }, []);

  /* ── Create modal ── */
  const [showCreate, setShowCreate] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cPass, setCPass] = useState("");
  const [cRole, setCRole] = useState<User["role"]>("student");
  const [cActive, setCActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  /* ── Edit modal ── */
  const [editUser, setEditUser] = useState<User | null>(null);
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eRole, setERole] = useState<User["role"]>("student");
  const [eActive, setEActive] = useState(true);
  const [ePass, setEPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await usersApi.list(page, LIMIT);
      setUsers(res.data.users ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone ?? "").includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  /* ── Create ── */
  const resetCreate = () => { setCName(""); setCEmail(""); setCPhone(""); setCPass(""); setCRole("student"); setCActive(true); setCreateError(""); };

  const handleCreate = async () => {
    if (!cName.trim()) { setCreateError("Name is required."); return; }
    if (!cEmail.trim()) { setCreateError("Email is required."); return; }
    if (!cPass.trim()) { setCreateError("Password is required."); return; }
    setCreating(true); setCreateError("");
    try {
      await usersApi.create({ name: cName, email: cEmail, phone: cPhone || undefined, password: cPass, role: cRole, isActive: cActive });
      setShowCreate(false); resetCreate(); load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  /* ── Edit ── */
  const openEdit = (u: User) => {
    setEditUser(u); setEName(u.name); setEEmail(u.email); setEPhone(u.phone ?? "");
    setERole(u.role); setEActive(u.isActive); setEPass(""); setSaveError("");
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true); setSaveError("");
    try {
      const body: any = { name: eName, email: eEmail, phone: ePhone || undefined, role: eRole, isActive: eActive };
      if (ePass.trim()) body.password = ePass;
      await usersApi.update(editUser._id, body);
      setEditUser(null); load();
    } catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget._id);
      setDeleteTarget(null); load();
    } catch (e: any) { setError(e.message); setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const canDelete = (u: User) => u._id !== meId; // self-deletion blocked on backend too, but hide button for clarity

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Users" />
          <div className={styles.content}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.card}>
              {/* Toolbar */}
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                      </svg>
                    </span>
                    <input className={styles.searchInput} placeholder="Search by name, email or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <select className={styles.filterSelect} value={roleFilter} onChange={(e) => setRole(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total users</span>
                  <button className={styles.btnPrimary} onClick={() => { resetCreate(); setShowCreate(true); }}>
                    + New User
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !filtered.length ? (
                <div className={styles.empty}><div className={styles.emptyIcon}>👤</div><div className={styles.emptyText}>No users found</div></div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr><th>User</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className={styles.nameCell}>
                            {
                              u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.name} className={styles.nameAvatar} />
                              ) : (
                                <div className={styles.nameAvatar} style={{ background: u.role === "admin" ? "#DC2626" : u.role === "manager" ? "#1D4ED8" : "var(--primary)" }}>
                                  {u.name[0]?.toUpperCase()}
                                </div>
                              )
                            }
                            <div>
                              <div className={styles.namePrimary}>{u.name} {u._id === meId && <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 400 }}>(you)</span>}</div>
                              <div className={styles.nameSecondary}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: "#6B7280" }}>{u.phone || "—"}</td>
                        <td><Badge variant={ROLE_BADGE[u.role] ?? "gray"}>{u.role}</Badge></td>
                        <td><Badge variant={u.isActive ? "green" : "red"}>{u.isActive ? "Active" : "Inactive"}</Badge></td>
                        <td style={{ fontSize: 12, color: "#6B7280" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actions}>
                            <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(u)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                            {canDelete(u) && (
                              <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteTarget(u)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <span>Page {page} of {totalPages} · {total} users</span>
                  <div className={styles.pages}>
                    <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return <button key={pg} className={`${styles.pageBtn} ${pg === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(pg)}>{pg}</button>;
                    })}
                    <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetCreate(); }} title="New User">
        <div className={styles.form}>
          {createError && <div className={styles.errorBanner}>{createError}</div>}

          <Section title="Basic Info" />
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name *</label>
              <input className={styles.formInput} placeholder="e.g. Rahul Sharma" value={cName} onChange={(e) => setCName(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone</label>
              <input className={styles.formInput} placeholder="+91 9876543210" value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email *</label>
            <input className={styles.formInput} type="email" placeholder="user@example.com" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
          </div>

          <Section title="Access" />
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Role *</label>
              <select className={styles.formSelect} value={cRole} onChange={(e) => setCRole(e.target.value as User["role"])}>
                <option value="student">Student</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={cActive ? "active" : "inactive"} onChange={(e) => setCActive(e.target.value === "active")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <Section title="Password" />
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password *</label>
            <input className={styles.formInput} type="password" placeholder="Min. 6 characters" value={cPass} onChange={(e) => setCPass(e.target.value)} />
          </div>

          <div className={styles.formActions}>
            <button className={styles.btnOutline} onClick={() => { setShowCreate(false); resetCreate(); }}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create User"}</button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <div className={styles.form}>
            {saveError && <div className={styles.errorBanner}>{saveError}</div>}

            <Section title="Basic Info" />
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input className={styles.formInput} value={eName} onChange={(e) => setEName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone</label>
                <input className={styles.formInput} value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input className={styles.formInput} type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
            </div>

            <Section title="Access" />
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <select className={styles.formSelect} value={eRole} onChange={(e) => setERole(e.target.value as User["role"])}>
                  <option value="student">Student</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select className={styles.formSelect} value={eActive ? "active" : "inactive"} onChange={(e) => setEActive(e.target.value === "active")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <Section title="Reset Password" />
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>New Password <span style={{ color: "#9CA3AF", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(leave blank to keep current)</span></label>
              <input className={styles.formInput} type="password" placeholder="Min. 6 characters" value={ePass} onChange={(e) => setEPass(e.target.value)} />
            </div>

            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setEditUser(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User" width={420}>
        {deleteTarget && (
          <div className={styles.form}>
            {/* User card preview */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {deleteTarget.name[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{deleteTarget.name}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{deleteTarget.email} · <Badge variant={ROLE_BADGE[deleteTarget.role] ?? "gray"}>{deleteTarget.role}</Badge></div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#4B5563", margin: 0 }}>
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </p>
            {deleteTarget.role === "admin" && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400E" }}>
                Warning: deleting an admin account. If this is the only admin, deletion will be blocked.
              </div>
            )}
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
