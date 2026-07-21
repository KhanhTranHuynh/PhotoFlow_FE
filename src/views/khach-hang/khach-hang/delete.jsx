import React from "react";
import { toast } from "react-toastify";
import Modal from "@/views/component/Modal";
import Button from "@/components/ui/Button";

import { XoaKhachHang } from "@/store/api/khach-hang";
import { notifyApiByErrorCode } from "@/utils/api-toast";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const DeleteKhachHangModal = ({
  activeModal,
  onClose,
  selectedItem,
  onDeleted,
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload) => XoaKhachHang(payload),

    onSuccess: (res) => {
      notifyApiByErrorCode(res, {
        successMessage: "Xóa khách hàng thành công",
        errorMessage: "Xóa khách hàng thất bại",

        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["khachhang"] });

          onDeleted?.(selectedItem);
          onClose?.();
        },
      });
    },

    onError: (err) => {
      const msg = err?.response?.data?.message || "Xóa khách hàng thất bại";
      toast.error(msg, { position: "top-right" });
    },
  });

  const handleDelete = () => {
    if (isPending) return;
    if (!selectedItem?.id) return;

    mutate({ id: selectedItem.id });
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
        <strong>{selectedItem?.ho_ten || "này"}</strong> không? Hành động này
        không thể hoàn tác.
      </p>
    </Modal>
  );
};

export default DeleteKhachHangModal;
