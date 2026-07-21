import React from "react";
import TabsWithIcon from "@/components/ui/TabsWithIcon";
import DanhMucKhachHang from "@/pages/main/khach-hang/danh-muc-khach-hang";
import KhachHangListPage from "@/pages/main/khach-hang/khach-hang";
import usePermission from "@/hooks/usePermission";

const KhachHangPage = () => {
  const tabItems = [
    {
      title: "Nhóm khách hàng",
      icon: "heroicons-outline:user-group",
      content: <DanhMucKhachHang />,
    },

    {
      title: "Khách hàng",
      icon: "heroicons-outline:user",
      content: <KhachHangListPage />,
    },
  ];

  return (
    <>
      <h5 className="mb-6">Khách hàng</h5>

      <TabsWithIcon items={tabItems} panelClassName="" />
    </>
  );
};

export default KhachHangPage;
