import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/views/component/Modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Autocomplete from "@/components/ui/Autocomplete";
import { useSelector } from "react-redux";

import { CapNhatKhachHang } from "@/store/api/khach-hang";
import { DanhSachDanhMucKhachHang } from "@/store/api/khach-hang";

import { notifyApiByCode } from "@/utils/api-toast";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const PHONE_REGEX = /^0\d{9}$/;

const INITIAL_FORM = {
  id: "",
  ho_ten: "",
  so_dien_thoai: "",
  dia_chi: "",
  ghi_chu: "",
  danh_muc_khach_hang_id: "",
  trang_thai: true,
  cho_phep_dang_nhap_portal: false,
};

const buildFormFromItem = (item) => ({
  id: item?.id || "",
  ho_ten: item?.ten || item?.ho_ten || "",
  so_dien_thoai: item?.so_dien_thoai || "",
  dia_chi: item?.dia_chi || "",
  ghi_chu: item?.ghi_chu || "",
  danh_muc_khach_hang_id: item?.danh_muc_khach_hang_id || "",
  trang_thai: item?.trang_thai ?? true,
  cho_phep_dang_nhap_portal: item?.cho_phep_dang_nhap_portal ?? false,
});

const EditKhachHangModal = ({
  activeModal,
  onClose,
  selectedItem,
  categoryOptions = [],
  onUpdated,
}) => {
  const user = useSelector((state) => state.auth.user);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeModal) {
      setForm(buildFormFromItem(selectedItem));
      setErrors({});
    }
  }, [activeModal, selectedItem]);

  useEffect(() => {
    if (!activeModal) return;
    if (categoryOptions && categoryOptions.length) return;

    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await DanhSachDanhMucKhachHang(
          {
            trang: 1,
            so_luong: 100,
            dang_hoat_dong: true,
            id_studio_local: user?.id_studio_local,
          },
          controller.signal,
        );
        // API trả về: res.data.du_lieu (mảng danh mục), res.data.phan_trang
        const items = res?.data?.du_lieu;
        setCategoryData(Array.isArray(items) ? items : []);
      } catch (err) {
        if (err?.code !== "ERR_CANCELED") {
          setCategoryData([]);
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, [activeModal, categoryOptions.length, user?.id_studio_local]);

  const categorySelectOptions = useMemo(() => {
    const src =
      categoryOptions && categoryOptions.length
        ? categoryOptions
        : categoryData;

    return src.map((item) => ({
      label: item?.ten_hien_thi || item?.ma_danh_muc || "",
      value: item?.id_danh_muc_khach_hang || item?.ma_danh_muc || "",
    }));
  }, [categoryOptions, categoryData]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.id) {
      nextErrors.id = "Thiếu id khách hàng";
    }

    if (!form.ho_ten.trim()) {
      nextErrors.ho_ten = "Vui lòng nhập họ tên";
    }

    if (
      form.so_dien_thoai.trim() &&
      !PHONE_REGEX.test(form.so_dien_thoai.trim())
    ) {
      nextErrors.so_dien_thoai = "Số điện thoại không hợp lệ";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload) => CapNhatKhachHang(payload),

    onSuccess: (res, variables) => {
      notifyApiByCode(res, {
        successMessage: "Cập nhật khách hàng thành công",
        errorMessage: "Cập nhật khách hàng thất bại",

        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["khachhang"] });

          const updated = res?.data?.item || res?.data || res?.item || null;

          onUpdated?.(updated || variables);
          onClose?.();
        },
      });
    },

    onError: (err) => {
      const msg =
        err?.response?.data?.message || "Cập nhật khách hàng thất bại";
      toast.error(msg, { position: "top-right" });
    },
  });

  const handleSave = () => {
    if (isPending) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      id: form.id,
      ho_ten: form.ho_ten.trim(),
      ...(form.so_dien_thoai.trim() && {
        so_dien_thoai: form.so_dien_thoai.trim(),
      }),
      ...(form.dia_chi.trim() && { dia_chi: form.dia_chi.trim() }),
      ...(form.ghi_chu.trim() && { ghi_chu: form.ghi_chu.trim() }),
      danh_muc_khach_hang_id: form.danh_muc_khach_hang_id || null,
      trang_thai: !!form.trang_thai,
      cho_phep_dang_nhap_portal: !!form.cho_phep_dang_nhap_portal,
    };

    mutate(payload);
  };

  return (
    <Modal
      activeModal={activeModal}
      onClose={onClose}
      title="Sửa khách hàng"
      className="max-w-3xl"
      centered
      background="#FFFFFF"
      showDivider
      scrollContent
      footerContent={
        <>
          <Button
            text="Hủy"
            buttonClose
            onClick={onClose}
            disabled={isPending}
          />

          <Button
            text="Lưu"
            icon="heroicons-outline:save"
            buttonSave
            onClick={handleSave}
            isLoading={isPending}
            disabled={isPending}
          />
        </>
      }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textinput
            required
            label="Họ tên"
            placeholder="Nhập họ tên khách hàng"
            value={form.ho_ten}
            onChange={(e) => setField("ho_ten", e.target.value)}
            error={errors.ho_ten ? { message: errors.ho_ten } : null}
          />

          <Textinput
            phone
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            value={form.so_dien_thoai}
            onChange={(e) => setField("so_dien_thoai", e.target.value)}
            error={
              errors.so_dien_thoai ? { message: errors.so_dien_thoai } : null
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Địa chỉ"
            placeholder="Nhập địa chỉ khách hàng"
            value={form.dia_chi}
            onChange={(e) => setField("dia_chi", e.target.value)}
          />

          <Autocomplete
            label="Nhóm khách hàng"
            placeholder={
              loadingCategories
                ? "Đang tải nhóm khách hàng..."
                : "-- Chọn nhóm khách hàng --"
            }
            options={categorySelectOptions}
            value={form.danh_muc_khach_hang_id || null}
            onChange={(val) => setField("danh_muc_khach_hang_id", val ?? "")}
          />

          <Textarea
            label="Ghi chú"
            placeholder="Nhập ghi chú khách hàng"
            value={form.ghi_chu}
            onChange={(e) => setField("ghi_chu", e.target.value)}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="trang_thai"
              checked={form.trang_thai}
              onChange={(e) => setField("trang_thai", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="trang_thai">Đang hoạt động</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cho_phep_dang_nhap_portal"
              checked={form.cho_phep_dang_nhap_portal}
              onChange={(e) =>
                setField("cho_phep_dang_nhap_portal", e.target.checked)
              }
              className="w-4 h-4"
            />
            <label htmlFor="cho_phep_dang_nhap_portal">
              Cho phép đăng nhập portal
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditKhachHangModal;
