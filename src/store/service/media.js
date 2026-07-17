import { uploadBase } from "../api/media";

export function uploadImageMultiDraft({ files, isPublic = 1, imageinfos }) {
  return uploadBase({
    url: "/upload/image/multi-draft",
    files,
    data: {
      ispublic: isPublic,
      ...(imageinfos ? { imageinfos } : {}),
    },
  });
}

export function uploadZipDraft({ files, isPublic = 1 }) {
  return uploadBase({
    url: "/upload/zip/draft",
    files,
    data: {
      ispublic: isPublic,
    },
  });
}
