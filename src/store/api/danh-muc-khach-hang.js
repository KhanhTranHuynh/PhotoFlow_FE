import { ApiRequestManager } from "@/api/apiRequestManager";
import logger from "@/helpers/logger";

export const DanhSachDanhMucKhachHang = async (payload = {}, signal) => {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay: false,
    apiList: [
      {
        key: "danhMucKhachHangDanhSach",
        apiUrl: "/danh-muc-khach-hang/danh-sach",
        method: "GET",
        params: payload,
        signal,
      },
    ],
  });

  const result = results[0];

  if (result.status !== "success") {
    logger.error(
      "[DanhSachDanhMucKhachHang] Lỗi tải danh sách danh mục khách hàng",
      {
        apiUrl: "/danh-muc-khach-hang/danh-sach",
        params: payload,
        error: result?.error,
      },
    );

    const error = new Error(
      result?.error?.message || "Không tải được danh sách danh mục khách hàng",
    );
    error.response = { data: result?.error?.responseData };
    error.statusCode = result?.error?.statusCode;
    throw error;
  }

  return result.data;
};
