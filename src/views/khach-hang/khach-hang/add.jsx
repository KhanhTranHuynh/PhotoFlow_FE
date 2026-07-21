import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/views/component/Modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Autocomplete from "@/components/ui/Autocomplete";
import { useSelector } from "react-redux";

import { TaoKhachHangMoi } from "@/store/api/khach-hang";
import { DanhSachDanhMucKhachHang } from "@/store/api/danh-muc-khach-hang";

import { notifyApiByCode } from "@/utils/api-toast";

// react-query
import { useMutation, useQueryClient } from "@tanstack/react-query";

const PHONE_REGEX = /^0\d{9}$/;

const INITIAL_FORM = {
  ho_ten: "",
  so_dien_thoai: "",
  mat_khau: "",
  email: "",
  so_dien_thoai_lien_he: "",
  dia_chi: "",
  ghi_chu: "",
  danh_muc_khach_hang_id: "",
  cho_phep_dang_nhap_portal: false,
};

const AddKhachHangModal = ({
  activeModal,
  onClose,
  categoryOptions = [],
  onCreated,
}) => {
  const user = useSelector((state) => state.auth.user);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const fetchedCategoriesRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeModal) {
      setForm(INITIAL_FORM);
      setErrors({});
      fetchedCategoriesRef.current = false; // reset mỗi khi mở modal
    }
  }, [activeModal]);

  useEffect(() => {
    if (!activeModal) return;
    if (categoryOptions && categoryOptions.length) return;
    if (fetchedCategoriesRef.current) return; // chặn gọi lặp

    const controller = new AbortController();

    const fetchCategories = async () => {
      fetchedCategoriesRef.current = true;
      setLoadingCategories(true);

      // DanhSachDanhMucKhachHang không throw nữa — luôn trả envelope
      // PhanHoiChuan, phân biệt lỗi bằng "code" thay vì try/catch.
      const res = await DanhSachDanhMucKhachHang(
        {
          trang: 1,
          so_luong: 100,
          dang_hoat_dong: true,
          id_studio_local: user?.id_studio_local,
        },
        controller.signal,
      );

      if (res.__networkError && controller.signal.aborted) {
        setLoadingCategories(false);
        return;
      }

      if (res.code < 0) {
        setCategoryData([]);
        setLoadingCategories(false);
        return;
      }

      // API trả về: res.data.du_lieu (mảng danh mục), res.data.phan_trang
      const items = res?.data?.du_lieu;
      setCategoryData(Array.isArray(items) ? items : []);
      setLoadingCategories(false);
    };

    fetchCategories();

    return () => controller.abort();
    // dùng .length thay vì cả mảng categoryOptions để tránh đổi reference mỗi render
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

    if (!form.ho_ten.trim()) {
      nextErrors.ho_ten = "Vui lòng nhập họ tên";
    }

    if (!form.so_dien_thoai.trim()) {
      nextErrors.so_dien_thoai = "Vui lòng nhập số điện thoại";
    } else if (!PHONE_REGEX.test(form.so_dien_thoai.trim())) {
      nextErrors.so_dien_thoai = "Số điện thoại không hợp lệ";
    }

    if (!form.mat_khau.trim()) {
      nextErrors.mat_khau = "Vui lòng nhập mật khẩu";
    } else if (form.mat_khau.trim().length < 6) {
      nextErrors.mat_khau = "Mật khẩu tối thiểu 6 ký tự";
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = "Email không hợp lệ";
    }

    if (
      form.so_dien_thoai_lien_he.trim() &&
      !PHONE_REGEX.test(form.so_dien_thoai_lien_he.trim())
    ) {
      nextErrors.so_dien_thoai_lien_he = "Số điện thoại liên hệ không hợp lệ";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  // TaoKhachHangMoi không throw — luôn resolve với envelope PhanHoiChuan.
  // notifyApiByCode tự đọc res.code để quyết định gọi onSuccess hay hiện
  // lỗi, nên useMutation chỉ cần mutationFn trả thẳng envelope.
  const { mutate, isPending } = useMutation({
    mutationFn: (payload) => TaoKhachHangMoi(payload),

    onSuccess: (res, variables) => {
      notifyApiByCode(res, {
        successMessage: "Thêm khách hàng thành công",
        errorMessage: "Thêm khách hàng thất bại",

        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["khachhang"] });

          const created = res?.data?.item || res?.data || null;

          onCreated?.(created || variables);
          onClose?.();
        },
      });
    },

    // Vì mutationFn không còn throw, nhánh này chỉ còn bắt lỗi thật sự
    // ngoài dự kiến (bug trong code xử lý, không phải lỗi API).
    onError: (err) => {
      toast.error(err?.message || "Thêm khách hàng thất bại", {
        position: "top-right",
      });
    },
  });

  const handleSave = () => {
    if (isPending) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      id_studio_local: user?.id_studio_local,
      ho_ten: form.ho_ten.trim(),
      so_dien_thoai: form.so_dien_thoai.trim(),
      mat_khau: form.mat_khau.trim(),
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.so_dien_thoai_lien_he.trim() && {
        so_dien_thoai_lien_he: form.so_dien_thoai_lien_he.trim(),
      }),
      ...(form.dia_chi.trim() && { dia_chi: form.dia_chi.trim() }),
      ...(form.ghi_chu.trim() && { ghi_chu: form.ghi_chu.trim() }),
      ...(form.danh_muc_khach_hang_id && {
        danh_muc_khach_hang_id: form.danh_muc_khach_hang_id,
      }),
      cho_phep_dang_nhap_portal: !!form.cho_phep_dang_nhap_portal,
    };

    mutate(payload);
  };

  return (
    <Modal
      activeModal={activeModal}
      onClose={onClose}
      title="Thêm khách hàng"
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
            required
            phone
            label="Số điện thoại"
            placeholder="Nhập số điện thoại đăng nhập"
            value={form.so_dien_thoai}
            onChange={(e) => setField("so_dien_thoai", e.target.value)}
            error={
              errors.so_dien_thoai ? { message: errors.so_dien_thoai } : null
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textinput
            required
            type="password"
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự"
            value={form.mat_khau}
            onChange={(e) => setField("mat_khau", e.target.value)}
            error={errors.mat_khau ? { message: errors.mat_khau } : null}
          />

          <Textinput
            email
            label="Email"
            placeholder="Địa chỉ email (không bắt buộc)"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            error={errors.email ? { message: errors.email } : null}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textinput
            phone
            label="Số điện thoại liên hệ"
            placeholder="Số điện thoại liên hệ khác (không bắt buộc)"
            value={form.so_dien_thoai_lien_he}
            onChange={(e) => setField("so_dien_thoai_lien_he", e.target.value)}
            error={
              errors.so_dien_thoai_lien_he
                ? { message: errors.so_dien_thoai_lien_he }
                : null
            }
          />

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
                : "-- Chọn nhóm khách hàng (không bắt buộc) --"
            }
            options={categorySelectOptions}
            value={form.danh_muc_khach_hang_id ?? null}
            onChange={(val) => setField("danh_muc_khach_hang_id", val ?? null)}
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

export default AddKhachHangModal;
