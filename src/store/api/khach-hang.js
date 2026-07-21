import { callApi } from "@/api/callApi";
import { KhachHangApi } from "@/api/descriptors/khachHang";

// Mỗi hàm dưới đây trả về NGUYÊN envelope PhanHoiChuan của BE:
// { data, message, messageSystem, code, status, token, rToken }.
// KHÔNG throw — nơi gọi tự đọc `.code` (code>=1: OK, code<0: lỗi) và
// `.message` để hiển thị (xem notifyApiByCode).

export const DanhSachKhachHang = (payload, signal) =>
  callApi(KhachHangApi.danhSach(payload, signal), { showOverlay: true });

export const TaoKhachHangMoi = (payload, signal) =>
  callApi(KhachHangApi.taoMoi(payload, signal), { showOverlay: true });

export const CapNhatKhachHang = (payload, signal) =>
  callApi(KhachHangApi.capNhat(payload, signal), { showOverlay: true });

export const XoaKhachHang = (payload, signal) =>
  callApi(KhachHangApi.xoa(payload, signal), { showOverlay: true });
