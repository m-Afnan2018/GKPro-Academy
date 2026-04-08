"use client";
import { useState, useRef, KeyboardEvent } from "react";
import { type Course, type Category, type SubCategory, type Faculty } from "@/lib/api";
import ImageUpload from "@/components/admin/ImageUpload/ImageUpload";
import PdfUpload from "@/components/admin/PdfUpload/PdfUpload";
import styles from "../../admin.module.css";

/* ────────────────────────────────────────────
   Form state type — exported for callers
──────────────────────────────────────────── */
export interface CF {
  title: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  overview: string;
  status: Course["status"];
  language: string;
  numLectures: string;
  duration: string;
  whoIsItFor: string[];
  highlights: string[];
  prerequisites: string[];
  technicalRequirements: string[];
  facultyIds: string[];
  availableModes: "both" | "online" | "recorded";
  onlinePrice: string;
  onlineOriginalPrice: string;
  recordedPrice: string;
  recordedOriginalPrice: string;
  bookEnabled: boolean;
  eBookPrice: string;
  eBookUrl: string;
  handbookPrice: string;
  handbookUrl: string;
  thumbnailUrl: string;
}

export const blankCF = (): CF => ({
  title: "", categoryId: "", subcategoryId: "", description: "", overview: "",
  status: "draft", language: "", numLectures: "", duration: "",
  whoIsItFor: [], highlights: [], prerequisites: [], technicalRequirements: [],
  facultyIds: [],
  availableModes: "both",
  onlinePrice: "", onlineOriginalPrice: "", recordedPrice: "", recordedOriginalPrice: "",
  bookEnabled: false, eBookPrice: "", eBookUrl: "", handbookPrice: "", handbookUrl: "",
  thumbnailUrl: "",
});

export const courseToForm = (c: Course): CF => ({
  title: c.title ?? "",
  categoryId: c.categoryId
    ? (typeof c.categoryId === "object" ? (c.categoryId as Category)._id : (c.categoryId as string))
    : "",
  subcategoryId: c.subcategoryId
    ? (typeof c.subcategoryId === "object" ? (c.subcategoryId as SubCategory)._id : (c.subcategoryId as string))
    : "",
  description: c.description ?? "",
  overview: c.overview ?? "",
  status: c.status,
  language: c.language ?? "",
  numLectures: c.numLectures ?? "",
  duration: c.duration ?? "",
  whoIsItFor: c.whoIsItFor ?? [],
  highlights: c.highlights ?? [],
  prerequisites: c.prerequisites ?? [],
  technicalRequirements: c.technicalRequirements ?? [],
  facultyIds: (c.faculty ?? []).map(f => (typeof f === "object" ? (f as Faculty)._id : f as string)),
  availableModes: c.availableModes ?? "both",
  onlinePrice: c.onlinePrice != null ? String(c.onlinePrice) : "",
  onlineOriginalPrice: c.onlineOriginalPrice != null ? String(c.onlineOriginalPrice) : "",
  recordedPrice: c.recordedPrice != null ? String(c.recordedPrice) : "",
  recordedOriginalPrice: c.recordedOriginalPrice != null ? String(c.recordedOriginalPrice) : "",
  bookEnabled: c.bookEnabled ?? false,
  eBookPrice: c.eBookPrice != null ? String(c.eBookPrice) : "",
  eBookUrl: c.eBookUrl ?? "",
  handbookPrice: c.handbookPrice != null ? String(c.handbookPrice) : "",
  handbookUrl: c.handbookUrl ?? "",
  thumbnailUrl: (c as any).thumbnailUrl ?? "",
});

export const formToPayload = (f: CF) => ({
  title: f.title,
  categoryId: f.categoryId || undefined,
  subcategoryId: f.subcategoryId || null,
  description: f.description,
  overview: f.overview,
  status: f.status,
  language: f.language || null,
  numLectures: f.numLectures || null,
  duration: f.duration || null,
  whoIsItFor: f.whoIsItFor.filter(Boolean),
  highlights: f.highlights.filter(Boolean),
  prerequisites: f.prerequisites.filter(Boolean),
  technicalRequirements: f.technicalRequirements.filter(Boolean),
  faculty: f.facultyIds,
  availableModes: f.availableModes,
  thumbnailUrl: f.thumbnailUrl || undefined,
  onlinePrice: f.onlinePrice ? Number(f.onlinePrice) : null,
  onlineOriginalPrice: f.onlineOriginalPrice ? Number(f.onlineOriginalPrice) : null,
  recordedPrice: f.recordedPrice ? Number(f.recordedPrice) : null,
  recordedOriginalPrice: f.recordedOriginalPrice ? Number(f.recordedOriginalPrice) : null,
  bookEnabled: f.bookEnabled,
  eBookPrice: f.bookEnabled && f.eBookPrice ? Number(f.eBookPrice) : null,
  eBookUrl: f.bookEnabled && f.eBookUrl ? f.eBookUrl : null,
  handbookPrice: f.bookEnabled && f.handbookPrice ? Number(f.handbookPrice) : null,
  handbookUrl: f.bookEnabled && f.handbookUrl ? f.handbookUrl : null,
});

/* ────────────────────────────────────────────
   Small helpers
──────────────────────────────────────────── */
function FL({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}{req && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
      background: value ? "#16A34A" : "#D1D5DB",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 20 : 2,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.18s", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !input && value.length) onChange(value.slice(0, -1));
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center",
        padding: "6px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8,
        minHeight: 40, cursor: "text", background: "#fff",
      }}
    >
      {value.map((tag, i) => (
        <span key={i} style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "2px 8px 2px 10px", borderRadius: 20,
          background: "#EFF6FF", color: "#1D4ED8",
          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
        }}>
          {tag}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(value.filter((_, j) => j !== i)); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#93C5FD", padding: 0, lineHeight: 1, fontSize: 14 }}
          >×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : ""}
        style={{ border: "none", outline: "none", fontSize: 13, flex: 1, minWidth: 100, background: "transparent" }}
      />
    </div>
  );
}

function BookCard({ color, icon, label, badge, price, setPrice, pdfUrl, setPdfUrl, pdfLabel, hint }: {
  color: string; icon: React.ReactNode; label: string; badge?: string;
  price: string; setPrice: (v: string) => void;
  pdfUrl: string; setPdfUrl: (v: string) => void;
  pdfLabel: string; hint?: string;
}) {
  return (
    <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FAFAFA", borderBottom: "1px solid #F0F0F5" }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{label}</span>
        {badge && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color, background: `${color}18`, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <FL>Add-on Price (₹)</FL>
          <input className={styles.formInput} type="number" min={0} placeholder="Leave blank to disable" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div>
          <PdfUpload label={pdfLabel} value={pdfUrl} onChange={setPdfUrl} />
          {hint && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, lineHeight: 1.5 }}>{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab definitions
──────────────────────────────────────────── */
type FormTab = "basic" | "content" | "requirements" | "teacher" | "pricing" | "media";

const TABS: { key: FormTab; label: string }[] = [
  { key: "basic", label: "Basic Info" },
  { key: "content", label: "Content" },
  { key: "requirements", label: "Requirements" },
  { key: "teacher", label: "Teacher" },
  { key: "pricing", label: "Pricing" },
  { key: "media", label: "Media" },
];

/* ────────────────────────────────────────────
   CourseForm component
──────────────────────────────────────────── */
export interface CourseFormProps {
  f: CF;
  setF: (v: CF) => void;
  categories: Category[];
  subcatsFor: (id: string) => SubCategory[];
  allFaculty: Faculty[];
  error?: string;
  editSlug?: string;
}

export default function CourseForm({ f, setF, categories, subcatsFor, allFaculty, error, editSlug }: CourseFormProps) {
  const [tab, setTab] = useState<FormTab>("basic");
  const set = (key: keyof CF, val: any) => setF({ ...f, [key]: val });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {error && (
        <div className={styles.errorBanner} style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginBottom: 24, borderBottom: "2px solid #F3F4F6" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: "9px 18px", fontSize: 13, fontWeight: 600,
              border: "none", cursor: "pointer", background: "none",
              borderBottom: tab === t.key ? "2px solid #D42B3A" : "2px solid transparent",
              marginBottom: -2,
              color: tab === t.key ? "#D42B3A" : "#6B7280",
              transition: "color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Basic Info ── */}
      {tab === "basic" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionHead
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /></svg>}
            title="Basic Information"
            subtitle="Core identifiers and categorization"
          />

          <div className={styles.formGroup}>
            <FL req>Course Title</FL>
            <input className={styles.formInput} placeholder="e.g. CA Foundation — Accounts" value={f.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <FL>Category</FL>
              <select className={styles.formSelect} value={f.categoryId} onChange={e => setF({ ...f, categoryId: e.target.value, subcategoryId: "" })}>
                <option value="">— Select category —</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <FL>Subcategory</FL>
              <select className={styles.formSelect} value={f.subcategoryId} onChange={e => set("subcategoryId", e.target.value)} disabled={!f.categoryId}>
                <option value="">— None —</option>
                {subcatsFor(f.categoryId).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <FL>Status</FL>
              <select className={styles.formSelect} value={f.status} onChange={e => set("status", e.target.value as Course["status"])}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <FL>Language</FL>
              <input className={styles.formInput} placeholder="e.g. Hindi / English" value={f.language} onChange={e => set("language", e.target.value)} />
            </div>
          </div>

          {/* ── Available Modes ── */}
          <div className={styles.formGroup}>
            <FL>Available Modes</FL>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {(["both", "online", "recorded"] as const).map(mode => {
                const active = f.availableModes === mode;
                const labels: Record<string, { label: string; sub: string; color: string; bg: string; icon: React.ReactNode }> = {
                  both: {
                    label: "Both",
                    sub: "Live + Recorded",
                    color: "#7C3AED",
                    bg: "#F5F3FF",
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                  },
                  online: {
                    label: "Live Only",
                    sub: "Online / Live classes",
                    color: "#1D4ED8",
                    bg: "#EFF6FF",
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                  },
                  recorded: {
                    label: "Recorded Only",
                    sub: "Pre-recorded videos",
                    color: "#16A34A",
                    bg: "#F0FDF4",
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
                  },
                };
                const meta = labels[mode];
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => set("availableModes", mode)}
                    style={{
                      flex: 1, minWidth: 140,
                      padding: "10px 14px",
                      border: `2px solid ${active ? meta.color : "#E5E7EB"}`,
                      borderRadius: 10,
                      background: active ? meta.bg : "#FAFAFA",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: active ? meta.color : "#E5E7EB",
                      color: active ? "#fff" : "#9CA3AF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {meta.icon}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? meta.color : "#374151" }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: active ? meta.color : "#9CA3AF", marginTop: 1 }}>{meta.sub}</div>
                    </div>
                    {active && (
                      <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: meta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="2 6 5 9 10 3" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Controls which enrollment modes are shown to students on the public course page.</p>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <FL>No. of Lectures</FL>
              <input className={styles.formInput} placeholder="e.g. 70-75 Lectures" value={f.numLectures} onChange={e => set("numLectures", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <FL>Course Duration</FL>
              <input className={styles.formInput} placeholder="e.g. 6 Months" value={f.duration} onChange={e => set("duration", e.target.value)} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <FL>Short Description</FL>
            <textarea className={styles.formTextarea} rows={3} placeholder="One-line summary shown in course cards and listings…" value={f.description} onChange={e => set("description", e.target.value)} />
          </div>

          {editSlug && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F0FDF4", borderRadius: 8, fontSize: 12 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              <span style={{ color: "#15803D", fontWeight: 600 }}>Public URL:</span>
              <a href={`/courses/${editSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#16A34A", textDecoration: "underline" }}>
                /courses/{editSlug}
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {tab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionHead
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
            title="Course Content"
            subtitle="Overview, who it's for, and key highlights"
          />
          <div className={styles.formGroup}>
            <FL>Course Overview</FL>
            <textarea className={styles.formTextarea} rows={6} placeholder="Detailed overview shown on the Description tab of the course page…" value={f.overview} onChange={e => set("overview", e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <FL>Who Is It For?</FL>
            <TagInput value={f.whoIsItFor} onChange={v => set("whoIsItFor", v)} placeholder="Type and press Enter — e.g. CA Aspirants, Commerce Students…" />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>Press Enter or comma to add each item.</p>
          </div>
          <div className={styles.formGroup}>
            <FL>Course Highlights</FL>
            <TagInput value={f.highlights} onChange={v => set("highlights", v)} placeholder="e.g. Live doubt sessions, Study material included…" />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>Key selling points shown on the course page.</p>
          </div>
        </div>
      )}

      {/* ── Requirements ── */}
      {tab === "requirements" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <SectionHead
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
            title="Prerequisites & Requirements"
            subtitle="What students need before enrolling, and technical/device requirements"
          />
          <div className={styles.formGroup}>
            <FL>Prerequisites / Prior Knowledge</FL>
            <TagInput value={f.prerequisites} onChange={v => set("prerequisites", v)} placeholder="e.g. Class 12 Commerce, CA Foundation passed…" />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>Academic or knowledge prerequisites shown on the Requirements tab.</p>
          </div>
          <div className={styles.formGroup}>
            <FL>Technical Requirements</FL>
            <TagInput value={f.technicalRequirements} onChange={v => set("technicalRequirements", v)} placeholder="e.g. Stable internet connection, Laptop/PC…" />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>Device or system requirements needed to access the course.</p>
          </div>
        </div>
      )}

      {/* ── Faculty ── */}
      {tab === "teacher" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionHead
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
            title="Faculty"
            subtitle="Assign one or more faculty members — manage them in Admin › Faculty"
          />

          {allFaculty.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", background: "#F9FAFB", borderRadius: 10, border: "1.5px dashed #E5E7EB" }}>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>No faculty added yet.</p>
              <a href="/admin/faculty" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#D42B3A", fontWeight: 600 }}>Go to Faculty page →</a>
            </div>
          ) : (
            <>
              {/* Picker grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {allFaculty.map(fac => {
                  const selected = f.facultyIds.includes(fac._id);
                  return (
                    <button
                      key={fac._id}
                      type="button"
                      onClick={() => set("facultyIds", selected
                        ? f.facultyIds.filter(id => id !== fac._id)
                        : [...f.facultyIds, fac._id]
                      )}
                      style={{
                        display: fac.isActive || selected ? "flex" : "none", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 10, textAlign: "left",
                        border: `2px solid ${selected ? "#D42B3A" : "#E5E7EB"}`,
                        background: selected ? "#FFF1F2" : "#FAFAFA",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E5E7EB", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {fac.avatar
                          ? <img src={fac.avatar} alt={fac.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        }
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: selected ? "#D42B3A" : "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fac.name}</div>
                        {fac.designation && <div style={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fac.designation}</div>}
                      </div>
                      {/* Checkmark */}
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? "#D42B3A" : "#D1D5DB"}`, background: selected ? "#D42B3A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                        {selected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="2 6 5 9 10 3" /></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected preview */}
              {f.facultyIds.length > 0 && (
                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
                    Selected ({f.facultyIds.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {allFaculty.filter(fac => f.facultyIds.includes(fac._id)).map(fac => (
                      <div key={fac._id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E5E7EB", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {fac.avatar
                            ? <img src={fac.avatar} alt={fac.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          }
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{fac.name}</div>
                          {fac.designation && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>{fac.designation}</div>}
                          {fac.bio && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4, lineHeight: 1.5, maxWidth: 420 }}>{fac.bio.slice(0, 120)}{fac.bio.length > 120 ? "…" : ""}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Pricing ── */}
      {tab === "pricing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionHead
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
            title="Pricing"
            subtitle="Course fees and optional book add-ons"
          />
          <div>
            {/* Online pricing */}
            <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ padding: "9px 14px", background: "#F8FAFF", borderBottom: "1px solid #EEF0F8", fontSize: 12, fontWeight: 700, color: "#1D4ED8", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Online / Live Mode
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <FL>Sale Price (₹)</FL>
                    <input className={styles.formInput} type="number" min={0} placeholder="e.g. 5999" value={f.onlinePrice} onChange={e => set("onlinePrice", e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <FL>Original Price / MRP (₹)</FL>
                    <input className={styles.formInput} type="number" min={0} placeholder="e.g. 7999 (shown crossed out)" value={f.onlineOriginalPrice} onChange={e => set("onlineOriginalPrice", e.target.value)} />
                  </div>
                </div>
                {f.onlinePrice && f.onlineOriginalPrice && Number(f.onlineOriginalPrice) > Number(f.onlinePrice) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#6B7280", textDecoration: "line-through" }}>₹{Number(f.onlineOriginalPrice).toLocaleString("en-IN")}</span>
                    <span style={{ color: "#111827", fontWeight: 700 }}>₹{Number(f.onlinePrice).toLocaleString("en-IN")}</span>
                    <span style={{ background: "#D42B3A", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                      {Math.round((1 - Number(f.onlinePrice) / Number(f.onlineOriginalPrice)) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recorded pricing */}
            <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "9px 14px", background: "#F8FFF8", borderBottom: "1px solid #EEFAEE", fontSize: 12, fontWeight: 700, color: "#16A34A", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                Recorded Mode
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <FL>Sale Price (₹)</FL>
                    <input className={styles.formInput} type="number" min={0} placeholder="e.g. 3999" value={f.recordedPrice} onChange={e => set("recordedPrice", e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <FL>Original Price / MRP (₹)</FL>
                    <input className={styles.formInput} type="number" min={0} placeholder="e.g. 5999 (shown crossed out)" value={f.recordedOriginalPrice} onChange={e => set("recordedOriginalPrice", e.target.value)} />
                  </div>
                </div>
                {f.recordedPrice && f.recordedOriginalPrice && Number(f.recordedOriginalPrice) > Number(f.recordedPrice) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#6B7280", textDecoration: "line-through" }}>₹{Number(f.recordedOriginalPrice).toLocaleString("en-IN")}</span>
                    <span style={{ color: "#111827", fontWeight: 700 }}>₹{Number(f.recordedPrice).toLocaleString("en-IN")}</span>
                    <span style={{ background: "#D42B3A", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                      {Math.round((1 - Number(f.recordedPrice) / Number(f.recordedOriginalPrice)) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>Leave Sale Price blank to disable that mode. MRP is optional — when set, discount % is shown to students.</p>
          </div>

          <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Toggle value={f.bookEnabled} onChange={v => set("bookEnabled", v)} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: f.bookEnabled ? "#16A34A" : "#6B7280" }}>
                  Book Add-on {f.bookEnabled ? "Enabled" : "Disabled"}
                </span>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>Students can optionally add an eBook or handbook at checkout</p>
              </div>
            </div>
            {f.bookEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <BookCard
                  color="#2563EB" label="eBook" badge="Digital PDF"
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
                  price={f.eBookPrice} setPrice={v => set("eBookPrice", v)}
                  pdfUrl={f.eBookUrl} setPdfUrl={v => set("eBookUrl", v)}
                  pdfLabel="eBook PDF File"
                  hint="Students who purchase the eBook add-on will get a download link to this file."
                />
                <BookCard
                  color="#16A34A" label="Handbook" badge="Physical + Digital"
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                  price={f.handbookPrice} setPrice={v => set("handbookPrice", v)}
                  pdfUrl={f.handbookUrl} setPdfUrl={v => set("handbookUrl", v)}
                  pdfLabel="Handbook PDF (optional)"
                  hint="Students enter their delivery address for the physical book."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Media ── */}
      {tab === "media" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionHead
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>}
            title="Media"
            subtitle="Course thumbnail shown on listings and the course detail page"
          />
          <ImageUpload label="Course Thumbnail" value={f.thumbnailUrl} onChange={v => set("thumbnailUrl", v)} />
        </div>
      )}
    </div>
  );
}
