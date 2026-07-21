import { ApiRequestManager } from "@/api/apiRequestManager";
import logger from "@/helpers/logger";

export const DanhSachKhachHang = async (payload = {}, signal) => {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay: true,
    apiList: [
      {
        key: "khachHangDanhSach",
        apiUrl: "/khach-hang/danh-sach",
        method: "GET",
        params: payload,
        signal,
      },
    ],
  });

  const result = results[0];

  if (result.status !== "success") {
    logger.error("[DanhSachKhachHang] Lỗi tải danh sách khách hàng", {
      apiUrl: "/khach-hang/danh-sach",
      params: payload,
      error: result?.error,
    });

    const error = new Error(
      result?.error?.message || "Không tải được danh sách khách hàng",
    );
    error.response = { data: result?.error?.responseData };
    error.statusCode = result?.error?.statusCode;
    throw error;
  }

  return result.data;
};

export const TaoKhachHangMoi = async (payload = {}, signal) => {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay: true,
    apiList: [
      {
        key: "khachHangTaoMoi",
        apiUrl: "/khach-hang/tao-moi",
        method: "POST",
        data: payload,
        signal,
      },
    ],
  });

  const result = results[0];

  if (result.status !== "success") {
    logger.error("[TaoKhachHangMoi] Lỗi tạo khách hàng", {
      apiUrl: "/khach-hang/tao-moi",
      payload,
      error: result?.error,
    });

    const error = new Error(
      result?.error?.message || "Tạo khách hàng thất bại",
    );
    error.response = { data: result?.error?.responseData };
    error.statusCode = result?.error?.statusCode;
    throw error;
  }

  return result.data;
};

export const CapNhatKhachHang = async (payload = {}, signal) => {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay: true,
    apiList: [
      {
        key: "khachHangCapNhat",
        apiUrl: "/khach-hang/cap-nhat",
        method: "PUT",
        data: payload,
        signal,
      },
    ],
  });

  const result = results[0];

  if (result.status !== "success") {
    logger.error("[CapNhatKhachHang] Lỗi cập nhật khách hàng", {
      apiUrl: "/khach-hang/cap-nhat",
      payload,
      error: result?.error,
    });

    const error = new Error(
      result?.error?.message || "Cập nhật khách hàng thất bại",
    );
    error.response = { data: result?.error?.responseData };
    error.statusCode = result?.error?.statusCode;
    throw error;
  }

  return result.data;
};

export const XoaKhachHang = async (payload = {}, signal) => {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay: true,
    apiList: [
      {
        key: "khachHangXoa",
        apiUrl: "/khach-hang/xoa",
        method: "DELETE",
        data: payload,
        signal,
      },
    ],
  });

  const result = results[0];

  if (result.status !== "success") {
    logger.error("[XoaKhachHang] Lỗi xóa khách hàng", {
      apiUrl: "/khach-hang/xoa",
      payload,
      error: result?.error,
    });

    const error = new Error(
      result?.error?.message || "Xóa khách hàng thất bại",
    );
    error.response = { data: result?.error?.responseData };
    error.statusCode = result?.error?.statusCode;
    throw error;
  }

  return result.data;
};

///////////////
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
