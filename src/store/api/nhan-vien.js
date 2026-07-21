import { callApi } from "@/api/callApi";
import { NhanVienApi } from "@/api/descriptors/nhanVien";

export const DanhSachNhanVien = (payload, signal) =>
  callApi(NhanVienApi.danhSach(payload, signal), { showOverlay: true });
