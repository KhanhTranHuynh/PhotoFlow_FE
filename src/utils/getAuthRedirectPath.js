export function getAuthRedirectPath(roleCodes = []) {
  const codes = Array.isArray(roleCodes)
    ? roleCodes.filter(Boolean).map(String)
    : [];

  // Admin & Customer có thể vào Tổng quan
  if (codes.includes("ADMIN") || codes.includes("CUSTOMER")) {
    return "/dashboard";
  }

  // Nhân viên/Quản lý: vào danh sách đơn hàng (tránh trang tổng quan không có quyền API)
  if (
    codes.some((c) =>
      ["MANAGER", "STAFF_BUSINESS", "STAFF_TECHNICAL", "STAFF"].includes(c),
    )
  ) {
    return "/don-hang/danh-sach";
  }

  // Fallback an toàn
  return "/don-hang/danh-sach";
}
