import React from "react";
import TabsWithIcon from "@/components/ui/TabsWithIcon";
import KhachHangListPage from "./khach-hang";

const KhachHangPage = () => {
  const tabItems = [
    {
      title: "Danh Mục Khách Hàng",
      icon: "heroicons-outline:users",
      content: <KhachHangListPage />,
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
