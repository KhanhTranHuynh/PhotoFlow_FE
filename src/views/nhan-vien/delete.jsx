import React from "react";
import { toast } from "react-toastify";
import Modal from "@/views/component/Modal";
import Button from "@/components/ui/Button";

import { callApi } from "@/api/callApi";
import { NhanVienApi } from "@/api/descriptors/nhanVien";
import { notifyApiByCode } from "@/utils/api-toast";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const DeleteKhachHangModal = ({
  activeModal,
  onClose,
  selectedItem,
  onDeleted,
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload) =>
      callApi(NhanVienApi.xoa(payload), { showOverlay: true }),

    onSuccess: (res) => {
      notifyApiByCode(res, {
        successMessage: "Xóa nhân viên thành công",
        errorMessage: "Xóa nhân viên thất bại",

        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["nhanvien"] });

          onDeleted?.(selectedItem);
          onClose?.();
        },
      });
    },

    onError: (err) => {
      const msg = err?.response?.data?.message || "Xóa nhân viên thất bại";
      toast.error(msg, { position: "top-right" });
    },
  });

  const handleDelete = () => {
    // if (isPending) return;
    // if (!selectedItem?.id) return;

    mutate({ id_tai_khoan_khach_hang: selectedItem.id_tai_khoan_khach_hang });
  };

  return (
    <Modal
      activeModal={activeModal}
      onClose={onClose}
      title="Xóa khách hàng"
      className="max-w-md"
      centered
      background="#FFFFFF"
      showDivider
      footerContent={
        <>
          <Button
            text="Hủy"
            buttonClose
            onClick={onClose}
            disabled={isPending}
          />

          <Button
            text="Xóa"
            icon="heroicons-outline:trash"
            buttonDanger
            onClick={handleDelete}
            isLoading={isPending}
            disabled={isPending}
          />
        </>
      }>
      <p>
        Bạn có chắc chắn muốn xóa khách hàng{" "}
        <strong>{selectedItem?.ten || "này"}</strong> không? Hành động này không
        thể hoàn tác.
      </p>
    </Modal>
  );
};

export default DeleteKhachHangModal;
