// src/api/descriptors/danhMucKhachHang.js
export const DanhMucKhachHangApi = {
  danhSach: (payload = {}, signal) => ({
    key: "danhMucKhachHangDanhSach",
    apiUrl: "/danh-muc-khach-hang/danh-sach",
    method: "GET",
    params: payload,
    signal,
  }),
};
