import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker cho Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// ── Icon components ──────────────────────────────────────────────
const IconPrint = () => (
  <svg
    width="15"
    height="15"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"
    />
  </svg>
);

const IconDownload = () => (
  <svg
    width="15"
    height="15"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
    />
  </svg>
);

const IconClose = () => (
  <svg
    width="17"
    height="17"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const IconChevron = ({ dir = "up" }) => (
  <svg
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
    style={{ transform: dir === "down" ? "rotate(180deg)" : "none" }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const IconZoomIn = () => (
  <svg
    width="15"
    height="15"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-4.35-4.35M11 8v6M8 11h6"
    />
  </svg>
);

const IconZoomOut = () => (
  <svg
    width="15"
    height="15"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-4.35-4.35M8 11h6"
    />
  </svg>
);

// ── Spinner ──────────────────────────────────────────────────────
const Spinner = ({ text = "Đang tải PDF…" }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      background: "#334155",
      zIndex: 2,
    }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <svg
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 24 24"
      stroke="#94a3b8"
      strokeWidth={2}
      style={{ animation: "spin 1s linear infinite" }}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"
      />
    </svg>
    <span style={{ fontSize: 13, color: "#94a3b8" }}>{text}</span>
  </div>
);

// ── Button helper ────────────────────────────────────────────────
const Btn = ({ onClick, disabled, style: extraStyle, children, title }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "7px 12px",
        border: "0.5px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        color: disabled ? "#475569" : "#f1f5f9",
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        background:
          hover && !disabled
            ? "rgba(255,255,255,0.16)"
            : "rgba(255,255,255,0.08)",
        transition: "background 0.15s, color 0.15s",
        ...extraStyle,
      }}>
      {children}
    </button>
  );
};

// ── Main Component ───────────────────────────────────────────────
export default function ModalXemPdf({
  open,
  pdfUrl,
  fileName = "don-hang.pdf",
  onClose,
}) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [pageInput, setPageInput] = useState("1");
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = React.useRef(null);

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/cmaps/",
      cMapPacked: true,
    }),
    [],
  );

  // Reset mỗi lần mở
  useEffect(() => {
    if (open) {
      setLoading(true);
      setNumPages(null);
      setCurrentPage(1);
      setPageInput("1");
      setScale(1.0);
    }
  }, [open, pdfUrl]);

  // Đóng bằng Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Khóa scroll body
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Đo width container để responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [open]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const goTo = (page) => {
    const p = Math.min(Math.max(1, page), numPages ?? 1);
    setCurrentPage(p);
    setPageInput(String(p));
  };

  const handlePageInputBlur = () => {
    const n = parseInt(pageInput, 10);
    if (!isNaN(n)) goTo(n);
    else setPageInput(String(currentPage));
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handlePrint = async () => {
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl);
      win.onload = () => {
        win.focus();
        win.print();
        // Không revoke ngay — cần chờ user xong in
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      };
    } catch {
      window.open(pdfUrl);
    }
  };

  if (!open || !pdfUrl) return null;

  // Scale tự động theo container
  const baseWidth = Math.max(320, containerWidth - 32);
  const pageWidth = baseWidth * scale;
  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(15,23,42,0.7)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "min(980px, 96vw)",
          height: "min(96vh, 1000px)",
          background: "#1e293b",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "10px 12px",
            background: "#0f172a",
            borderBottom: "0.5px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
            flexWrap: "wrap",
          }}>
          {/* Tên file */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                background: "#ef4444",
                borderRadius: 7,
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.5px",
                flexShrink: 0,
                userSelect: "none",
              }}>
              PDF
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#e2e8f0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
              {fileName}
            </span>
          </div>

          {/* Điều hướng trang */}
          {numPages && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 9,
                padding: "4px 8px",
                border: "0.5px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}>
              <Btn
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage <= 1}
                title="Trang trước">
                <IconChevron dir="down" />
              </Btn>
              <input
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePageInputBlur();
                }}
                style={{
                  width: 32,
                  textAlign: "center",
                  background: "rgba(255,255,255,0.1)",
                  border: "0.5px solid rgba(255,255,255,0.2)",
                  borderRadius: 5,
                  color: "#f1f5f9",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "3px 4px",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 12, color: "#64748b" }}>
                / {numPages}
              </span>
              <Btn
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage >= numPages}
                title="Trang sau">
                <IconChevron dir="up" />
              </Btn>
            </div>
          )}

          {/* Zoom + Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}>
            {/* Zoom */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 9,
                padding: "4px 8px",
                border: "0.5px solid rgba(255,255,255,0.1)",
              }}>
              <Btn
                onClick={() =>
                  setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))
                }
                disabled={scale <= 0.5}
                title="Thu nhỏ">
                <IconZoomOut />
              </Btn>
              <span
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  minWidth: 34,
                  textAlign: "center",
                }}>
                {Math.round(scale * 100)}%
              </span>
              <Btn
                onClick={() =>
                  setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))
                }
                disabled={scale >= 3}
                title="Phóng to">
                <IconZoomIn />
              </Btn>
            </div>

            {/* In */}
            <Btn onClick={handlePrint}>
              <IconPrint /> In
            </Btn>

            {/* Tải về */}
            <Btn
              onClick={handleDownload}
              style={{ background: "#3b82f6", border: "none", color: "#fff" }}>
              <IconDownload /> Tải về
            </Btn>

            {/* Đóng */}
            <Btn onClick={onClose} title="Đóng" style={{ padding: "7px 7px" }}>
              <IconClose />
            </Btn>
          </div>
        </div>

        {/* ── Body ── */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "auto",
            background: "#334155",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            padding: "16px",
          }}>
          {loading && <Spinner />}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setLoading(false)}
            loading={null}
            options={pdfOptions}>
            <Page
              pageNumber={currentPage}
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={null}
            />
          </Document>
        </div>

        {/* ── Footer: thanh trang nhỏ ── */}
        {numPages && numPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "8px 10px",
              background: "#0f172a",
              borderTop: "0.5px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
              flexWrap: "wrap",
              maxHeight: 72,
              overflowY: "auto",
            }}>
            {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goTo(p)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  background:
                    p === currentPage ? "#3b82f6" : "rgba(255,255,255,0.07)",
                  color: p === currentPage ? "#fff" : "#64748b",
                  fontSize: 11,
                  fontWeight: p === currentPage ? 700 : 400,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
