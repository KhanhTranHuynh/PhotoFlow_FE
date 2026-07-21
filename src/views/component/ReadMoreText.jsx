import React, { useState, useRef, useLayoutEffect } from "react";

const ReadMoreText = ({
  text = "",
  maxLength = 100,
  maxLines = 2,
  className = "",
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const pRef = useRef(null);

  useLayoutEffect(() => {
    const el = pRef.current;
    if (!el) return;

    // Đo khi đang ở trạng thái clamp
    const fullHeight = el.scrollHeight;
    const clampedHeight = el.clientHeight;

    setIsOverflow(fullHeight > clampedHeight || text.length > maxLength);
  }, [text, maxLength, maxLines]);

  if (!text?.trim()) {
    return <span>-</span>;
  }

  const displayText =
    !expanded && text.length > maxLength
      ? `${text.slice(0, maxLength).trim()}...`
      : text;

  const lineClampStyle = !expanded
    ? {
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }
    : {};

  return (
    <div className={className}>
      <p
        ref={pRef}
        className="whitespace-pre-wrap break-words transition-all"
        style={lineClampStyle}>
        {displayText}
      </p>

      {isOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-xs text-primary-500 hover:underline">
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
};

export default ReadMoreText;