import { callApi } from "@/api/callApi";
import { DanhMucKhachHangApi } from "@/api/descriptors/danhMucKhachHang";

export const DanhSachDanhMucKhachHang = (payload, signal) =>
  callApi(DanhMucKhachHangApi.danhSach(payload, signal), {
    showOverlay: false,
  });
