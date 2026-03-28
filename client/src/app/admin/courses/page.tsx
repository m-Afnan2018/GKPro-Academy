"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { coursesApi, type Course, type Category, type SubCategory } from "@/lib/api";
import styles from "../admin.module.css";

const LIMIT = 10;

export default function CoursesPage() {
  const [courses, setCourses]       = useState<Course[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const [categories, setCategories]       = useState<Category[]>([]);
  const [allSubcats, setAllSubcats]       = useState<SubCategory[]>([]);

  // Create modal state
  const [showCreate, setShowCreate]     = useState(false);
  const [createTitle, setCreateTitle]   = useState("");
  const [createCat, setCreateCat]       = useState("");
  const [createSubcat, setCreateSubcat] = useState("");
  const [createDesc, setCreateDesc]     = useState("");
  const [createStatus, setCreateStatus] = useState<Course["status"]>("draft");
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState("");

  // Edit modal state
  const [editCourse, setEditCourse]     = useState<Course | null>(null);
  const [editTitle, setEditTitle]       = useState("");
  const [editCat, setEditCat]           = useState("");
  const [editSubcat, setEditSubcat]     = useState("");
  const [editDesc, setEditDesc]         = useState("");
  const [editStatus, setEditStatus]     = useState<Course["status"]>("draft");
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState("");

  // Delete confirm
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await coursesApi.list(page, LIMIT);
      setCourses(res.data.courses ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    coursesApi.categories().then((r) => setCategories(r.data.categories ?? [])).catch(() => {});
    coursesApi.subcategories().then((r) => setAllSubcats(r.data.subcategories ?? [])).catch(() => {});
  }, []);

  // Subcats filtered to the currently selected parent category (for the modals)
  const subcatsFor = (catId: string) =>
    allSubcats.filter((s) => {
      const sId = typeof s.categoryId === "object" ? (s.categoryId as Category)._id : s.categoryId;
      return sId === catId;
    });

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const catName = (c: Course) => {
    if (typeof c.categoryId === "object" && c.categoryId !== null) return (c.categoryId as Category).name;
    return categories.find((cat) => cat._id === c.categoryId)?.name ?? "—";
  };

  const subcatName = (c: Course) => {
    if (!c.subcategoryId) return null;
    if (typeof c.subcategoryId === "object") return (c.subcategoryId as SubCategory).name;
    return allSubcats.find((s) => s._id === c.subcategoryId)?.name ?? null;
  };

  const openEdit = (c: Course) => {
    setEditCourse(c);
    setEditTitle(c.title);
    setEditCat(typeof c.categoryId === "object" ? (c.categoryId as Category)._id : (c.categoryId as string));
    setEditSubcat(
      c.subcategoryId
        ? typeof c.subcategoryId === "object"
          ? (c.subcategoryId as SubCategory)._id
          : (c.subcategoryId as string)
        : ""
    );
    setEditDesc(c.description ?? "");
    setEditStatus(c.status);
    setSaveError("");
  };

  const handleCreate = async () => {
    if (!createTitle.trim()) { setCreateError("Title is required"); return; }
    setCreating(true); setCreateError("");
    try {
      await coursesApi.create({
        title: createTitle,
        categoryId: createCat || undefined,
        subcategoryId: createSubcat || undefined,
        description: createDesc,
        status: createStatus,
      } as any);
      setShowCreate(false);
      setCreateTitle(""); setCreateCat(""); setCreateSubcat(""); setCreateDesc(""); setCreateStatus("draft");
      load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!editCourse) return;
    setSaving(true); setSaveError("");
    try {
      await coursesApi.update(editCourse._id, {
        title: editTitle,
        categoryId: editCat || undefined,
        subcategoryId: editSubcat || null,
        description: editDesc,
        status: editStatus,
      } as any);
      setEditCourse(null); load();
    } catch (e: any) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteCourse) return;
    setDeleting(true);
    try { await coursesApi.remove(deleteCourse._id); setDeleteCourse(null); load(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const statusBadge   = (s: string) => s === "published" ? "green" : s === "archived" ? "red" : "gray";
  const approvalBadge = (s: string) => s === "approved" ? "green" : s === "rejected" ? "red" : s === "pending" ? "yellow" : "gray";

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="Courses" />
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
                    <input className={styles.searchInput} placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total courses</span>
                  <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setCreateError(""); }}>
                    + New Course
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !filtered.length ? (
                <div className={styles.empty}><div className={styles.emptyIcon}>📚</div><div className={styles.emptyText}>No courses found</div></div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category / Subcategory</th>
                      <th>Status</th>
                      <th>Approval</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c._id}>
                        <td>
                          <div className={styles.namePrimary}>{c.title}</div>
                          <div className={styles.nameSecondary}>{c.slug}</div>
                        </td>
                        <td>
                          <div className={styles.namePrimary}>{catName(c)}</div>
                          {subcatName(c) && <div className={styles.nameSecondary}>{subcatName(c)}</div>}
                        </td>
                        <td><Badge variant={statusBadge(c.status) as any}>{c.status}</Badge></td>
                        <td><Badge variant={approvalBadge(c.approvalStatus) as any}>{c.approvalStatus}</Badge></td>
                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actions}>
                            <a href={`/admin/courses/${c._id}/materials`} className={`${styles.btnGhost} ${styles.btnGhostGreen}`} style={{ textDecoration: "none" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Materials
                            </a>
                            <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(c)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                            <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteCourse(c)}>
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
                  <span>Page {page} of {totalPages} · {total} courses</span>
                  <div className={styles.pages}>
                    <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return <button key={pg} className={`${styles.pageBtn} ${pg === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(pg)}>{pg}</button>;
                    })}
                    <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Course">
        <div className={styles.form}>
          {createError && <div className={styles.errorBanner}>{createError}</div>}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Title *</label>
            <input className={styles.formInput} placeholder="Course title" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select className={styles.formSelect} value={createCat} onChange={(e) => { setCreateCat(e.target.value); setCreateSubcat(""); }}>
                <option value="">— Select category —</option>
                {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subcategory</label>
              <select className={styles.formSelect} value={createSubcat} onChange={(e) => setCreateSubcat(e.target.value)} disabled={!createCat}>
                <option value="">— Select subcategory —</option>
                {subcatsFor(createCat).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={styles.formTextarea} rows={3} placeholder="Short description…" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <select className={styles.formSelect} value={createStatus} onChange={(e) => setCreateStatus(e.target.value as Course["status"])}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create Course"}</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editCourse} onClose={() => setEditCourse(null)} title="Edit Course">
        {editCourse && (
          <div className={styles.form}>
            {saveError && <div className={styles.errorBanner}>{saveError}</div>}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title</label>
              <input className={styles.formInput} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select className={styles.formSelect} value={editCat} onChange={(e) => { setEditCat(e.target.value); setEditSubcat(""); }}>
                  <option value="">— Select category —</option>
                  {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subcategory</label>
                <select className={styles.formSelect} value={editSubcat} onChange={(e) => setEditSubcat(e.target.value)} disabled={!editCat}>
                  <option value="">— None —</option>
                  {subcatsFor(editCat).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea className={styles.formTextarea} rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={editStatus} onChange={(e) => setEditStatus(e.target.value as Course["status"])}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setEditCourse(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteCourse} onClose={() => setDeleteCourse(null)} title="Delete Course" width={400}>
        {deleteCourse && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Are you sure you want to delete <strong>{deleteCourse.title}</strong>? This action cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteCourse(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete Course"}</button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
