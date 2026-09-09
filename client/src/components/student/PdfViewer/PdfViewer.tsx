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

export default function PdfViewer({ url, title }: { url: string; title: string }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [loadError, setLoadError] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset to page 1 whenever the source document changes
  useEffect(() => {
    setPageNumber(1);
    setZoom(1);
    setLoadError("");
  }, [url]);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const canPrev = pageNumber > 1;
  const canNext = numPages > 0 && pageNumber < numPages;

  return (
    <div className={styles.wrap} role="group" aria-label={title}>
      <div className={styles.toolbar}>
        <div className={styles.group}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className={styles.pageInfo}>{numPages ? `${pageNumber} / ${numPages}` : "…"}</span>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={!canNext}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
        <div className={styles.group}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.15).toFixed(2)))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className={styles.pageInfo}>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.15).toFixed(2)))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.area} ref={areaRef}>
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
            <Page
              pageNumber={pageNumber}
              width={containerWidth ? containerWidth * zoom : undefined}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className={styles.page}
              loading={null}
            />
          </Document>
        )}
      </div>
    </div>
  );
}
