"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { usersApi, type User } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Edit modal
  const [editUser, setEditUser]   = useState<User | null>(null);
  const [editRole, setEditRole]   = useState<User["role"]>("student");
  const [editActive, setActive]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete confirm
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await usersApi.list(page, LIMIT);
      setUsers(res.data.users ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditRole(u.role);
    setActive(u.isActive);
    setSaveError("");
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    setSaveError("");
    try {
      await usersApi.update(editUser._id, { role: editRole, isActive: editActive });
      setEditUser(null);
      load();
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteUser._id);
      setDeleteUser(null);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const roleBadge = (r: string) =>
    r === "admin" ? "red" : r === "manager" ? "blue" : "gray";

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
                    <input
                      className={styles.searchInput}
                      placeholder="Search by name or email…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className={styles.filterSelect}
                    value={roleFilter}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>
                    {total} total users
                  </span>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
                  Loading…
                </div>
              ) : !filtered.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>👤</div>
                  <div className={styles.emptyText}>No users found</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className={styles.nameCell}>
                            <div className={styles.nameAvatar}>{u.name[0]?.toUpperCase()}</div>
                            <div>
                              <div className={styles.namePrimary}>{u.name}</div>
                              <div className={styles.nameSecondary}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{u.phone || "—"}</td>
                        <td>
                          <Badge variant={roleBadge(u.role) as any}>
                            {u.role}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={u.isActive ? "green" : "red"}>
                            {u.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={`${styles.btnGhost} ${styles.btnGhostBlue}`}
                              onClick={() => openEdit(u)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              className={`${styles.btnGhost} ${styles.btnGhostRed}`}
                              onClick={() => setDeleteUser(u)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
                              </svg>
                              Delete
                            </button>
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
                  <span>
                    Page {page} of {totalPages} · {total} users
                  </span>
                  <div className={styles.pages}>
                    <button
                      className={styles.pageBtn}
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <button
                          key={pg}
                          className={`${styles.pageBtn} ${pg === page ? styles.pageBtnActive : ""}`}
                          onClick={() => setPage(pg)}
                        >
                          {pg}
                        </button>
                      );
                    })}
                    <button
                      className={styles.pageBtn}
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <div className={styles.form}>
            {saveError && <div className={styles.errorBanner}>{saveError}</div>}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name</label>
              <input className={styles.formInput} value={editUser.name} readOnly />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input className={styles.formInput} value={editUser.email} readOnly />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <select
                  className={styles.formSelect}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as User["role"])}
                >
                  <option value="student">Student</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select
                  className={styles.formSelect}
                  value={editActive ? "active" : "inactive"}
                  onChange={(e) => setActive(e.target.value === "active")}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setEditUser(null)}>
                Cancel
              </button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)} title="Delete User" width={400}>
        {deleteUser && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Are you sure you want to delete <strong>{deleteUser.name}</strong>?
              This action cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteUser(null)}>
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                style={{ background: "#DC2626" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
