import { ApiRequestManager } from "@/api/apiRequestManager";
import logger from "@/helpers/logger";

export const DanhSachNhanVien = async (payload = {}, signal) => {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay: true,
    apiList: [
      {
        key: "NhanVienDanhSach",
        apiUrl: "/tai-khoan/danh-sach",
        method: "GET",
        params: payload,
        signal,
      },
    ],
  });

  const result = results[0];

  if (result.status !== "success") {
    logger.error("[DanhSachNhanVien] Lỗi tải danh sách nhân viên", {
      apiUrl: "/tai-khoan/danh-sach",
      params: payload,
      error: result?.error,
    });

    const error = new Error(
      result?.error?.message || "Không tải được danh sách nhân viên",
    );
    error.response = { data: result?.error?.responseData };
    error.statusCode = result?.error?.statusCode;
    throw error;
  }

  return result.data;
};
