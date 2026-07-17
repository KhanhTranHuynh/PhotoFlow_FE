import React, { useMemo } from "react";
import Card from "@/views/component/Card";
import Button from "@/components/ui/Button";
import { formatMoneyPhay } from "@/helpers/convert";
import { useNavigate } from "react-router-dom";
import usePermission from "@/hooks/usePermission";

export default function ThaoTac({
  onSubmitDonHangChangeStatusOrder,
  onSubmitDonHangDoneOrder,
  onSubmitDonHangCancelOrder,
  onSubmitDonHangDeleteDraft,
  onSubmitDonHangDeleteOrder,
  onSubmitDonHangExportPdf,
  onSubmitDonHangExportPdfSmall,
  orderstatus_code,
  openNoteModal,
  orderId, // ✅ FIX: nhận orderId từ prop thay vì dùng useParams
}) {
  const navigate = useNavigate();
  console.log(
    "ThaoTac render, orderId:",
    orderId,
    "orderstatus_code:",
    orderstatus_code,
  );
  // ✅ FIX: dùng orderId từ prop, không dùng useParams()
  // useParams() trả về undefined khi ThaoTac render trong Chat (không có :id trong URL)
  const id = orderId;

  const isAdmin = usePermission("thaoTacChuyenDoiTrangThaiDonHangAdmin");
  const isQuanLy = usePermission("thaoTacChuyenDoiTrangThaiDonHangQuanLy");
  const isKinhDoanh = usePermission(
    "thaoTacChuyenDoiTrangThaiDonHangKinhDoanh",
  );
  const isSanXuat = usePermission("thaoTacChuyenDoiTrangThaiDonHangSanXuat");

  // true nếu có ÍT NHẤT 1 role trong danh sách
  const canAny = (...perms) => perms.some(Boolean);

  // Nhóm role tiện dùng
  const adminOrQL = canAny(isAdmin, isQuanLy);

  const xacNhanDonPremission = canAny(isAdmin, isQuanLy, isKinhDoanh);
  const duyetDonVaGhiNoPremission = canAny(isAdmin, isQuanLy);
  const duaVaoSanXuatPremission = canAny(isAdmin, isQuanLy);
  const banGiaoChoDonViVanChuyenPremission = canAny(
    isAdmin,
    isQuanLy,
    isKinhDoanh,
    isSanXuat,
  );
  const hoanThanhDonHangPremission = canAny(isAdmin, isQuanLy);
  const tuChoiDonChoDuyetPremission = canAny(isAdmin, isQuanLy);
  const tuChoiDonNhapPremission = canAny(isAdmin, isQuanLy);
  const huyDonHangPremission = canAny(isAdmin, isQuanLy);
  const xoaDonHangNhapPremission = canAny(isAdmin, isQuanLy, isKinhDoanh);
  const xoaDonHangKhacNhapPremission = canAny(isAdmin, isQuanLy, isKinhDoanh);
  const chinhSuaDonPremission = canAny(isAdmin, isQuanLy);
  const chinhSuaDonPremissionNhanVienKinhDoanh = canAny(isKinhDoanh);
  const inHoaDonKhachHangPremission = canAny(isAdmin, isQuanLy, isKinhDoanh);
  const inHoaDonSanXuatPremission = canAny(
    isAdmin,
    isQuanLy,
    isKinhDoanh,
    isSanXuat,
  );

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="text-sm font-semibold text-slate-700 uppercase">
          THAO TÁC NHANH
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {xacNhanDonPremission &&
          (orderstatus_code === "DRAFT" ||
            orderstatus_code === "NEW" ||
            (!adminOrQL && orderstatus_code === "REJECTED")) && (
            <Button
              xacNhanDon
              icon="heroicons-outline:check"
              text={
                orderstatus_code === "REJECTED"
                  ? "Yêu cầu phê duyệt"
                  : "Xác nhận đơn"
              }
              onClick={() =>
                onSubmitDonHangChangeStatusOrder({
                  statusCode: "AWAIT",
                  note: "",
                })
              }
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}

        {adminOrQL && orderstatus_code === "REJECTED" && (
          <Button
            xacNhanDon
            icon="heroicons-outline:check"
            text="Duyệt đơn & Ghi nợ"
            onClick={() =>
              openNoteModal({
                title: "Duyệt đơn & ghi nợ",
                message: "Bạn có chắc muốn duyệt đơn hàng này?",
                onConfirm: (note) =>
                  onSubmitDonHangChangeStatusOrder({
                    statusCode: "CONFIRMED",
                    note,
                  }),
              })
            }
            className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
          />
        )}

        {duyetDonVaGhiNoPremission && orderstatus_code === "AWAIT" && (
          <Button
            xacNhanDon
            icon="heroicons-outline:check"
            text="Duyệt đơn & Ghi nợ"
            onClick={() =>
              openNoteModal({
                title: "Duyệt đơn & ghi nợ",
                message: "Bạn có chắc muốn duyệt đơn hàng này?",
                onConfirm: (note) =>
                  onSubmitDonHangChangeStatusOrder({
                    statusCode: "CONFIRMED",
                    note,
                  }),
              })
            }
            className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
          />
        )}

        {duaVaoSanXuatPremission && orderstatus_code === "CONFIRMED" && (
          <Button
            xacNhanDon
            icon="heroicons-outline:check"
            text="Đưa vào sản xuất"
            onClick={() =>
              onSubmitDonHangChangeStatusOrder({
                statusCode: "IN_PROGRESS",
                note: "",
              })
            }
            className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
          />
        )}

        {banGiaoChoDonViVanChuyenPremission &&
          orderstatus_code === "IN_PROGRESS" && (
            <Button
              xacNhanDon
              icon="heroicons-outline:check"
              text="Bàn giao vận chuyển"
              onClick={() =>
                onSubmitDonHangChangeStatusOrder({
                  statusCode: "SHIPPING",
                  note: "",
                })
              }
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}

        {adminOrQL && orderstatus_code === "CONFIRMED" && (
          <Button
            xacNhanDon
            icon="heroicons-outline:check"
            text="Bàn giao vận chuyển"
            onClick={() =>
              openNoteModal({
                title: "Bàn giao cho đơn vị vận chuyển",
                message: (
                  <>
                    Bạn có chắc muốn chuyển đơn hàng sang trạng thái{" "}
                    <strong>Đang giao</strong>?
                  </>
                ),
                onConfirm: () =>
                  onSubmitDonHangChangeStatusOrder({
                    statusCode: "SHIPPING",
                    note: "",
                  }),
              })
            }
            className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
          />
        )}

        {hoanThanhDonHangPremission && orderstatus_code === "SHIPPING" && (
          <Button
            text="Hoàn thành đơn hàng"
            xacNhanDon
            icon="heroicons-outline:check"
            onClick={() =>
              openNoteModal({
                title: "Hoàn thành đơn hàng",
                message: "Bạn có chắc muốn hoàn thành đơn hàng này?",
                onConfirm: () =>
                  onSubmitDonHangDoneOrder({
                    note: "",
                  }),
              })
            }
            className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
          />
        )}

        {adminOrQL &&
          (orderstatus_code === "CONFIRMED" ||
            orderstatus_code === "IN_PROGRESS") && (
            <Button
              text="Hoàn thành đơn hàng"
              xacNhanDon
              icon="heroicons-outline:check"
              onClick={() =>
                openNoteModal({
                  title: "Hoàn thành đơn hàng",
                  message: (
                    <>
                      Bạn có chắc muốn chuyển đơn hàng sang trạng thái{" "}
                      <strong>Hoàn thành</strong>?
                    </>
                  ),
                  onConfirm: () =>
                    onSubmitDonHangDoneOrder({
                      note: "",
                    }),
                })
              }
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}

        {tuChoiDonChoDuyetPremission && orderstatus_code === "AWAIT" && (
          <Button
            icon="heroicons-outline:x-mark"
            tuChoi
            text="Từ chối"
            onClick={() =>
              onSubmitDonHangChangeStatusOrder({
                statusCode: "REJECTED",
                note: "",
              })
            }
            className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
          />
        )}

        {tuChoiDonNhapPremission && orderstatus_code === "DRAFT1" && (
          <Button
            buttonSave
            text="Từ chối đơn"
            onClick={() =>
              onSubmitDonHangChangeStatusOrder({
                statusCode: "REJECTED",
                note: "",
              })
            }
            className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
          />
        )}

        {huyDonHangPremission &&
          (orderstatus_code === "CONFIRMED" ||
            orderstatus_code === "IN_PROGRESS" ||
            orderstatus_code === "SHIPPING") && (
            <Button
              text="Hủy đơn hàng"
              huyDonHang
              icon="heroicons-outline:x-mark"
              onClick={onSubmitDonHangCancelOrder}
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}

        {xoaDonHangNhapPremission && orderstatus_code === "DRAFT" && (
          <Button
            text="Xóa đơn hàng"
            xoaDonHang
            icon="heroicons-outline:trash"
            onClick={() =>
              openNoteModal({
                title: "Xóa đơn hàng",
                message:
                  "Bạn có chắc muốn xóa đơn hàng này? Dữ liệu sẽ không thể khôi phục.",
                onConfirm: () => onSubmitDonHangDeleteDraft(),
              })
            }
            className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
          />
        )}

        {xoaDonHangKhacNhapPremission &&
          (orderstatus_code === "AWAIT" ||
            orderstatus_code === "NEW" ||
            orderstatus_code === "REJECTED") && (
            <Button
              text="Xóa đơn hàng"
              xoaDonHang
              icon="heroicons-outline:trash"
              onClick={() =>
                openNoteModal({
                  title: "Xóa đơn hàng",
                  message:
                    "Bạn có chắc muốn xóa đơn hàng này? Dữ liệu sẽ không thể khôi phục.",
                  onConfirm: (note) =>
                    onSubmitDonHangDeleteOrder({
                      note,
                    }),
                })
              }
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}

        {chinhSuaDonPremission &&
          (orderstatus_code === "DRAFT" ||
            orderstatus_code === "NEW" ||
            orderstatus_code === "AWAIT" ||
            orderstatus_code === "REJECTED" ||
            orderstatus_code === "CONFIRMED" ||
            orderstatus_code === "IN_PROGRESS") && (
            <Button
              text="Chỉnh sửa đơn"
              chinhSuaDon
              icon="heroicons-outline:pencil"
              onClick={() => navigate(`/don-hang/sua-don-hang/${id}`)}
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}

        {chinhSuaDonPremissionNhanVienKinhDoanh &&
          (orderstatus_code === "DRAFT" ||
            orderstatus_code === "NEW" ||
            orderstatus_code === "AWAIT" ||
            orderstatus_code === "REJECTED") && (
            <Button
              text="Chỉnh sửa đơn"
              chinhSuaDon
              icon="heroicons-outline:pencil"
              onClick={() => navigate(`/don-hang/sua-don-hang/${id}`)}
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}

        {inHoaDonKhachHangPremission &&
          (orderstatus_code === "DRAFT" ||
            orderstatus_code === "AWAIT" ||
            orderstatus_code === "NEW" ||
            orderstatus_code === "CONFIRMED" ||
            orderstatus_code === "IN_PROGRESS" ||
            orderstatus_code === "SHIPPING" ||
            orderstatus_code === "DONE") && (
            <Button
              text="In hóa đơn khách hàng"
              inHoaDonKhachHang
              icon="heroicons-outline:printer"
              onClick={onSubmitDonHangExportPdf}
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}

        {inHoaDonSanXuatPremission &&
          (orderstatus_code === "CONFIRMED" ||
            orderstatus_code === "IN_PROGRESS" ||
            orderstatus_code === "SHIPPING" ||
            orderstatus_code === "DONE") && (
            <Button
              text="In hóa đơn sản xuất"
              inHoaDonSanXuat
              icon="heroicons-outline:printer"
              onClick={onSubmitDonHangExportPdfSmall}
              className="w-full min-w-0 whitespace-normal text-center leading-tight py-2 h-auto"
            />
          )}
      </div>
    </div>
  );
}
