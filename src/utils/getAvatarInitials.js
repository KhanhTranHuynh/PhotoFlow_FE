// utils/getAvatarInitials.js

/**
 * Lấy chữ cái đầu của 2 từ cuối trong tên để hiển thị avatar.
 * VD: "Nguyễn Văn An" -> "VA"
 *
 * @param {string} fullName - tên đầy đủ
 * @param {string} fallback - giá trị trả về khi không có tên hợp lệ (mặc định "?")
 */
export const getAvatarInitials = (fullName, fallback = "?") => {
  return (
    fullName
      ?.trim()
      ?.split(/\s+/)
      ?.filter(Boolean)
      ?.slice(-2)
      ?.map((w) => w.charAt(0).toUpperCase())
      ?.join("") || fallback
  );
};
