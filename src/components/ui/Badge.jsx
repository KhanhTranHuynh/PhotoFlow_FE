import React from "react";
import Icon from "@/components/ui/Icon";

const normalizeHexColor = (raw) => {
  if (!raw) return null;

  const s = String(raw).trim();

  if (!s) return null;

  // Allow css variable / rgb / hsl
  if (s.startsWith("var(") || s.startsWith("rgb") || s.startsWith("hsl")) {
    return s;
  }

  // Accept hex with or without #
  const hex = s.startsWith("#") ? s.slice(1) : s;

  if (!/^[0-9a-fA-F]{3,8}$/.test(hex)) {
    return s;
  }

  return `#${hex}`;
};

const hexToRgba = (hexColor, alpha = 0.12) => {
  const normalized = normalizeHexColor(hexColor);

  if (!normalized || !normalized.startsWith("#")) {
    return null;
  }

  const hex = normalized.slice(1);

  const h =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.length === 6 || hex.length === 8
        ? hex.slice(0, 6)
        : null;

  if (!h) return null;

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  if (![r, g, b].every((n) => Number.isFinite(n))) {
    return null;
  }

  const a = Number(alpha);

  return `rgba(${r}, ${g}, ${b}, ${
    Number.isFinite(a) ? Math.min(1, Math.max(0, a)) : 0.12
  })`;
};

const Badge = ({
  className = "bg-danger-500 text-white", // 👈 giữ logic cũ
  label,
  icon,
  color, // 👈 thêm mới nhưng không phá code cũ
  children,
}) => {
  const normalizedColor = normalizeHexColor(color);

  const badgeBg = hexToRgba(normalizedColor, 0.12);

  return (
    <span
      className={`badge ${className}`}
      style={
        normalizedColor
          ? {
              backgroundColor: badgeBg || normalizedColor,
              borderColor: normalizedColor,
              color: normalizedColor,
            }
          : undefined
      }>
      {!children && (
        <span className="inline-flex items-center">
          {icon && (
            <span className="inline-block ltr:mr-1 rtl:ml-1">
              <Icon icon={icon} />
            </span>
          )}

          {label}
        </span>
      )}

      {children && <span className="inline-flex items-center">{children}</span>}
    </span>
  );
};

export default Badge;
