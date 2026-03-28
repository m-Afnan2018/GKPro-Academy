"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StudentGuard from "@/components/student/StudentGuard/StudentGuard";
import StudentNav from "@/components/student/StudentNav/StudentNav";
import { resourcesApi, type Resource, type Course, type Category } from "@/lib/api";
import styles from "./learn.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const TYPE_COLOR: Record<string, string> = {
  video: "#3B82F6", pdf: "#EF4444", link: "#8B5CF6", doc: "#F59E0B",
};

const TYPE_ICON = (t: string) => {
  if (t === "video") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
  if (t === "pdf") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
  if (t === "link") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
};

export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();

  const [course, setCourse]         = useState<Course | null>(null);
  const [resources, setResources]   = useState<Resource[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [active, setActive]         = useState<Resource | null>(null);
  const [accessUrl, setAccessUrl]   = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError]     = useState("");

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true); setError("");
    try {
      // Get course details
      const courseRes = await fetch(`${BASE}/courses/${slug}`);
      const courseJson = await courseRes.json();
      if (!courseJson.success) throw new Error(courseJson.message ?? "Course not found");
      const c: Course = courseJson.data.course;
      setCourse(c);

      // Get resources for this course
      const resRes = await resourcesApi.list(c._id, 1, 200);
      setResources(resRes.data.resources ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = async (r: Resource) => {
    if (active?._id === r._id && accessUrl) {
      window.open(accessUrl, "_blank");
      return;
    }
    setActive(r);
    setAccessUrl(null);
    setAccessError("");
    setAccessLoading(true);
    try {
      const res = await resourcesApi.access(r._id);
      setAccessUrl(res.data.url);
    } catch (e: any) {
      setAccessError(e.message);
    } finally {
      setAccessLoading(false);
    }
  };

  // Group by section
  const sections = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    const s = r.section || "General";
    if (!acc[s]) acc[s] = [];
    acc[s].push(r);
    return acc;
  }, {});

  const sectionList = Object.entries(sections);
  const catName = course && typeof course.categoryId === "object"
    ? (course.categoryId as Category).name
    : "";

  return (
    <StudentGuard>
      <StudentNav />
      <div className={styles.page}>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : error ? (
          <div className={styles.center}>
            <p style={{ color: "#DC2626", marginBottom: 12 }}>{error}</p>
            <Link href="/student/courses" className={styles.backLink}>← Back to My Courses</Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Sidebar: material list */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHead}>
                <Link href="/student/courses" className={styles.backBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  My Courses
                </Link>
                <h2 className={styles.courseTitle}>{course?.title}</h2>
                {catName && <span className={styles.catTag}>{catName}</span>}
                <div className={styles.countLine}>{resources.length} material{resources.length !== 1 ? "s" : ""}</div>
              </div>

              <div className={styles.materialList}>
                {!sectionList.length ? (
                  <div className={styles.emptyMaterials}>
                    <p>No materials available yet.</p>
                  </div>
                ) : (
                  sectionList.map(([sec, items]) => (
                    <div key={sec} className={styles.secGroup}>
                      <div className={styles.secLabel}>{sec}</div>
                      {items.map((r) => (
                        <button key={r._id}
                          className={`${styles.materialItem} ${active?._id === r._id ? styles.materialActive : ""}`}
                          onClick={() => handleOpen(r)}>
                          <span className={styles.materialIcon} style={{ color: TYPE_COLOR[r.type] ?? "#6B7280" }}>
                            {TYPE_ICON(r.type)}
                          </span>
                          <span className={styles.materialInfo}>
                            <span className={styles.materialTitle}>{r.title}</span>
                            {r.duration && <span className={styles.materialDur}>{r.duration}</span>}
                          </span>
                          {r.isPublic && <span className={styles.publicDot} title="Free preview" />}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* Main viewer */}
            <main className={styles.viewer}>
              {!active ? (
                <div className={styles.viewerEmpty}>
                  <div className={styles.viewerEmptyIcon}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className={styles.viewerEmptyTitle}>Select a lesson to begin</h3>
                  <p className={styles.viewerEmptySub}>Choose any material from the list on the left.</p>
                </div>
              ) : (
                <div className={styles.viewerContent}>
                  <div className={styles.viewerHeader}>
                    <div>
                      <span className={styles.viewerType} style={{ background: TYPE_COLOR[active.type] + "20", color: TYPE_COLOR[active.type] }}>
                        {active.type.toUpperCase()}
                      </span>
                      <h2 className={styles.viewerTitle}>{active.title}</h2>
                      {active.description && <p className={styles.viewerDesc}>{active.description}</p>}
                    </div>
                    {active.duration && <span className={styles.viewerDur}>{active.duration}</span>}
                  </div>

                  {accessLoading && (
                    <div className={styles.accessLoading}><div className={styles.spinner} /> Loading content…</div>
                  )}

                  {accessError && (
                    <div className={styles.accessError}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {accessError}
                    </div>
                  )}

                  {accessUrl && !accessLoading && (
                    <div className={styles.viewerFrame}>
                      {active.type === "video" && (
                        <VideoEmbed url={accessUrl} title={active.title} />
                      )}
                      {(active.type === "pdf" || active.type === "doc") && (
                        <div className={styles.docView}>
                          <iframe src={accessUrl} className={styles.pdfFrame} title={active.title} />
                          <a href={accessUrl} target="_blank" rel="noreferrer" className={styles.openExternal}>
                            Open in new tab ↗
                          </a>
                        </div>
                      )}
                      {active.type === "link" && (
                        <div className={styles.linkView}>
                          <a href={accessUrl} target="_blank" rel="noreferrer" className={styles.bigLink}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            Open Resource Link ↗
                          </a>
                          <p className={styles.linkUrl}>{accessUrl}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </StudentGuard>
  );
}

// Smart video embed: YouTube, Google Drive, or generic
function VideoEmbed({ url, title }: { url: string; title: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);

  if (ytMatch) {
    return (
      <iframe
        className={styles.videoFrame}
        src={`https://www.youtube.com/embed/${ytMatch[1]}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (driveMatch) {
    return (
      <iframe
        className={styles.videoFrame}
        src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`}
        title={title}
        allow="autoplay"
        allowFullScreen
      />
    );
  }
  return (
    <div className={styles.docView}>
      <a href={url} target="_blank" rel="noreferrer" className={styles.bigLink}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Open Video ↗
      </a>
    </div>
  );
}
