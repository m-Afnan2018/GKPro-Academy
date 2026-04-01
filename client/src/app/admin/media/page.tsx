"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import Topbar from "@/components/admin/Topbar/Topbar";
import Modal from "@/components/admin/Modal/Modal";
import { mediaApi, MediaFile } from "@/lib/api";
import adminStyles from "../admin.module.css";
import styles from "./media.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const UPLOAD_URL = BASE.replace(/\/api$/, "") + "/api/media/upload";

type FilterType = "all" | "image" | "video" | "pdf" | "document";
type ViewMode = "grid" | "list";

const TYPE_LABELS: Record<string, string> = {
  all: "All", image: "Images", video: "Videos", pdf: "PDFs", document: "Documents",
};

function typeColor(type: string) {
  switch (type) {
    case "image":    return styles.typeImage;
    case "video":    return styles.typeVideo;
    case "pdf":      return styles.typePdf;
    case "document": return styles.typeDocument;
    default:         return styles.typeOther;
  }
}
function iconBg(type: string) {
  switch (type) {
    case "image":    return styles.iconImage;
    case "video":    return styles.iconVideo;
    case "pdf":      return styles.iconPdf;
    case "document": return styles.iconDocument;
    default:         return styles.iconAll;
  }
}

function FileTypeIcon({ type, size = 22 }: { type: string; size?: number }) {
  if (type === "image") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
  if (type === "video") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  );
  if (type === "pdf") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
      <line x1="9" y1="11" x2="15" y2="11"/>
    </svg>
  );
  if (type === "document") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      <polyline points="13 2 13 9 20 9"/>
    </svg>
  );
}

function serverUrl(url: string) {
  const origin = BASE.replace(/\/api$/, "");
  return url.startsWith("http") ? url : `${origin}${url}`;
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lightbox, setLightbox] = useState<MediaFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "green" | "red" | "" } | null>(null);

  const showToast = (msg: string, type: "green" | "red" | "" = "") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaApi.list(page, LIMIT, filter, search);
      setFiles(res.data.files);
      setTotal(res.data.total);
    } catch {
      showToast("Failed to load files", "red");
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  /* ── Counts per type ──────────────────────────────── */
  const counts = {
    all:      total,
    image:    files.filter(f => f.type === "image").length,
    video:    files.filter(f => f.type === "video").length,
    pdf:      files.filter(f => f.type === "pdf").length,
    document: files.filter(f => f.type === "document").length,
  };

  /* ── Upload ───────────────────────────────────────── */
  const uploadFile = async (file: File) => {
    const tk = localStorage.getItem("gkpro_admin_token") || localStorage.getItem("gkpro_student_token");
    const fd = new FormData();
    fd.append("file", file);
    setUploadProgress(0);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", UPLOAD_URL);
      if (tk) xhr.setRequestHeader("Authorization", `Bearer ${tk}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          showToast("File uploaded successfully", "green");
          load();
          resolve();
        } else {
          showToast("Upload failed", "red");
          reject();
        }
      };
      xhr.onerror = () => { setUploadProgress(null); showToast("Upload failed", "red"); reject(); };
      xhr.send(fd);
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  /* ── Copy URL ─────────────────────────────────────── */
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(serverUrl(url)).then(() => showToast("URL copied!", "green"));
  };

  /* ── Delete ───────────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mediaApi.remove(deleteTarget.filename);
      showToast("File deleted", "green");
      setDeleteTarget(null);
      load();
    } catch {
      showToast("Delete failed", "red");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Pagination ───────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* ── Render ───────────────────────────────────────── */
  return (
    <AdminGuard>
      <div className={adminStyles.inner}>
        <Sidebar />
        <div className={adminStyles.main}>
          <Topbar title="Media Library" />
          <div className={adminStyles.content}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Media Library</h1>
          <p>Manage all uploaded files — images, videos, PDFs, and documents</p>
        </div>
        <div className={styles.headerRight}>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Upload File
          </button>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileInput} />
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        {(["all", "image", "video", "pdf", "document"] as const).map(t => (
          <div key={t} className={styles.stat}>
            <div className={`${styles.statIcon} ${iconBg(t)}`}>
              {t === "all"
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                : <FileTypeIcon type={t} size={18} />
              }
            </div>
            <div>
              <div className={styles.statValue}>{filter === t ? total : (t === "all" ? total : counts[t])}</div>
              <div className={styles.statLabel}>{TYPE_LABELS[t]}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {(["all", "image", "video", "pdf", "document"] as const).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${filter === t ? styles.tabActive : ""}`}
              onClick={() => setFilter(t)}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            className={styles.searchInput}
            placeholder="Search by filename…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.viewToggle}>
          <button className={`${styles.viewBtn} ${view === "grid" ? styles.viewBtnActive : ""}`} onClick={() => setView("grid")} title="Grid view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          <button className={`${styles.viewBtn} ${view === "list" ? styles.viewBtnActive : ""}`} onClick={() => setView("list")} title="List view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round"/><line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round"/><line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={styles.dropzoneIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
        </div>
        <p className={styles.dropzoneText}>
          {uploadProgress !== null ? `Uploading… ${uploadProgress}%` : "Drop a file here, or click to browse"}
        </p>
        <p className={styles.dropzoneSub}>Images, Videos, PDFs, Documents — up to 500 MB</p>
        {uploadProgress !== null && (
          <div className={styles.uploadProgress}>
            <div className={styles.uploadProgressBar} style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonThumb} />
              <div style={{ padding: "10px 10px 12px" }}>
                <div className={styles.skeletonLine} style={{ width: "80%", marginBottom: 8 }} />
                <div className={styles.skeletonLine} style={{ width: "50%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>No files found</p>
          <p className={styles.emptySub}>{search ? "Try a different search term" : "Upload your first file using the drop zone above"}</p>
        </div>
      ) : view === "grid" ? (
        <div className={styles.grid}>
          {files.map(f => (
            <div key={f.filename} className={styles.fileCard}>
              <div className={styles.thumb} onClick={() => f.type === "image" ? setLightbox(f) : copyUrl(f.url)}>
                {f.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={serverUrl(f.url)} alt={f.filename} className={styles.thumbImg} />
                ) : (
                  <div className={styles.thumbIcon}>
                    <div className={`${styles.thumbIconCircle} ${typeColor(f.type)}`}>
                      <FileTypeIcon type={f.type} size={24} />
                    </div>
                    <span className={`${styles.thumbLabel} ${typeColor(f.type)}`}>{f.type}</span>
                  </div>
                )}
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardName} title={f.filename}>{f.filename}</div>
                <div className={styles.cardMeta}>{f.sizeFormatted} · {new Date(f.createdAt).toLocaleDateString()}</div>
              </div>
              <div className={styles.cardActions}>
                <button className={`${styles.cardAction} ${styles.cardActionCopy}`} onClick={() => copyUrl(f.url)} title="Copy URL">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round"/>
                  </svg>
                  Copy
                </button>
                <button className={`${styles.cardAction} ${styles.cardActionDel}`} onClick={() => setDeleteTarget(f)} title="Delete">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round"/>
                    <path d="M10 11v6M14 11v6" strokeLinecap="round"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className={styles.listTable}>
          <thead>
            <tr>
              <th style={{ width: 56 }}>Preview</th>
              <th>Name</th>
              <th>URL</th>
              <th>Type</th>
              <th>Size</th>
              <th>Date</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.filename}>
                <td>
                  <div className={styles.listThumb}>
                    {f.type === "image"
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={serverUrl(f.url)} alt={f.filename} />
                      : <div className={typeColor(f.type)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", borderRadius: 8 }}><FileTypeIcon type={f.type} size={20} /></div>
                    }
                  </div>
                </td>
                <td>
                  <div className={styles.listName} title={f.filename}>{f.filename}</div>
                </td>
                <td>
                  <div className={styles.listUrl} title={serverUrl(f.url)}>{serverUrl(f.url)}</div>
                </td>
                <td>
                  <span className={`${styles.typePill} ${typeColor(f.type)}`}>
                    <FileTypeIcon type={f.type} size={11} />
                    {f.type}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{f.sizeFormatted}</td>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className={`${styles.cardAction} ${styles.cardActionCopy}`} style={{ flex: "none", padding: "5px 8px" }} onClick={() => copyUrl(f.url)} title="Copy URL">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className={`${styles.cardAction} ${styles.cardActionDel}`} style={{ flex: "none", padding: "5px 8px" }} onClick={() => setDeleteTarget(f)} title="Delete">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round"/>
                        <path d="M10 11v6M14 11v6" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} files</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={styles.tab}
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ opacity: page === 1 ? 0.4 : 1 }}
            >← Prev</button>
            <span style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
              {page} / {totalPages}
            </span>
            <button
              className={styles.tab}
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ opacity: page === totalPages ? 0.4 : 1 }}
            >Next →</button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxInner} onClick={e => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={serverUrl(lightbox.url)} alt={lightbox.filename} className={styles.lightboxImg} />
            <div className={styles.lightboxMeta}>
              <span className={styles.lightboxName}>{lightbox.filename} · {lightbox.sizeFormatted}</span>
              <button className={styles.lightboxCopy} onClick={() => copyUrl(lightbox.url)}>Copy URL</button>
              <button
                className={styles.lightboxCopy}
                style={{ background: "#DC2626" }}
                onClick={() => { setLightbox(null); setDeleteTarget(lightbox); }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete File" width={440}>
        <div className={styles.deleteWrap}>
          {deleteTarget?.type === "image" ? (
            <div className={styles.deleteThumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={serverUrl(deleteTarget.url)} alt={deleteTarget.filename} />
            </div>
          ) : (
            <div className={styles.deleteIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round"/>
                <path d="M10 11v6M14 11v6" strokeLinecap="round"/>
              </svg>
            </div>
          )}
          <p className={styles.deleteTitle}>Delete this file?</p>
          <p className={styles.deleteText}>
            <strong>{deleteTarget?.filename}</strong> will be permanently removed.<br />
            This cannot be undone and may break pages that reference this URL.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <button
              style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              onClick={() => setDeleteTarget(null)}
            >Cancel</button>
            <button
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: deleting ? 0.7 : 1 }}
              onClick={confirmDelete}
              disabled={deleting}
            >{deleting ? "Deleting…" : "Delete File"}</button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === "green" ? styles.toastGreen : toast.type === "red" ? styles.toastRed : ""}`}>
          {toast.type === "green" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {toast.type === "red" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          {toast.msg}
        </div>
      )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
