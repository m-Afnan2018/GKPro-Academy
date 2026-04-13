"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Badge from "@/components/admin/Badge/Badge";
import Modal from "@/components/admin/Modal/Modal";
import { coursesApi, facultyApi, type Course, type Category, type SubCategory, type Faculty } from "@/lib/api";
import CourseForm, { courseToForm, formToPayload, type CF } from "./_components/CourseForm";
import styles from "../admin.module.css";

const LIMIT = 10;

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcats, setAllSubcats] = useState<SubCategory[]>([]);
  const [allFaculty, setAllFaculty] = useState<Faculty[]>([]);

  // Edit
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editForm, setEditForm]     = useState<CF | null>(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");

  // Delete
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
    coursesApi.categories().then(r => setCategories(r.data.categories ?? [])).catch(() => {});
    coursesApi.subcategories().then(r => setAllSubcats(r.data.subcategories ?? [])).catch(() => {});
    facultyApi.list(1, 200).then(r => setAllFaculty(r.data.faculty ?? [])).catch(() => {});
  }, []);

  const subcatsFor = (catId: string) =>
    allSubcats.filter(s => {
      if (!s.categoryId) return false;
      const id = typeof s.categoryId === "object" ? (s.categoryId as Category)._id : s.categoryId;
      return id === catId;
    });

  const filtered = courses.filter(c => {
    const ms = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const mv = !statusFilter || c.status === statusFilter;
    return ms && mv;
  });

  const catName = (c: Course) => {
    if (c.categoryId && typeof c.categoryId === "object") return (c.categoryId as Category).name;
    if (typeof c.categoryId === "string") return categories.find(cat => cat._id === c.categoryId)?.name ?? "—";
    return "—";
  };

  const subcatName = (c: Course) => {
    if (!c.subcategoryId) return null;
    if (typeof c.subcategoryId === "object") return (c.subcategoryId as SubCategory).name;
    return allSubcats.find(s => s._id === c.subcategoryId)?.name ?? null;
  };

  const openEdit = (c: Course) => {
    setEditCourse(c);
    setEditForm(courseToForm(c));
    setSaveError("");
  };

  const handleSave = async () => {
    if (!editCourse || !editForm) return;
    setSaving(true); setSaveError("");
    try {
      await coursesApi.update(editCourse._id, formToPayload(editForm) as any);
      setEditCourse(null); setEditForm(null); load();
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

  const totalPages    = Math.ceil(total / LIMIT);
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
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input className={styles.searchInput} placeholder="Search by title…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
                  <Link href="/admin/courses/new" className={styles.btnPrimary} style={{ textDecoration: "none" }}>
                    + New Course
                  </Link>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading…</div>
              ) : !filtered.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📚</div>
                  <div className={styles.emptyText}>No courses found</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      {/*<th>Teacher</th>*/}
                      <th>Pricing</th>
                      <th>Status</th>
                      {/*<th>Approval</th>*/}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c._id}>
                        <td>
                          <div className={styles.namePrimary}>{c.title}</div>
                          <div className={styles.nameSecondary}>{c.slug}</div>
                        </td>
                        <td>
                          <div className={styles.namePrimary}>{catName(c)}</div>
                          {subcatName(c) && <div className={styles.nameSecondary}>{subcatName(c)}</div>}
                        </td>
                        {/*<td style={{ fontSize: 12, color: "#374151" }}>
                          {(c as any).teacherName ?? <span style={{ color: "#9CA3AF" }}>—</span>}
                        </td>*/}
                        <td>
                          {c.onlinePrice   && <div className={styles.nameSecondary}>Online: ₹{c.onlinePrice.toLocaleString("en-IN")}</div>}
                          {c.recordedPrice && <div className={styles.nameSecondary}>Recorded: ₹{c.recordedPrice.toLocaleString("en-IN")}</div>}
                          {!c.onlinePrice && !c.recordedPrice && <span style={{ color: "#9CA3AF", fontSize: 12 }}>—</span>}
                        </td>
                        <td><Badge variant={statusBadge(c.status) as any}>{c.status}</Badge></td>
                        {/*<td><Badge variant={approvalBadge(c.approvalStatus) as any}>{c.approvalStatus}</Badge></td>*/}
                        <td>
                          <div className={styles.actions}>
                            <a
                              href={`/courses/${c.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.btnGhost} ${styles.btnGhostGreen}`}
                              style={{ textDecoration: "none" }}
                              title="View on public website"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                              View
                            </a>
                            <a
                              href={`/admin/courses/${c._id}/materials`}
                              className={styles.btnGhost}
                              style={{ textDecoration: "none", color: "#374151" }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                              Materials
                            </a>
                            <button className={`${styles.btnGhost} ${styles.btnGhostBlue}`} onClick={() => openEdit(c)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Edit
                            </button>
                            <button className={`${styles.btnGhost} ${styles.btnGhostRed}`} onClick={() => setDeleteCourse(c)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <span>Page {page} of {totalPages} · {total} courses</span>
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

      {/* Edit modal */}
      <Modal open={!!editCourse} onClose={() => { setEditCourse(null); setEditForm(null); }} title="Edit Course">
        {editCourse && editForm && (
          <>
            <CourseForm
              f={editForm}
              setF={setEditForm}
              categories={categories}
              subcatsFor={subcatsFor}
              allFaculty={allFaculty}
              error={saveError}
              editSlug={editCourse.slug}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
              <button className={styles.btnOutline} onClick={() => { setEditCourse(null); setEditForm(null); }}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving} style={{ minWidth: 120 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteCourse} onClose={() => setDeleteCourse(null)} title="Delete Course" width={400}>
        {deleteCourse && (
          <div className={styles.form}>
            <p style={{ fontSize: 14, color: "#4B5563" }}>
              Delete <strong>{deleteCourse.title}</strong>? This cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteCourse(null)}>Cancel</button>
              <button className={styles.btnPrimary} style={{ background: "#DC2626" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete Course"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminGuard>
  );
}
