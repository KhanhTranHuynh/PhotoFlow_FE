// src/api/descriptors/nhanVien.js
export const NhanVienApi = {
  danhSach: (payload = {}, signal) => ({
    key: "NhanVienDanhSach",
    apiUrl: "/tai-khoan/danh-sach",
    method: "GET",
    params: payload,
    signal,
  }),
  taoMoi: (payload = {}, signal) => ({
    key: "NhanVienTaoMoi",
    apiUrl: "/tai-khoan/tao-moi",
    method: "POST",
    data: payload,
    signal,
  }),
};
