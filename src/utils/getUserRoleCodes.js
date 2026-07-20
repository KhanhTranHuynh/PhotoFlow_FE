// src/utils/getUserRoleCodes.js

/**
 * Gộp loai_dang_nhap + vai_tro thành 1 mảng role duy nhất.
 * - Khách hàng: chỉ có 1 "role" là chính "khach_hang"
 * - Nhân viên: roles là mảng vai_tro (vd: ["chu_studio"])
 */
export function getUserRoleCodes(user) {
  if (!user) return [];

  if (user.loai_dang_nhap === "khach_hang") {
    return ["khach_hang"];
  }

  if (user.loai_dang_nhap === "nhan_vien") {
    return Array.isArray(user.vai_tro) ? user.vai_tro : [];
  }

  return [];
}
