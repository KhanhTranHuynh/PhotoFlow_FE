// src/utils/getAuthRedirectPath.js

/**
 * Xác định trang redirect sau khi đăng nhập / khi vào "/"
 * dựa trên loai_dang_nhap + vai_tro của user.
 *
 * @param {object|null} user - object user trả về từ API (data), gồm:
 *   loai_dang_nhap: "nhan_vien" | "khach_hang"
 *   vai_tro: string[]  (chỉ có ý nghĩa khi loai_dang_nhap = "nhan_vien")
 */
export function getAuthRedirectPath(user) {
  if (!user) return "/login";

  const loaiDangNhap = user.loai_dang_nhap;
  const vaiTro = Array.isArray(user.vai_tro) ? user.vai_tro : [];

  // Khách hàng → trang chủ
  if (loaiDangNhap === "khach_hang") {
    return "/trang-chu";
  }

  // Nhân viên
  if (loaiDangNhap === "nhan_vien") {
    // Chủ studio (vai trò quản trị) → dashboard
    if (vaiTro.includes("chu_studio")) {
      return "/dashboard";
    }
    // Các vai trò nhân viên khác → trang cá nhân
    return "/profile";
  }

  // Fallback an toàn
  return "/profile";
}
