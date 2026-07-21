import React, { useEffect, useMemo, useState } from "react";
import { callApis } from "@/api/callApi";
import { NhanVienApi } from "@/api/descriptors/nhanVien";
import { VaiTroApi } from "@/api/descriptors/vaiTro";
import SearchTable from "@/views/component/SearchTable";
import FilterTable from "@/views/component/FilterTable";
import TempTable from "@/views/component/TempTable";
import Card from "@/views/component/Card";
import Button from "@/components/ui/Button";
import apiHelper from "@/helpers/apiHelper";
import AddNhanVienModal from "../../../views/nhan-vien/add";
import EditNhanVienModal from "../../../views/nhan-vien/edit";
import DeleteNhanVienModal from "../../../views/nhan-vien/delete";

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
                new CustomEvent("editNhanVien", { detail: rowData }),
              )
            }>
            Sửa
          </Button>

          <Button
            buttonAction
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("deleteNhanVien", { detail: rowData }),
              )
            }>
            Xóa
          </Button>
        </div>
      );
    },
  },
];

// Danh sách filter hiển thị phía trên bảng.
// options của "vai_tro_id" được nạp động sau khi fetch xong DanhSachVaiTro.
const STATIC_FILTERS = [
  {
    key: "dang_hoat_dong",
    label: "Trạng thái",
    type: "select",
    clearable: true,
    items: [
      { title: "Hoạt động", value: true },
      { title: "Ngưng hoạt động", value: false },
    ],
  },
];

const NhanVien = () => {
  const NhanVien_view = true;

  const columns = useMemo(
    () =>
      NhanVien_view
        ? COLUMNS
        : COLUMNS.filter((col) => col.accessor !== "actions"),
    [NhanVien_view],
  );

  const [data, setData] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Giá trị filter hiện tại: { vai_tro_id, dang_hoat_dong }
  const [filterValues, setFilterValues] = useState({});
  // Danh sách vai trò dùng làm options cho filter "vai_tro_id"
  const [vaiTroOptions, setVaiTroOptions] = useState([]);
  const [vaiTroLoading, setVaiTroLoading] = useState(false);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedDeleteItem, setSelectedDeleteItem] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalItems, setTotalItems] = useState(0); // tổng số bản ghi, để phân trang chuẩn

  // Ghép filter tĩnh (trạng thái) + filter động (vai trò, options nạp từ API)
  const filters = useMemo(
    () => [
      {
        key: "vai_tro_id",
        label: "Vai trò",
        type: "select",
        clearable: true,
        items: vaiTroOptions,
        itemTitle: "ten",
        itemValue: "id",
      },
      ...STATIC_FILTERS,
    ],
    [vaiTroOptions],
  );

  useEffect(() => {
    const handleEdit = (e) => {
      setSelectedEditItem(e?.detail || null);
      setOpenEditModal(true);
    };

    window.addEventListener("editNhanVien", handleEdit);
    return () => window.removeEventListener("editNhanVien", handleEdit);
  }, []);

  useEffect(() => {
    const handleDelete = (e) => {
      setSelectedDeleteItem(e?.detail || null);
      setOpenDeleteModal(true);
    };

    window.addEventListener("deleteNhanVien", handleDelete);
    return () => window.removeEventListener("deleteNhanVien", handleDelete);
  }, []);

  // Chạy song song 2 API: NhanVienApi.danhSach (bảng chính) +
  // VaiTroApi.danhSach (options filter), thông qua callApis — đi CHUNG
  // 1 batch của ApiRequestManager (parallel:true), không còn tự tạo 2
  // promise rồi tự Promise.allSettled ở component nữa. Muốn đổi 2 API
  // này sang chạy tuần tự thì chỉ cần đổi { parallel: false } bên dưới.
  useEffect(() => {
    const controller = new AbortController();

    const fetchAll = async () => {
      setLoading(true);
      setError("");
      setVaiTroLoading(true);

      const [nhanVienRes, vaiTroRes] = await callApis(
        [
          NhanVienApi.danhSach(
            {
              id_studio_local: apiHelper.getIdStudioLocal?.(),
              tim_kiem: searchValue ?? "",
              trang: pageIndex + 1,
              so_luong: pageSize,
              vai_tro_id: filterValues.vai_tro_id ?? undefined,
              dang_hoat_dong: filterValues.dang_hoat_dong ?? undefined,
            },
            controller.signal,
          ),
          VaiTroApi.danhSach(
            { trang: 1, so_luong: 100, dang_hoat_dong: true },
            controller.signal,
          ),
        ],
        { parallel: true, showOverlay: true },
      );

      // --- Xử lý kết quả danh sách nhân viên ---
      if (nhanVienRes.__networkError && controller.signal.aborted) {
        // effect bị huỷ (đổi filter/unmount) -> bỏ qua, không set lỗi
      } else if (nhanVienRes.code < 0) {
        setError(nhanVienRes.message || "Không tải được dữ liệu");
        setData([]);
        setTotalItems(0);
      } else {
        // API trả về dạng { du_lieu: [...], phan_trang: {...} }
        const list = nhanVienRes?.data?.du_lieu ?? [];
        const phanTrang = nhanVienRes?.data?.phan_trang ?? {};
        setData(list);
        setTotalItems(phanTrang.tong_so ?? list.length);
      }

      // --- Xử lý kết quả danh sách vai trò (options cho filter) ---
      if (vaiTroRes.__networkError && controller.signal.aborted) {
        // bỏ qua khi bị huỷ
      } else if (vaiTroRes.code < 0) {
        setVaiTroOptions([]);
      } else {
        const list = vaiTroRes?.data?.du_lieu ?? [];
        setVaiTroOptions(Array.isArray(list) ? list : []);
      }

      setLoading(false);
      setVaiTroLoading(false);
    };

    fetchAll();

    return () => controller.abort();
  }, [searchValue, reloadKey, pageIndex, pageSize, filterValues]);

  const emptyText = loading
    ? "Đang tải dữ liệu..."
    : error || "Không có dữ liệu";

  return (
    <>
      <h5 className="mb-6">Nhân viên</h5>

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
            {NhanVien_view && (
              <Button
                text="Thêm khách hàng"
                icon="heroicons-outline:plus"
                className="btn-primary bg-primary-600 btn-sm w-full sm:w-auto"
                onClick={() => setOpenAddModal(true)}
              />
            )}
          </div>
        </div>

        {/* FILTER */}
        <div className="mb-4">
          <FilterTable
            filters={filters}
            modelValue={filterValues}
            onUpdateModelValue={(next) => {
              setPageIndex(0);
              setFilterValues(next);
            }}
            onClearFilters={() => {
              setPageIndex(0);
              setFilterValues({});
            }}
          />
        </div>

        <TempTable
          columns={columns}
          data={data}
          initialPageSize={pageSize}
          emptyText={
            vaiTroLoading && loading ? "Đang tải dữ liệu..." : emptyText
          }
          onPageChange={(page) => setPageIndex(page)}
          onPageSizeChange={(size) => {
            setPageIndex(0);
            setPageSize(size);
          }}
        />

        <AddNhanVienModal
          activeModal={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onCreated={() => setReloadKey((p) => p + 1)}
        />
        <EditNhanVienModal
          activeModal={openEditModal}
          onClose={() => {
            setOpenEditModal(false);
            setSelectedEditItem(null);
          }}
          selectedItem={selectedEditItem}
          onUpdated={() => setReloadKey((p) => p + 1)}
        />
        <DeleteNhanVienModal
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

export default NhanVien;
