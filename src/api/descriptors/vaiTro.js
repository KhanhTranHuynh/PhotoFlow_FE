// src/api/descriptors/vaiTro.js
export const VaiTroApi = {
  danhSach: (payload = {}, signal) => ({
    key: "VaiTroDanhSach",
    apiUrl: "/vai-tro/danh-sach",
    method: "GET",
    params: payload,
    signal,
  }),
};
