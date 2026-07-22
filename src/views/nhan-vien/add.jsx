import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/views/component/Modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Autocomplete from "@/components/ui/Autocomplete";
import { useSelector } from "react-redux";
import { callApis } from "@/api/callApi";
import { NhanVienApi } from "@/api/descriptors/nhanVien";
import { notifyApiByCode } from "@/utils/api-toast";

// react-query
import { useMutation, useQueryClient } from "@tanstack/react-query";

const PHONE_REGEX = /^0\d{9}$/;

const INITIAL_FORM = {
  ho_ten: "",
  so_dien_thoai: "",
  mat_khau: "",
  email: "",
  vai_tro: [], // mảng mã vai trò, vd: ["chu_studio"]
  cho_phep_dang_nhap_portal: false,
};

const AddNhanVienModal = ({
  activeModal,
  onClose,
  vaiTroOptions = [],
  vaiTroLoading = false,
  onCreated,
}) => {
  const user = useSelector((state) => state.auth.user);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeModal) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [activeModal]);

  // vaiTroOptions là danh sách vai trò lấy từ VaiTroApi.danhSach ở component cha,
  // mỗi item có dạng { id_vai_tro/ma_vai_tro, ten_hien_thi }
  const vaiTroSelectOptions = useMemo(
    () =>
      (vaiTroOptions || []).map((item) => ({
        label: item?.ten_hien_thi || item?.ma_vai_tro || "",
        value: item?.ma_vai_tro || item?.id_vai_tro || "",
      })),
    [vaiTroOptions],
  );

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

    if (!form.vai_tro || form.vai_tro.length === 0) {
      nextErrors.vai_tro = "Vui lòng chọn ít nhất một vai trò";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload) =>
      callApis([NhanVienApi.taoMoi(payload)], {
        parallel: true,
        showOverlay: true,
      }),

    onSuccess: (res, variables) => {
      notifyApiByCode(res, {
        successMessage: "Thêm nhân viên thành công",
        errorMessage: "Thêm nhân viên thất bại",

        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["nhanvien"] });

          const created = res?.data?.item || res?.data || res?.item || null;

          onCreated?.(created || variables);
          onClose?.();
        },
      });
    },

    onError: (err) => {
      const msg = err?.response?.data?.message || "Thêm nhân viên thất bại";
      notifyApiByCode(err?.response?.data, {
        errorMessage: msg,
      });
    },
  });

  const handleSave = () => {
    if (isPending) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      so_dien_thoai: form.so_dien_thoai.trim(),
      mat_khau: form.mat_khau.trim(),
      ho_ten: form.ho_ten.trim(),
      vai_tro: (Array.isArray(form.vai_tro) ? form.vai_tro : [form.vai_tro])
        .filter(Boolean)
        .map((v) => (typeof v === "object" ? v.value : v)),
      cho_phep_dang_nhap_portal: !!form.cho_phep_dang_nhap_portal,
      ...(form.email.trim() && { email: form.email.trim() }),
    };

    mutate(payload);
  };

  return (
    <Modal
      activeModal={activeModal}
      onClose={onClose}
      title="Thêm nhân viên"
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
            placeholder="Nhập họ tên nhân viên"
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
          <Autocomplete
            required
            multiple
            label="Vai trò"
            placeholder={
              vaiTroLoading ? "Đang tải vai trò..." : "-- Chọn vai trò --"
            }
            options={vaiTroSelectOptions}
            value={form.vai_tro}
            onChange={(val) => setField("vai_tro", val ?? [])}
            error={errors.vai_tro ? { message: errors.vai_tro } : null}
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

export default AddNhanVienModal;
