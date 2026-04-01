"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import { coursesApi, facultyApi, type Category, type SubCategory, type Faculty } from "@/lib/api";
import CourseForm, { blankCF, formToPayload, type CF } from "../_components/CourseForm";
import styles from "../../admin.module.css";

export default function NewCoursePage() {
  const router = useRouter();

  const [form, setForm]               = useState<CF>(blankCF());
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const [categories, setCategories]   = useState<Category[]>([]);
  const [allSubcats, setAllSubcats]   = useState<SubCategory[]>([]);
  const [allFaculty, setAllFaculty]   = useState<Faculty[]>([]);

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

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSubmitting(true); setError("");
    try {
      await coursesApi.create(formToPayload(form) as any);
      router.push("/admin/courses");
    } catch (e: any) {
      setError(e.message ?? "Failed to create course.");
      setSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar title="New Course" />
          <div className={styles.content}>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#6B7280" }}>
              <Link href="/admin/courses" style={{ color: "#6B7280", textDecoration: "none" }}>Courses</Link>
              <span>›</span>
              <span style={{ color: "#111827", fontWeight: 600 }}>New Course</span>
            </div>

            <div className={styles.card} style={{ maxWidth: 820, padding: "28px 32px" }}>
              <CourseForm
                f={form}
                setF={setForm}
                categories={categories}
                subcatsFor={subcatsFor}
                allFaculty={allFaculty}
                error={error}
              />

              {/* Actions — below the form card */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 28, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
                <Link
                  href="/admin/courses"
                  style={{
                    padding: "9px 20px", fontSize: 13, fontWeight: 600,
                    border: "1.5px solid #E5E7EB", borderRadius: 8,
                    color: "#374151", background: "#fff", textDecoration: "none",
                  }}
                >
                  Cancel
                </Link>
                <button
                  className={styles.btnPrimary}
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ minWidth: 130 }}
                >
                  {submitting ? "Creating…" : "Create Course"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
