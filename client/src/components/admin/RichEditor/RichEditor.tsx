"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";
import FontFamily from "@tiptap/extension-font-family";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useState, useCallback, useRef } from "react";
import s from "./RichEditor.module.css";

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/* ── SVG icon helper ── */
const I = ({ d, size = 14, ...rest }: { d: string; size?: number; viewBox?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox={rest.viewBox ?? "0 0 24 24"} fill="none" stroke="currentColor" strokeWidth={rest.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/* ── Toolbar button ── */
const Btn = ({ onClick, active, disabled, title, children }: { onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode }) => (
  <button type="button" className={`${s.btn} ${active ? s.btnActive : ""}`} onClick={onClick} disabled={disabled} title={title}>
    {children}
  </button>
);

const Sep = () => <div className={s.sep} />;

const FONTS = ["Default", "Serif", "Mono", "Georgia", "Trebuchet MS", "Arial"];

export default function RichEditor({ value, onChange, placeholder = "Start writing…" }: Props) {
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl]       = useState("");
  const [textColor, setTextColor]   = useState("#000000");
  const [hlColor, setHlColor]       = useState("#FFFF00");
  const imgRef  = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { languageClassPrefix: "language-" } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FontFamily,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Subscript,
      Superscript,
      CharacterCount,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose" },
    },
  });

  const openLinkDialog = useCallback(() => {
    const prev = editor?.getAttributes("link").href ?? "";
    setLinkUrl(prev);
    setLinkDialog(true);
  }, [editor]);

  const applyLink = () => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().setLink({ href }).run();
    }
    setLinkDialog(false);
  };

  const uploadImage = async (file: File) => {
    const tk = typeof window !== "undefined"
      ? (localStorage.getItem("gkpro_admin_token") || localStorage.getItem("gkpro_student_token"))
      : null;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${SERVER_BASE}/api/upload`, {
      method: "POST",
      headers: tk ? { Authorization: `Bearer ${tk}` } : {},
      body: fd,
    }).then(r => r.json());
    if (res.success) {
      editor?.chain().focus().setImage({ src: SERVER_BASE + res.data.url }).run();
    }
  };

  if (!editor) return null;

  const chars = editor.storage.characterCount.characters();
  const words = editor.storage.characterCount.words();

  return (
    <>
      <div className={s.wrap}>
        {/* ── Toolbar ── */}
        <div className={s.toolbar}>

          {/* Undo / Redo */}
          <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
          </Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
          </Btn>

          <Sep />

          {/* Paragraph style */}
          <select
            className={s.select}
            style={{ width: 130 }}
            value={
              editor.isActive("heading", { level: 1 }) ? "h1"
              : editor.isActive("heading", { level: 2 }) ? "h2"
              : editor.isActive("heading", { level: 3 }) ? "h3"
              : editor.isActive("heading", { level: 4 }) ? "h4"
              : editor.isActive("heading", { level: 5 }) ? "h5"
              : editor.isActive("heading", { level: 6 }) ? "h6"
              : editor.isActive("codeBlock") ? "code"
              : "p"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p")   editor.chain().focus().setParagraph().run();
              else if (v === "code") editor.chain().focus().toggleCodeBlock().run();
              else editor.chain().focus().toggleHeading({ level: Number(v.slice(1)) as any }).run();
            }}
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
            <option value="code">Code Block</option>
          </select>

          {/* Font family */}
          <select
            className={s.select}
            style={{ width: 118 }}
            value={editor.getAttributes("textStyle").fontFamily ?? "Default"}
            onChange={(e) => {
              if (e.target.value === "Default") editor.chain().focus().unsetFontFamily().run();
              else editor.chain().focus().setFontFamily(e.target.value).run();
            }}
          >
            {FONTS.map(f => <option key={f}>{f}</option>)}
          </select>

          <Sep />

          {/* Bold / Italic / Underline / Strike / Code */}
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
            <strong style={{ fontSize: 14 }}>B</strong>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
            <em style={{ fontSize: 14 }}>I</em>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
            <span style={{ textDecoration: "underline", fontSize: 14, fontWeight: 600 }}>U</span>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <span style={{ textDecoration: "line-through", fontSize: 14, fontWeight: 600 }}>S</span>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
            <span style={{ fontSize: 12, fontWeight: 600 }}>x<sub>2</sub></span>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
            <span style={{ fontSize: 12, fontWeight: 600 }}>x<sup>2</sup></span>
          </Btn>

          <Sep />

          {/* Text color */}
          <div className={s.colorWrap} title="Text Color" style={{ borderBottom: `3px solid ${textColor}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, pointerEvents: "none" }}>A</span>
            <input type="color" className={s.colorInput} value={textColor}
              onChange={(e) => { setTextColor(e.target.value); editor.chain().focus().setColor(e.target.value).run(); }} />
          </div>

          {/* Highlight color */}
          <div className={s.colorWrap} title="Highlight Color" style={{ borderBottom: `3px solid ${hlColor}` }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={hlColor} stroke="#374151" strokeWidth="1.5" style={{ pointerEvents: "none" }}>
              <path d="M9 3L5 7l10 10 4-4L9 3z"/><path d="M5 7l-3 9 3 3 9-3"/>
            </svg>
            <input type="color" className={s.colorInput} value={hlColor}
              onChange={(e) => { setHlColor(e.target.value); editor.chain().focus().toggleHighlight({ color: e.target.value }).run(); }} />
          </div>

          <Sep />

          {/* Alignment */}
          {(["left", "center", "right", "justify"] as const).map((a) => (
            <Btn key={a} onClick={() => editor.chain().focus().setTextAlign(a).run()} active={editor.isActive({ textAlign: a })} title={`Align ${a}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {a === "left"    && <><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></>}
                {a === "center" && <><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></>}
                {a === "right"  && <><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></>}
                {a === "justify"&& <><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></>}
              </svg>
            </Btn>
          ))}

          <Sep />

          {/* Lists */}
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeLinecap="round"/><path d="M4 10h2" strokeLinecap="round"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinecap="round"/></svg>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task List">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="4" height="4" rx="1"/><polyline points="5 7 5 7"/><line x1="10" y1="7" x2="20" y2="7"/><rect x="3" y="13" width="4" height="4" rx="1"/><line x1="10" y1="15" x2="20" y2="15"/></svg>
          </Btn>

          {/* Indent */}
          <Btn onClick={() => editor.chain().focus().sinkListItem("listItem").run()} disabled={!editor.can().sinkListItem("listItem")} title="Indent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="8 12 13 8 13 16 8 12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>
          </Btn>
          <Btn onClick={() => editor.chain().focus().liftListItem("listItem").run()} disabled={!editor.can().liftListItem("listItem")} title="Outdent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="13 12 8 8 8 16 13 12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>
          </Btn>

          <Sep />

          {/* Blockquote / HR */}
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
          </Btn>

          <Sep />

          {/* Link */}
          <Btn onClick={openLinkDialog} active={editor.isActive("link")} title="Insert / Edit Link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </Btn>
          {editor.isActive("link") && (
            <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"/><path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/></svg>
            </Btn>
          )}

          {/* Image upload */}
          <Btn onClick={() => imgRef.current?.click()} title="Insert Image">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </Btn>
          <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />

          {/* Table */}
          <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          </Btn>
          {editor.isActive("table") && (
            <>
              <Btn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">
                <span style={{ fontSize: 11, fontWeight: 700 }}>+Col</span>
              </Btn>
              <Btn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">
                <span style={{ fontSize: 11, fontWeight: 700 }}>+Row</span>
              </Btn>
              <Btn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </Btn>
            </>
          )}

          <Sep />

          {/* Clear formatting */}
          <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4l-4 16"/><line x1="18" y1="12" x2="22" y2="16"/><line x1="22" y1="12" x2="18" y2="16"/></svg>
          </Btn>
        </div>

        {/* ── Content area ── */}
        <div className={s.editorArea} onClick={() => editor.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>

        {/* ── Footer ── */}
        <div className={s.footer}>
          <span>{words} words</span>
          <span>{chars} characters</span>
        </div>
      </div>

      {/* ── Link dialog ── */}
      {linkDialog && (
        <div className={s.linkDialog} onClick={() => setLinkDialog(false)}>
          <div className={s.linkBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Insert Link</div>
            <input
              className={s.linkInput}
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
              autoFocus
            />
            <div className={s.linkActions}>
              <button type="button" onClick={() => setLinkDialog(false)} style={{ padding: "8px 16px", border: "1.5px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button type="button" onClick={applyLink} style={{ padding: "8px 18px", background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
