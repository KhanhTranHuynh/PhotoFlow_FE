import React, { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { pickAttachmentName } from "@/utils/attachmentsInfo";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

// ─── Lazy image item ─────────────────────────────────────────────────────────

function GalleryItem({ id, src, label, onVisible, onClick }) {
  const ref = useRef(null);

  useEffect(() => {
    if (src) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        onVisible(id);
      },
      { rootMargin: "120px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [id, src, onVisible]);

  return (
    <div
      ref={ref}
      className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 cursor-pointer group"
      onClick={() => src && onClick(id)}>
      <div className="w-full h-28 bg-slate-100 relative">
        {src ? (
          <>
            <img src={src} alt={label} className="w-full h-full object-cover" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Icon icon="heroicons-outline:photo" width={28} />
          </div>
        )}
      </div>
      <div className="px-2 py-1.5">
        <div className="text-xs text-slate-600 truncate" title={label}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export default function ImageGalleryModal({
  isOpen,
  onClose,
  attachments = [],
  imageMap = {},
  attachmentsInfo,
  onRequestImage,
}) {
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  // Esc to close modal (chỉ khi lightbox đóng)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape" && !lightbox.open) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, lightbox.open]);

  const handleImageClick = useCallback(
    (id) => {
      // Chỉ lấy những ảnh đã load được để làm slides
      const loadedAttachments = attachments.filter((aid) => imageMap[aid]);
      const idx = loadedAttachments.findIndex((aid) => aid === id);
      setLightbox({ open: true, index: idx >= 0 ? idx : 0 });
    },
    [attachments, imageMap],
  );

  if (!isOpen) return null;

  const getLabel = (id) => {
    const info = attachmentsInfo?.[id];
    return pickAttachmentName(info) || `IMG_${id}.jpg`;
  };

  // Slides chỉ từ ảnh đã load
  const loadedAttachments = attachments.filter((id) => imageMap[id]);
  const slides = loadedAttachments.map((id) => ({
    src: imageMap[id],
    title: getLabel(id),
  }));

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
            <span className="font-medium text-slate-800 text-sm">
              Ảnh đính kèm
              <span className="ml-2 text-slate-400 font-normal">
                {attachments.length} ảnh
              </span>
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition p-1 rounded hover:bg-slate-100">
              <Icon icon="heroicons-outline:x-mark" width={18} />
            </button>
          </div>

          {/* Grid */}
          <div className="overflow-y-auto p-4">
            <div className="grid grid-cols-4 gap-3">
              {attachments.map((id) => (
                <GalleryItem
                  key={id}
                  id={id}
                  src={imageMap[id]}
                  label={getLabel(id)}
                  onVisible={onRequestImage}
                  onClick={handleImageClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox — z-index cao hơn modal */}
      <Lightbox
        plugins={[Zoom]}
        zoom={{ maxZoomPixelRatio: 10 }}
        open={lightbox.open}
        index={lightbox.index}
        close={() => setLightbox((p) => ({ ...p, open: false }))}
        slides={slides} // ✅ dùng biến slides đã build sẵn bên trên
        styles={{
          container: { backgroundColor: "rgba(0,0,0,0.8)" },
        }}
      />
    </>
  );
}
