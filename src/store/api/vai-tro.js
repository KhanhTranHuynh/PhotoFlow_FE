import { callApi } from "@/api/callApi";
import { VaiTroApi } from "@/api/descriptors/vaiTro";

export const DanhSachVaiTro = (payload, signal) =>
  callApi(VaiTroApi.danhSach(payload, signal), { showOverlay: true });
