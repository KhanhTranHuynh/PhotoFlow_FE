// src/api/descriptors/khachHang.js
//
// Mỗi API là 1 hàm chỉ MÔ TẢ request (key, apiUrl, method, params/data,
// signal), KHÔNG tự gọi gì cả. Muốn gọi 1 API hay tổ hợp nhiều API song
// song/tuần tự, dùng callApi/callApis (src/api/callApi.js) truyền
// descriptor(s) này vào. Thêm API mới = thêm 1 property, không đụng gì
// tới ApiRequestManager hay lớp caller.

export const KhachHangApi = {
  danhSach: (payload = {}, signal) => ({
    key: "khachHangDanhSach",
    apiUrl: "/khach-hang/danh-sach",
    method: "GET",
    params: payload,
    signal,
  }),

  taoMoi: (payload = {}, signal) => ({
    key: "khachHangTaoMoi",
    apiUrl: "/khach-hang/tao-moi",
    method: "POST",
    data: payload,
    signal,
  }),

  capNhat: (payload = {}, signal) => ({
    key: "khachHangCapNhat",
    apiUrl: "/khach-hang/cap-nhat",
    method: "POST",
    data: payload,
    signal,
  }),

  xoa: (payload = {}, signal) => ({
    key: "khachHangXoa",
    apiUrl: "/khach-hang/xoa",
    method: "POST",
    data: payload,
    signal,
  }),
};
