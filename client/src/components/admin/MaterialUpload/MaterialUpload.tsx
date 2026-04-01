"use client";
import { useRef, useState, useCallback } from "react";

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");

type UploadableType = "video" | "pdf" | "doc";

const TYPE_CONFIG: Record<UploadableType, { accept: string; label: string; hint: string; color: string }> = {
  video: { accept: "video/mp4,video/quicktime,video/webm,video/x-matroska", label: "Video File", hint: "MP4, MOV, WebM · max 500 MB", color: "#2563EB" },
  pdf:   { accept: "application/pdf",                                        label: "PDF File",   hint: "PDF · max 500 MB",          color: "#DC2626" },
  doc:   { accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
           label: "Document",  hint: "DOC, DOCX · max 500 MB",   color: "#7C3AED" },
};

interface Props {
  type: "video" | "pdf" | "link" | "doc" | "meet";
  value: string;
  onChange: (url: string) => void;
}

export default function MaterialUpload({ type, value, onChange }: Props) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isLink = type === "link" || type === "meet";
  const cfg    = !isLink ? TYPE_CONFIG[type as UploadableType] : null;

  const fileName = value && !value.startsWith("http") ? value.split("/").pop() : null;
  const isUploadedFile = value && (value.includes("/uploads/") || (!value.startsWith("http") && value));

  const doUpload = useCallback(async (file: File) => {
    setUploading(true); setError(""); setProgress(0);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("gkpro_admin_token") : null;
      const fd = new FormData();
      fd.append("file", file);

      // Use XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success) { onChange(SERVER_BASE + res.data.url); resolve(); }
            else reject(new Error(res.message ?? "Upload failed"));
          } catch { reject(new Error("Upload failed")); }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", `${SERVER_BASE}/api/upload/material`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(fd);
      });
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false); setProgress(0);
    }
  }, [onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };

  /* ── Link / Meet types: just a URL input ── */
  if (isLink) {
    return (
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {type === "meet" ? "Meeting URL" : "URL / Link"} <span style={{ color: "#DC2626" }}>*</span>
        </label>
        <input
          style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#111827", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s", background: "#fff" }}
          placeholder={type === "meet" ? "https://meet.google.com/... or zoom.us/..." : "https://youtube.com/watch?v=... or drive.google.com/..."}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={e => (e.target.style.borderColor = "#D42B3A")}
          onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
        />
      </div>
    );
  }

  /* ── Uploadable types: file upload zone ── */
  const color = cfg!.color;

  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {cfg!.label} <span style={{ color: "#DC2626" }}>*</span>
      </label>

      {/* Uploaded file display */}
      {value && !uploading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${color}30`, background: `${color}08`, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {type === "video" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ) : type === "pdf" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {isUploadedFile ? (fileName ?? "Uploaded file") : value}
            </div>
            <a href={value.startsWith("http") ? value : `${SERVER_BASE}${value}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#3B82F6", textDecoration: "none" }}>
              Preview ↗
            </a>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button type="button" onClick={() => inputRef.current?.click()}
              style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#374151", background: "#fff", border: "1.5px solid #D1D5DB", borderRadius: 6, cursor: "pointer" }}>
              Replace
            </button>
            <button type="button" onClick={() => onChange("")}
              style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#DC2626", background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 6, cursor: "pointer" }}>
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!value && !uploading && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? color : "#D1D5DB"}`,
            borderRadius: 10, padding: "28px 20px", textAlign: "center",
            cursor: "pointer", background: dragging ? `${color}08` : "#FAFAFA",
            transition: "all 0.15s",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            {type === "video" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
              </svg>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
            Drop {cfg!.label} here or <span style={{ color, textDecoration: "underline" }}>browse</span>
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>{cfg!.hint}</div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div style={{ padding: "20px 16px", border: "1.5px solid #E5E7EB", borderRadius: 10, background: "#FAFAFA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 20, height: 20, border: `3px solid ${color}30`, borderTopColor: color, borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Uploading… {progress}%</span>
          </div>
          <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: color, borderRadius: 3, transition: "width 0.2s" }} />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>{error}</div>}
      <input ref={inputRef} type="file" accept={cfg!.accept} style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}
