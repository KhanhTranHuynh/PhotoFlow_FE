export const isLikelyUrl = (value) => {
  if (!value) return false;
  const s = String(value);
  return /^https?:\/\//i.test(s) || s.startsWith("data:");
};

export const normalizeAttachments = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);

  if (typeof raw === "string") {
    // support comma-separated ids
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(String);
  }

  return [];
};

export const parseAttachmentsInfoToMap = (raw) => {
  if (!raw) return {};

  let value = raw;

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return {};
    try {
      value = JSON.parse(s);
    } catch {
      return {};
    }
  }

  // Expected: [{ uuid: { name, size } }, ...]
  if (Array.isArray(value)) {
    const out = {};
    value.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      const [uuid, info] = Object.entries(entry)[0] || [];
      if (!uuid) return;
      if (!info || typeof info !== "object") return;
      out[String(uuid)] = info;
    });
    return out;
  }

  // Also accept: { uuid: { name, size }, ... }
  if (value && typeof value === "object") {
    return value;
  }

  return {};
};

export const pickAttachmentName = (info) => {
  if (!info || typeof info !== "object") return "";
  const name =
    info.name ?? info.filename ?? info.fileName ?? info.tenhinh ?? info.tenHinh;
  return name ? String(name) : "";
};

export const pickAttachmentSizeBytes = (info) => {
  if (!info || typeof info !== "object") return null;
  const raw =
    info.size ??
    info.filesize ??
    info.fileSize ??
    info.dungluong ??
    info.dungLuong;
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

export const formatBytes = (
  bytes,
  { emptyText = "--", zeroText = "0 B" } = {},
) => {
  if (bytes === undefined || bytes === null || bytes === "") return emptyText;
  const num = Number(bytes);
  if (!Number.isFinite(num)) return emptyText;
  if (num <= 0) return zeroText;

  const units = ["B", "KB", "MB", "GB", "TB"];
  const idx = Math.min(
    units.length - 1,
    Math.floor(Math.log(num) / Math.log(1024)),
  );
  const val = num / 1024 ** idx;
  const decimals = idx === 0 ? 0 : val < 10 ? 1 : 0;
  return `${val.toFixed(decimals)} ${units[idx]}`;
};

const toAttachmentsInfoArray = (infoMap) =>
  Array.from(infoMap.entries()).map(([uuid, info]) => ({
    [uuid]: {
      name: info?.name || "",
      size: Number(info?.size || 0) || 0,
    },
  }));

const pickNameFromImg = (img) =>
  img?.filedata?.filename ||
  img?.filedata?.fileName ||
  img?.name ||
  img?.file?.name ||
  "";

const pickSizeFromImg = (img) => {
  // filedata.filesize từ API là string số bytes → ép Number
  if (
    img?.filedata?.filesize !== undefined &&
    img?.filedata?.filesize !== null
  ) {
    const n = Number(img.filedata.filesize);
    if (Number.isFinite(n)) return n;
  }
  return Number(img?.size ?? img?.file?.size ?? 0) || 0;
};

export const buildAttachmentsInfoFromImages = (images = []) => {
  const infoMap = new Map();

  (images || []).forEach((img) => {
    if (!img || img.uploading) return;
    const uuid = img.id;
    if (!uuid) return;

    // ✅ Bỏ qua temp id (còn dạng tmp_...) — chỉ lấy id thật từ API
    if (String(uuid).startsWith("tmp_")) return;

    infoMap.set(String(uuid), {
      name: pickNameFromImg(img),
      size: pickSizeFromImg(img),
    });
  });

  const arr = toAttachmentsInfoArray(infoMap);
  return arr.length ? JSON.stringify(arr) : null;
};

export const buildAttachmentsInfo = ({
  attachments = [],
  existingInfo = {},
  images = [],
} = {}) => {
  const attachmentSet = new Set(normalizeAttachments(attachments));
  const infoMap = new Map();
  const existingMap = parseAttachmentsInfoToMap(existingInfo);

  // existing info từ API (edit đơn hàng cũ)
  if (existingMap && typeof existingMap === "object") {
    Object.entries(existingMap).forEach(([uuid, info]) => {
      const idStr = String(uuid);
      if (!attachmentSet.has(idStr)) return;
      if (!info || typeof info !== "object") return;
      infoMap.set(idStr, {
        name: pickAttachmentName(info) || "",
        size: Number(pickAttachmentSizeBytes(info) ?? 0) || 0,
      });
    });
  }
  // new uploads — ✅ ưu tiên filedata API
  (images || []).forEach((img) => {
    if (!img || img.uploading) return;
    const uuid = img.id;
    if (!uuid) return;
    const idStr = String(uuid);
    if (!attachmentSet.has(idStr)) return;

    infoMap.set(idStr, {
      name: pickNameFromImg(img), // ✅
      size: pickSizeFromImg(img), // ✅
    });
  });

  const arr = toAttachmentsInfoArray(infoMap);
  return arr.length ? JSON.stringify(arr) : null;
};
