"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard/AdminGuard";
import Sidebar from "@/components/admin/Sidebar/Sidebar";
import ImageUpload from "@/components/admin/ImageUpload/ImageUpload";
import RichEditor from "@/components/admin/RichEditor/RichEditor";
import { blogsApi } from "@/lib/api";
import styles from "../../admin.module.css";
import editorStyles from "../editor.module.css";

export default function NewBlogPage() {
  const router = useRouter();
  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [imageUrl, setImageUrl]     = useState("");
  const [isPublished, setPublished] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const handleSave = async (publish?: boolean) => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!content.trim() || content === "<p></p>") { setError("Content cannot be empty."); return; }
    setError(""); setSaving(true);
    try {
      const pub = publish ?? isPublished;
      await blogsApi.create({ title, content, imageUrl: imageUrl || undefined, isPublished: pub } as any);
      router.push("/admin/blogs");
    } catch (e: any) {
      setError(e.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <div className={styles.inner}>
        <Sidebar />
        <div className={styles.main}>

          {/* ── Top bar ── */}
          <div className={editorStyles.editorTopbar}>
            <Link href="/admin/blogs" className={editorStyles.backBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Blogs
            </Link>
            <div className={editorStyles.topbarTitle}>New Post</div>
            <div className={editorStyles.topbarActions}>
              {error && <span className={editorStyles.topbarError}>{error}</span>}
              <button className={editorStyles.draftBtn} onClick={() => handleSave(false)} disabled={saving}>
                {saving ? "Saving…" : "Save Draft"}
              </button>
              <button className={editorStyles.publishBtn} onClick={() => handleSave(true)} disabled={saving}>
                {saving ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className={editorStyles.editorBody}>
            {/* Sidebar: metadata */}
            <div className={editorStyles.metaPanel}>
              <div className={editorStyles.metaSection}>
                <div className={editorStyles.metaLabel}>Status</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["Draft", "Published"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPublished(s === "Published")}
                      className={editorStyles.statusBtn}
                      style={{
                        background: (s === "Published") === isPublished ? (isPublished ? "#D1FAE5" : "#F3F4F6") : "transparent",
                        color:      (s === "Published") === isPublished ? (isPublished ? "#065F46" : "#374151") : "#9CA3AF",
                        border:     `1.5px solid ${(s === "Published") === isPublished ? (isPublished ? "#6EE7B7" : "#D1D5DB") : "#E5E7EB"}`,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className={editorStyles.metaSection}>
                <div className={editorStyles.metaLabel}>Cover Image</div>
                <ImageUpload value={imageUrl} onChange={setImageUrl} />
              </div>
            </div>

            {/* Main: title + editor */}
            <div className={editorStyles.editorMain}>
              <input
                className={editorStyles.titleInput}
                placeholder="Post title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <RichEditor value={content} onChange={setContent} placeholder="Start writing your post…" />
            </div>
          </div>

        </div>
      </div>
    </AdminGuard>
  );
}
