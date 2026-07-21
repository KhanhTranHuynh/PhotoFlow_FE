import React, { useEffect, useMemo, useRef, useState } from "react";
import { DanhSachKhachHang } from "@/store/api/khach-hang";
import SearchTable from "@/views/component/SearchTable";
import TempTable from "@/views/component/TempTable";
import Card from "@/views/component/Card";
import Button from "@/components/ui/Button";
import apiHelper from "@/helpers/apiHelper";
import usePermission from "@/hooks/usePermission";
import AddKhachHangModal from "../../../views/khach-hang/khach-hang/add";
import EditKhachHangModal from "../../../views/khach-hang/khach-hang/edit";
import DeleteKhachHangModal from "../../../views/khach-hang/khach-hang/delete";

const COLUMNS = [
  {
    Header: "STT",
    accessor: "stt",
    width: 60,
    Cell: ({ row }) => {
      const idx = row?.index;
      return <span>{typeof idx === "number" ? idx + 1 : "-"}</span>;
    },
  },
  {
    Header: "Tên khách hàng",
    accessor: "ten",
    width: 200,
    Cell: ({ row }) => (
      <span>{apiHelper.safeValue(row.original, ["ten"], "--")}</span>
    ),
  },
  {
    Header: "Số điện thoại",
    accessor: "so_dien_thoai",
    width: 150,
    Cell: ({ row }) => (
      <span>{apiHelper.safeValue(row.original, ["so_dien_thoai"], "--")}</span>
    ),
  },
  {
    Header: "Nhóm khách hàng",
    accessor: "danh_muc_khach_hang_ten",
    width: 180,
    Cell: ({ row }) => (
      <span>
        {apiHelper.safeValue(row.original, ["danh_muc_khach_hang_ten"], "--")}
      </span>
    ),
  },
  {
    Header: "Trạng thái",
    accessor: "trang_thai",
    width: 120,
    Cell: ({ row }) => {
      const active = apiHelper.safeValue(row.original, ["trang_thai"], false);
      return (
        <span className={active ? "text-success-500" : "text-danger-500"}>
          {active ? "Hoạt động" : "Ngưng hoạt động"}
        </span>
      );
    },
  },
  {
    Header: "Thao tác",
    accessor: "actions",
    width: 120,
    Cell: ({ row }) => {
      const rowData = row.original;
      return (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button
            buttonAction
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("editKhachHang", { detail: rowData }),
              )
            }>
            Sửa
          </Button>

          <Button
            buttonAction
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("deleteKhachHang", { detail: rowData }),
              )
            }>
            Xóa
          </Button>
        </div>
      );
    },
  },
];

const KhachHang = () => {
  const khachHang_view = true;

  const columns = useMemo(
    () =>
      khachHang_view
        ? COLUMNS
        : COLUMNS.filter((col) => col.accessor !== "actions"),
    [khachHang_view],
  );

  const [data, setData] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedDeleteItem, setSelectedDeleteItem] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalItems, setTotalItems] = useState(0); // tổng số bản ghi, để phân trang chuẩn

  useEffect(() => {
    const handleEdit = (e) => {
      setSelectedEditItem(e?.detail || null);
      setOpenEditModal(true);
    };

    window.addEventListener("editKhachHang", handleEdit);
    return () => window.removeEventListener("editKhachHang", handleEdit);
  }, []);

  useEffect(() => {
    const handleDelete = (e) => {
      setSelectedDeleteItem(e?.detail || null);
      setOpenDeleteModal(true);
    };

    window.addEventListener("deleteKhachHang", handleDelete);
    return () => window.removeEventListener("deleteKhachHang", handleDelete);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await DanhSachKhachHang(
          {
            id_studio_local: apiHelper.getIdStudioLocal?.(),
            tim_kiem: searchValue ?? "",
            trang: pageIndex + 1,
            so_luong: pageSize,
          },
          controller.signal,
        );

        // API trả về dạng { du_lieu: [...], phan_trang: { trang, so_luong, tong_so, tong_trang } }
        const list = res?.data?.du_lieu ?? [];
        const phanTrang = res?.data?.phan_trang ?? {};

        setData(list);
        setTotalItems(phanTrang.tong_so ?? list.length);
      } catch (err) {
        if (err?.code !== "ERR_CANCELED") {
          setError(err?.response?.data?.message || "Không tải được dữ liệu");
          setData([]);
          setTotalItems(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();

    return () => controller.abort();
  }, [searchValue, reloadKey, pageIndex, pageSize]);
  const emptyText = loading
    ? "Đang tải dữ liệu..."
    : error || "Không có dữ liệu";

  return (
    <>
      <Card>
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3 mb-4">
          <div className="w-full xl:w-[550px] xl:flex-shrink-0">
            <SearchTable
              className="w-full xl:w-[550px]"
              placeholder="Tìm kiếm theo tên, số điện thoại..."
              value={searchValue}
              onSearch={(value) => {
                setPageIndex(0);
                setSearchValue(value);
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            {khachHang_view && (
              <Button
                text="Thêm khách hàng"
                icon="heroicons-outline:plus"
                className="btn-primary bg-primary-600 btn-sm w-full sm:w-auto"
                onClick={() => setOpenAddModal(true)}
              />
            )}
          </div>
        </div>

        <TempTable
          columns={columns}
          data={data}
          initialPageSize={pageSize}
          emptyText={emptyText}
          onPageChange={(page) => setPageIndex(page)}
          onPageSizeChange={(size) => {
            setPageIndex(0);
            setPageSize(size);
          }}
        />

        <AddKhachHangModal
          activeModal={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onCreated={() => setReloadKey((p) => p + 1)}
        />
        <EditKhachHangModal
          activeModal={openEditModal}
          onClose={() => {
            setOpenEditModal(false);
            setSelectedEditItem(null);
          }}
          selectedItem={selectedEditItem}
          onUpdated={() => setReloadKey((p) => p + 1)}
        />
        <DeleteKhachHangModal
          activeModal={openDeleteModal}
          onClose={() => {
            setOpenDeleteModal(false);
            setSelectedDeleteItem(null);
          }}
          selectedItem={selectedDeleteItem}
          onDeleted={() => setReloadKey((p) => p + 1)}
        />
      </Card>
    </>
  );
};

export default KhachHang;
