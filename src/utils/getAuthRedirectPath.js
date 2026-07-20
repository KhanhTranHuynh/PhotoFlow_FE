// src/utils/getAuthRedirectPath.js

export function getAuthRedirectPath(roleCodes = []) {
  const codes = Array.isArray(roleCodes)
    ? roleCodes.filter(Boolean).map(String)
    : [];

  if (codes.includes("khach_hang")) {
    return "/trang-chu";
  }

  if (codes.includes("chu_studio")) {
    return "/dashboard";
  }

  // Nhân viên có vai trò khác (chưa map) → profile
  if (codes.length > 0) {
    return "/profile";
  }

  return "/login";
}
