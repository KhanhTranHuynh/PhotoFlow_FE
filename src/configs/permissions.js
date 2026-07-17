export const permissions = {
  thaoTacChuyenDoiTrangThaiDonHangAdmin: ["ADMIN"],
  thaoTacChuyenDoiTrangThaiDonHangQuanLy: ["MANAGER"],
  thaoTacChuyenDoiTrangThaiDonHangKinhDoanh: ["STAFF_BUSINESS"],
  thaoTacChuyenDoiTrangThaiDonHangSanXuat: ["STAFF_TECHNICAL"],
  profileKhacKhachHang: [
    "ADMIN",
    "MANAGER",
    "STAFF_BUSINESS",
    "STAFF_TECHNICAL",
  ],
  quanLyTaiKhoan: ["ADMIN"],
  danhMucSanPham: ["ADMIN", "MANAGER"],
  nhomKhachHang: ["ADMIN", "MANAGER"],
  nhomKhachHang_view: ["ADMIN"],
  danhSachDonHang_noSTAFF_TECHNICAL: ["ADMIN", "MANAGER", "STAFF_BUSINESS"],

  ////////
  thong_bao_nhan_vien: [
    "ADMIN",
    "MANAGER",
    "STAFF_BUSINESS",
    "STAFF_TECHNICAL",
  ],

  ////////
  dashboard_admin_view: ["ADMIN"],
  dashboard_khachhang_view: ["CUSTOMER"],
  dashboard_view: ["ADMIN", "CUSTOMER"],

  ////////
  is_customer: ["CUSTOMER"],

  users: ["ADMIN"],
  orders: ["ADMIN", "STAFF"],
  products: ["ADMIN", "STAFF"],
};
