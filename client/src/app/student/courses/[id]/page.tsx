"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { type Resource, type Course } from "@/lib/api";
import styles from "./learn.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/** Append ?token= to local /uploads/ URLs so the browser can load them directly */
function authedUrl(url: string): string {
  if (!url) return url;
  const isUpload = url.includes("/uploads/");
  if (!isUpload) return url;
  const tk = typeof window !== "undefined" ? localStorage.getItem("gkpro_student_token") : null;
  if (!tk) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(tk)}`;
}

const TYPE_LABELS: Record<string, string> = {
  video: "Video", pdf: "PDF", link: "Link", doc: "Document", meet: "Live Class", excel: "Excel Spreadsheet",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  pdf: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  link: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  doc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  meet: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
    </svg>
  ),
  excel: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="14" y2="9"/>
    </svg>
  ),
};

interface BatchCourse {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  eBookUrl?: string | null;
  handbookUrl?: string | null;
  expiryDate?: string | null;
}

interface EnrollmentDetail {
  _id: string;
  studentId: any;
  courseId: BatchCourse | string;
  mode: "online" | "recorded";
  status: string;
  enrolledAt: string;
  expiresAt?: string;
}

export default function LearnPage() {
  const { id: enrollmentId } = useParams<{ id: string }>();
  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [resources, setResources]   = useState<Resource[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [activeResource, setActiveResource] = useState<Resource | null>(null);

  useEffect(() => {
    if (!enrollmentId) return;
    const tk = typeof window !== "undefined" ? localStorage.getItem("gkpro_student_token") : null;
    if (!tk) return;

    const fetchJson = (url: string) =>
      fetch(url, { headers: { Authorization: `Bearer ${tk}` } }).then(r => r.json());

    const run = async () => {
      try {
        const json = await fetchJson(`${BASE}/enrollments/${enrollmentId}`);
        if (!json.success) { setError(json.message ?? "Enrollment not found."); return; }
        const e = json.data as EnrollmentDetail;
        setEnrollment(e);

        const courseId = typeof e.courseId === "object" ? e.courseId._id : e.courseId;

        if (courseId) {
          const modeParam = e.mode ? `&mode=${e.mode}` : "";
          const courseRj = await fetchJson(`${BASE}/resources?courseId=${courseId}&limit=200${modeParam}`);
          const all: Resource[] = courseRj?.data?.resources ?? [];
          setResources(all);
          if (all.length) setActiveResource(all[0]);
        }
      } catch {
        setError("Failed to load course data.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [enrollmentId]);

  // Group resources by section
  const sections = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    const s = r.section || "General";
    if (!acc[s]) acc[s] = [];
    acc[s].push(r);
    return acc;
  }, {});

  const course = typeof enrollment?.courseId === "object" ? enrollment.courseId as BatchCourse : null;
  const batchMode = enrollment?.mode;
  const courseExpiryDate = course?.expiryDate ?? null;
  const isExpired = !!(courseExpiryDate && new Date(courseExpiryDate) < new Date());

  const renderContent = (r: Resource) => {
    const resourceUrl = authedUrl(r.url);

    if (r.type === "video") {
      // YouTube embed
      const ytMatch = r.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        return (
          <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden" }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytMatch[1]}`}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              allowFullScreen
              title={r.title}
            />
          </div>
        );
      }
      // Google Drive video
      const driveMatch = r.url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
      if (driveMatch) {
        return (
          <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden" }}>
            <iframe
              src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              allowFullScreen
              title={r.title}
            />
          </div>
        );
      }
      // Local uploaded video — embed directly with token
      if (r.url.includes("/uploads/")) {
        return (
          <div style={{ borderRadius: 12, overflow: "hidden", background: "#000" }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video controls style={{ width: "100%", maxHeight: 480 }} src={resourceUrl}>
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
    }

    if (r.type === "pdf" && r.url.includes("/uploads/")) {
      // Embedded PDF viewer for local files
      return (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
          <iframe
            src={resourceUrl}
            style={{ width: "100%", height: 600, border: "none" }}
            title={r.title}
          />
          <div style={{ padding: "10px 16px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "flex-end" }}>
            <a href={resourceUrl} target="_blank" rel="noreferrer" download
              style={{ fontSize: 13, color: "#D42B3A", fontWeight: 600, textDecoration: "none" }}>
              Download PDF ↗
            </a>
          </div>
        </div>
      );
    }

    if (r.type === "excel") {
      // Google Drive Excel preview
      const driveMatch = r.url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
      if (driveMatch) {
        return (
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
            <iframe
              src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`}
              style={{ width: "100%", height: 600, border: "none" }}
              title={r.title}
            />
            <div style={{ padding: "10px 16px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "flex-end" }}>
              <a href={r.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: "#16A34A", fontWeight: 600, textDecoration: "none" }}>
                Open in Google Drive ↗
              </a>
            </div>
          </div>
        );
      }
      // OneDrive / SharePoint
      const oneDriveMatch = r.url.match(/onedrive\.live\.com|sharepoint\.com/i);
      if (oneDriveMatch) {
        const embedSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(r.url)}`;
        return (
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
            <iframe
              src={embedSrc}
              style={{ width: "100%", height: 600, border: "none" }}
              title={r.title}
            />
          </div>
        );
      }
      // Local uploaded Excel — download card
      return (
        <div style={{ background: "#F0FDF4", borderRadius: 12, border: "1.5px solid #BBF7D0", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: 14, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="14" y2="9"/>
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#14532D", marginBottom: 6 }}>{r.title}</div>
          {r.description && <div style={{ fontSize: 13, color: "#166534", marginBottom: 4 }}>{r.description}</div>}
          {r.duration && <div style={{ fontSize: 12, color: "#4ADE80", marginBottom: 20 }}>Duration: {r.duration}</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={resourceUrl} download target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#16A34A", color: "#fff", padding: "12px 28px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Excel
            </a>
          </div>
        </div>
      );
    }

    if (r.type === "meet") {
      return (
        <div style={{ background: "linear-gradient(135deg,#1a1a2e,#3a3a5c)", borderRadius: 12, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
          </div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{r.title}</div>
          {r.description && <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 20 }}>{r.description}</div>}
          <a href={r.url} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#D42B3A", color: "#fff", padding: "12px 28px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
            Join Live Class
          </a>
        </div>
      );
    }

    // PDF (external) / link / doc — open in new tab
    return (
      <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "40px 32px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          {TYPE_ICONS[r.type]}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{r.title}</div>
        {r.description && <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>{r.description}</div>}
        {r.duration && <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>Duration: {r.duration}</div>}
        <a href={resourceUrl} target="_blank" rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#D42B3A", color: "#fff", padding: "12px 28px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          Open {TYPE_LABELS[r.type] ?? r.type}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    );
  };

  return (
    <StudentGuard>
      <div className={styles.page}>
        <StudentNav />
        <div className={styles.container}>
          {loading ? (
            <div className={styles.loading}>Loading course…</div>
          ) : error ? (
            <div className={styles.error}>{error} <Link href="/student/courses">← Back</Link></div>
          ) : !enrollment ? null : (
            <>
              {/* Header */}
              <div className={styles.header}>
                <Link href="/student/courses" className={styles.back}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  My Courses
                </Link>
                <div className={styles.courseInfo}>
                  <h1 className={styles.courseTitle}>{course?.title ?? "Course"}</h1>
                  <div className={styles.metaRow}>
                    <span className={styles.metaBadge}>
                      {batchMode === "recorded" ? "Recorded" : "Online (Live)"}
                    </span>
                    {courseExpiryDate && (
                      <span className={styles.metaText} style={{ color: isExpired ? "#DC2626" : undefined }}>
                        · {isExpired ? "Expired" : "Access until"} {new Date(courseExpiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expired gate */}
              {isExpired ? (
                <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: 14, border: "1.5px solid #FECACA", maxWidth: 520, margin: "40px auto" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Access Expired</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
                    Your access to <strong>{course?.title}</strong> expired on{" "}
                    <strong>{new Date(courseExpiryDate!).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.
                    Please re-enroll or contact support to regain access.
                  </p>
                  <Link
                    href={course?.slug ? `/courses/${course.slug}` : "/courses"}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#D42B3A", color: "#fff", padding: "12px 28px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
                  >
                    Re-enroll in this Course
                  </Link>
                </div>
              ) : null}

              {/* Main layout */}
              {!isExpired && <div className={styles.layout}>
                {/* Sidebar: resource list */}
                <aside className={styles.sidebar}>
                  <div className={styles.sidebarTitle}>Course Content</div>
                  {Object.keys(sections).length === 0 ? (
                    <p style={{ fontSize: 13, color: "#9CA3AF", padding: "12px 0" }}>No materials yet.</p>
                  ) : (
                    Object.entries(sections).map(([sec, items]) => (
                      <div key={sec} className={styles.section}>
                        <div className={styles.sectionTitle}>{sec}</div>
                        {items.map((r) => (
                          <button
                            key={r._id}
                            className={`${styles.resItem} ${activeResource?._id === r._id ? styles.resActive : ""}`}
                            onClick={() => setActiveResource(r)}
                          >
                            <span className={`${styles.resIcon} ${r.type === "meet" ? styles.resIconMeet : ""} ${r.type === "excel" ? styles.resIconExcel : ""}`}>
                              {TYPE_ICONS[r.type]}
                            </span>
                            <div className={styles.resInfo}>
                              <div className={styles.resTitle}>{r.title}</div>
                              {r.duration && <div className={styles.resDuration}>{r.duration}</div>}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))
                  )}

                  {/* Book PDFs included with the course */}
                  {(course?.eBookUrl || course?.handbookUrl) && (
                    <div className={styles.section} style={{ marginTop: 8, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
                      <div className={styles.sectionTitle}>Your Books</div>
                      {course.eBookUrl && (
                        <a
                          href={authedUrl(course.eBookUrl)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 8, textDecoration: "none", transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ width: 28, height: 28, borderRadius: 6, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#2563EB" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>eBook (PDF)</div>
                            <div style={{ fontSize: 11, color: "#2563EB" }}>Download ↗</div>
                          </div>
                        </a>
                      )}
                      {course.handbookUrl && (
                        <a
                          href={authedUrl(course.handbookUrl)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 8, textDecoration: "none", transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ width: 28, height: 28, borderRadius: 6, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#16A34A" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Handbook (PDF)</div>
                            <div style={{ fontSize: 11, color: "#16A34A" }}>Download ↗</div>
                          </div>
                        </a>
                      )}
                    </div>
                  )}
                </aside>

                {/* Main: content viewer */}
                <main className={styles.viewer}>
                  {activeResource ? (
                    <div>
                      <div className={styles.viewerTitle}>{activeResource.title}</div>
                      {activeResource.description && (
                        <p className={styles.viewerDesc}>{activeResource.description}</p>
                      )}
                      <div className={styles.viewerContent}>
                        {renderContent(activeResource)}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.viewerEmpty}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                      <p>Select a lesson from the sidebar to start learning</p>
                    </div>
                  )}
                </main>
              </div>}
            </>
          )}
        </div>
      </div>
    </StudentGuard>
  );
}
