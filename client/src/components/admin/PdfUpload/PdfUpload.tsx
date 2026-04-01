"use client";
import { useRef, useState, useCallback } from "react";

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function PdfUpload({ value, onChange, label }: Props) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fileName = value ? value.split("/").pop() : "";

  const doUpload = useCallback(async (file: File) => {
    setUploading(true); setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("gkpro_admin_token") : null;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${SERVER_BASE}/api/upload/pdf`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }).then(r => r.json());
      if (!res.success) throw new Error(res.message ?? "Upload failed");
      onChange(SERVER_BASE + res.data.url);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };

  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </label>
      )}

      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#F9FAFB" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" style={{ flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fileName}</div>
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#3B82F6", textDecoration: "none" }}>
              Preview PDF ↗
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
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#DC2626" : "#D1D5DB"}`,
            borderRadius: 8,
            padding: "20px 16px",
            textAlign: "center",
            cursor: uploading ? "default" : "pointer",
            background: dragging ? "#FEF2F2" : "#F9FAFB",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          {uploading ? (
            <div>
              <div style={{ width: 24, height: 24, border: "3px solid #E5E7EB", borderTopColor: "#DC2626", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13, color: "#6B7280" }}>Uploading PDF…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragging ? "#DC2626" : "#9CA3AF"} strokeWidth="1.5"
                style={{ margin: "0 auto 8px", display: "block" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="18" x2="12" y2="12" strokeLinecap="round"/>
                <polyline points="9 15 12 12 15 15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ fontSize: 13, color: "#374151" }}>
                Drag & drop or <span style={{ color: "#DC2626", textDecoration: "underline" }}>browse</span>
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>PDF only · max 50 MB</div>
            </>
          )}
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{error}</div>}
      <input ref={inputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}
