"use client";
import { useRef, useState, useCallback } from "react";

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: Props) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = useCallback(async (file: File) => {
    setUploading(true); setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("gkpro_admin_token") : null;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${SERVER_BASE}/api/upload`, {
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
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
          {label}
        </label>
      )}

      {value ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              title="Remove image"
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,0.6)", color: "#fff",
                border: "none", borderRadius: "50%",
                width: 28, height: 28, fontSize: 16, lineHeight: "28px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              marginTop: 6, width: "100%",
              padding: "6px 0", background: "#F9FAFB",
              border: "1px solid #D1D5DB", borderRadius: 6,
              fontSize: 12, color: "#6B7280", cursor: "pointer",
            }}
          >
            Replace image
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#3B82F6" : "#D1D5DB"}`,
            borderRadius: 8,
            padding: "28px 16px",
            textAlign: "center",
            cursor: uploading ? "default" : "pointer",
            background: dragging ? "#EFF6FF" : "#F9FAFB",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          {uploading ? (
            <div>
              <div style={{
                width: 28, height: 28, border: "3px solid #E5E7EB",
                borderTopColor: "#3B82F6", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 8px",
              }} />
              <div style={{ fontSize: 13, color: "#6B7280" }}>Uploading…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={dragging ? "#3B82F6" : "#9CA3AF"} strokeWidth="1.5"
                style={{ margin: "0 auto 8px", display: "block" }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div style={{ fontSize: 13, color: "#374151" }}>
                Drag & drop or{" "}
                <span style={{ color: "#3B82F6", textDecoration: "underline" }}>browse</span>
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>PNG, JPG, WebP, GIF · max 5 MB</div>
            </>
          )}
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{error}</div>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}
