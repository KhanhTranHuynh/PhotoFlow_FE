import { ApiRequestManager } from "@/api/apiRequestManager";
import logger from "@/helpers/logger";

export const DanhSachVaiTro = async (payload = {}, signal) => {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay: true,
    apiList: [
      {
        key: "VaiTroDanhSach",
        apiUrl: "/vai-tro/danh-sach",
        method: "GET",
        params: payload,
        signal,
      },
    ],
  });

  const result = results[0];

  if (result.status !== "success") {
    logger.error("[DanhSachVaiTro] Lỗi tải danh sách vai trò", {
      apiUrl: "/vai-tro/danh-sach",
      params: payload,
      error: result?.error,
    });

    const error = new Error(
      result?.error?.message || "Không tải được danh sách vai trò",
    );
    error.response = { data: result?.error?.responseData };
    error.statusCode = result?.error?.statusCode;
    throw error;
  }

  return result.data;
};
