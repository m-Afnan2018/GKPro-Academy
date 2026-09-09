"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import styles from "./PdfViewer.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.2;
const ZOOM_STEP = 0.15;
// Rapid +/- clicks each force pdf.js to re-rasterize every page's canvas —
// that's what caused the lag. Only commit the width change once clicks settle.
const ZOOM_COMMIT_DELAY = 200;

export default function PdfViewer({ url, title }: { url: string; title: string }) {
  const [numPages, setNumPages] = useState(0);
  const [zoomInput, setZoomInput] = useState(1); // updates instantly (drives the % label)
  const [zoom, setZoom] = useState(1); // debounced — this is what actually re-renders pages
  const [containerWidth, setContainerWidth] = useState(0);
  const [loadError, setLoadError] = useState("");
  // Measuring this (non-scrolling) wrapper, rather than the scrollable area
  // itself, avoids a resize feedback loop: growing page content toggles the
  // scrollbar, which changes the scrollable element's own content-box width,
  // which re-triggers the observer — compounding into visible jank on zoom.
  const measureRef = useRef<HTMLDivElement>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      // Ignore sub-pixel jitter so a near-identical reading never triggers
      // another render cycle.
      if (w) setContainerWidth((prev) => (Math.abs(prev - w) < 1 ? prev : w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset whenever the source document changes
  useEffect(() => {
    setZoomInput(1);
    setZoom(1);
    setNumPages(0);
    setLoadError("");
  }, [url]);

  useEffect(() => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => setZoom(zoomInput), ZOOM_COMMIT_DELAY);
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
    };
  }, [zoomInput]);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const zoomOut = () => setZoomInput((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const zoomIn = () => setZoomInput((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const pageWidth = containerWidth ? containerWidth * zoom : undefined;

  return (
    <div className={styles.wrap} role="group" aria-label={title}>
      <div className={styles.toolbar}>
        <span className={styles.pageInfo}>{numPages ? `${numPages} page${numPages !== 1 ? "s" : ""}` : "…"}</span>
        <div className={styles.group}>
          <button
            type="button"
            className={styles.btn}
            onClick={zoomOut}
            disabled={zoomInput <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className={styles.pageInfo}>{Math.round(zoomInput * 100)}%</span>
          <button
            type="button"
            className={styles.btn}
            onClick={zoomIn}
            disabled={zoomInput >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.areaMeasure} ref={measureRef}>
        <div className={styles.area}>
          {loadError ? (
            <div className={styles.status}>{loadError}</div>
          ) : (
            <Document
              file={url}
              onLoadSuccess={onLoadSuccess}
              onLoadError={() => setLoadError("Couldn't load this PDF.")}
              loading={<div className={styles.status}>Loading PDF…</div>}
              error={<div className={styles.status}>Couldn't load this PDF.</div>}
              className={styles.doc}
            >
              {Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={i + 1}
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className={styles.page}
                  loading={null}
                />
              ))}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
