import React, { useEffect, useMemo, useRef } from "react";
import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
  useRowSelect,
} from "react-table";
import Icon from "@/components/ui/Icon";

const resolveClassName = (classNameProp, args) => {
  if (typeof classNameProp === "function") {
    return classNameProp(args);
  }

  return classNameProp || "";
};

const getPaginationItems = ({ totalPages, currentPage, siblingCount = 1 }) => {
  const totalPageNumbers = siblingCount + 5;

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => i + 1,
    );
    return [...leftRange, "...", totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => totalPages - (3 + siblingCount * 2) + i + 1,
    );
    return [firstPageIndex, "...", ...rightRange];
  }

  if (showLeftDots && showRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    );
    return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
  }

  return [];
};

const TempTable = ({
  columns = [],
  data = [],
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  showPagination = true,
  enableSorting = false,
  // 'client' | 'server' | undefined (auto-detect)
  paginationMode,
  page,
  pageSize,
  totalRecords,
  pageCount,
  onPageChange,
  onPageSizeChange,
  // ── BE sort ──
  sortModel = [], // [{ column: string, type: "ASC" | "DESC" }]
  onSortChange, // (newSortModel: typeof sortModel) => void
  // ─────────────
  wrapperClassName = "",
  headerClassName = "table-th",
  cellClassName = "table-td",
  rowClassName = "",
  emptyText = "Không có dữ liệu",
  onRowClick,
}) => {
  const memoColumns = useMemo(() => columns, [columns]);
  const memoData = useMemo(() => data, [data]);

  // ── Auto-detect server pagination ──
  // Trước đây bắt buộc phải truyền paginationMode="server" thì mới hoạt
  // động đúng. Nếu component cha quên truyền (chỉ truyền totalRecords /
  // pageCount / onPageChange) thì bảng sẽ tự tính phân trang dựa trên
  // đúng mảng `data` nhận được (thường chỉ là 1 trang do BE trả về),
  // khiến các nút chuyển trang biến mất dù còn nhiều trang khác.
  // Vì vậy nếu không truyền paginationMode một cách tường minh, ta suy
  // luận đây là server pagination khi có totalRecords hoặc pageCount.
  const isServerPagination =
    paginationMode === "server" ||
    (paginationMode !== "client" &&
      (typeof totalRecords === "number" || typeof pageCount === "number"));

  const isServerSort = enableSorting && typeof onSortChange === "function";

  const resolvedPageSize =
    typeof pageSize === "number" && pageSize > 0 ? pageSize : initialPageSize;

  const resolvedPageCount = isServerPagination
    ? Math.max(
        1,
        Number(pageCount) ||
          Math.ceil((Number(totalRecords) || 0) / (resolvedPageSize || 1)) ||
          1,
      )
    : undefined;

  const tableInstance = useTable(
    {
      columns: memoColumns,
      data: memoData,
      initialState: {
        pageSize: resolvedPageSize,
      },
      // Tắt sort nội bộ của react-table khi dùng server sort
      ...(isServerSort && {
        manualSortBy: true,
        disableSortBy: false,
        autoResetSortBy: false,
      }),
      ...(isServerPagination && {
        manualPagination: true,
        pageCount: resolvedPageCount,
        autoResetPage: false,
      }),
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page: pageRows,
    rows,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    gotoPage,
    setPageSize,
    prepareRow,
    state,
  } = tableInstance;

  const { pageIndex, pageSize: tablePageSize } = state;

  const tableRows = showPagination ? pageRows : rows;

  // ── Server pagination ──
  const currentPage = isServerPagination
    ? typeof page === "number" && page > 0
      ? page
      : pageIndex + 1
    : null;

  const canPrev = isServerPagination ? currentPage > 1 : canPreviousPage;

  const canNext = isServerPagination
    ? currentPage < (resolvedPageCount || 1)
    : canNextPage;

  const displayPageOptions = isServerPagination
    ? Array.from({ length: resolvedPageCount || 1 }, (_, i) => i)
    : pageOptions;

  const displayPageIndex = isServerPagination ? currentPage - 1 : pageIndex;

  const effectivePageSize = isServerPagination
    ? resolvedPageSize
    : tablePageSize;

  const totalCount = isServerPagination
    ? Number(totalRecords) || 0
    : rows.length;

  const startIdx =
    totalCount === 0 ? 0 : displayPageIndex * effectivePageSize + 1;
  const endIdx = Math.min(
    (displayPageIndex + 1) * effectivePageSize,
    totalCount,
  );

  // ── Reset page khi data đổi (client mode) ──
  const prevDataRef = useRef(memoData);

  useEffect(() => {
    if (isServerPagination) return;
    if (prevDataRef.current !== memoData) {
      gotoPage(0);
      prevDataRef.current = memoData;
    }
  }, [memoData, gotoPage, isServerPagination]);

  // ── Sync page từ prop xuống table ──
  useEffect(() => {
    if (!isServerPagination) return;
    if (typeof page !== "number" || page <= 0) return;
    const targetIndex = page - 1;
    if (pageIndex === targetIndex) return;
    gotoPage(targetIndex);
  }, [gotoPage, isServerPagination, page, pageIndex]);

  // ── Sync pageSize từ prop xuống table ──
  useEffect(() => {
    if (!isServerPagination) return;
    if (typeof pageSize !== "number" || pageSize <= 0) return;
    if (tablePageSize === pageSize) return;
    setPageSize(pageSize);
  }, [isServerPagination, pageSize, setPageSize, tablePageSize]);

  // ── Pagination handlers ──
  const handleGotoPage = (pageIdx) => {
    if (isServerPagination) {
      onPageChange?.(pageIdx + 1);
    } else {
      gotoPage(pageIdx);
    }
  };

  const handlePreviousPage = () => {
    if (isServerPagination) {
      if (!canPrev) return;
      onPageChange?.(currentPage - 1);
    } else {
      previousPage();
    }
  };

  const handleNextPage = () => {
    if (isServerPagination) {
      if (!canNext) return;
      onPageChange?.(currentPage + 1);
    } else {
      nextPage();
    }
  };

  const handleFirstPage = () => handleGotoPage(0);
  const handleLastPage = () =>
    handleGotoPage((displayPageOptions.length || 1) - 1);

  const handlePageSizeChange = (e) => {
    const size = Number(e.target.value);
    if (isServerPagination) {
      onPageSizeChange?.(size);
    } else {
      setPageSize(size);
    }
  };

  const getServerKey = (column) => column.serverSortKey || column.id;

  /** Trạng thái sort hiện tại của 1 column: "ASC" | "DESC" | null */
  const getSortState = (column) => {
    const key = getServerKey(column);
    const found = sortModel.find((s) => s.column === key);
    return found ? found.type : null;
  };

  const handleHeaderClick = (column) => {
    if (!isServerSort) return;
    if (column.disableSortBy) return;

    const key = getServerKey(column);

    const current = sortModel.find((s) => s.column === key);

    // luôn remove key cũ trước
    const others = sortModel.filter((s) => s.column !== key);

    let newSort;

    if (!current) {
      // chưa có -> thêm lên đầu
      newSort = [{ column: key, type: "ASC" }, ...others];
    } else if (current.type === "ASC") {
      // ASC -> DESC và đưa lên đầu
      newSort = [{ column: key, type: "DESC" }, ...others];
    } else {
      // DESC -> remove khỏi sort
      newSort = others;
    }

    onSortChange(newSort);
  };

  const paginationItems = getPaginationItems({
    totalPages: displayPageOptions.length,
    currentPage: displayPageIndex + 1,
  });

  return (
    <div className={wrapperClassName}>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table
              className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
              {...getTableProps()}>
              <thead className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                {headerGroups.map((headerGroup) => {
                  const { key: headerGroupKey, ...headerGroupProps } =
                    headerGroup.getHeaderGroupProps();

                  return (
                    <tr key={headerGroupKey} {...headerGroupProps}>
                      {headerGroup.headers.map((column) => {
                        // Với server sort, KHÔNG dùng getSortByToggleProps
                        // để tránh react-table tự sort data nội bộ.
                        const { key: headerKey, ...restHeaderProps } =
                          column.getHeaderProps();

                        const isSortable =
                          enableSorting && !column.disableSortBy;
                        const sortState = isSortable
                          ? getSortState(column)
                          : null;

                        return (
                          <th
                            key={headerKey}
                            {...restHeaderProps}
                            scope="col"
                            style={{
                              width: column.width
                                ? `${column.width}px`
                                : undefined,
                              minWidth: column.minWidth
                                ? `${column.minWidth}px`
                                : undefined,
                              cursor: isSortable ? "pointer" : "default",
                              userSelect: isSortable ? "none" : undefined,
                            }}
                            className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400 ${resolveClassName(
                              headerClassName,
                              { column },
                            )}`}
                            onClick={
                              isSortable
                                ? () => handleHeaderClick(column)
                                : undefined
                            }>
                            <div
                              className={`inline-flex items-center gap-1.5 ${
                                column.align === "center"
                                  ? "justify-center w-full"
                                  : column.align === "right"
                                    ? "justify-end w-full"
                                    : ""
                              }`}>
                              <span>{column.render("Header")}</span>

                              {isSortable && (
                                <span
                                  className={`
                                    transition-all duration-200 flex items-center
                                    ${sortState ? "text-amber-700" : "text-slate-400"}
                                  `}>
                                  <Icon
                                    icon={
                                      sortState === "ASC"
                                        ? "heroicons-outline:chevron-up"
                                        : sortState === "DESC"
                                          ? "heroicons-outline:chevron-down"
                                          : "heroicons-outline:chevron-down"
                                    }
                                    className="w-3.5 h-3.5"
                                  />
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>

              <tbody
                className="bg-white divide-y divide-slate-50 dark:bg-slate-800 dark:divide-slate-700"
                {...getTableBodyProps()}>
                {tableRows.length === 0 ? (
                  <tr>
                    <td
                      className="table-td text-center"
                      colSpan={memoColumns.length || 1}>
                      {emptyText}
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row) => {
                    prepareRow(row);

                    const { key: rowKey, ...rowProps } = row.getRowProps();

                    return (
                      <tr
                        key={rowKey}
                        {...rowProps}
                        className={`${resolveClassName(rowClassName, {
                          row,
                        })} ${onRowClick ? "cursor-pointer" : ""}`}
                        onClick={() => onRowClick?.(row.original, row)}>
                        {row.cells.map((cell) => {
                          const { key: cellKey, ...cellProps } =
                            cell.getCellProps();

                          return (
                            <td
                              key={cellKey}
                              {...cellProps}
                              style={{
                                width: cell.column.width
                                  ? `${cell.column.width}px`
                                  : undefined,
                                minWidth: cell.column.minWidth
                                  ? `${cell.column.minWidth}px`
                                  : undefined,
                              }}
                              className={`py-3.5 px-4 text-sm text-slate-800 dark:text-slate-200 ${resolveClassName(
                                cellClassName,
                                { cell, row },
                              )}`}>
                              {cell.render("Cell")}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPagination ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4">
          {/* Left: page size + showing text */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={effectivePageSize}
                onChange={handlePageSizeChange}
                className="appearance-none rounded-full border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 pl-4 pr-8 py-1.5 text-sm text-slate-600 outline-none cursor-pointer">
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <Icon
                icon="heroicons-outline:chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              />
            </div>

            <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Showing {startIdx} - {endIdx} of {totalCount}
            </span>
          </div>

          {/* Right: pagination controls */}
          <ul className="flex items-center gap-1.5">
            <li>
              <button
                type="button"
                onClick={handleFirstPage}
                disabled={!canPrev}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
                  !canPrev
                    ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                    : "text-slate-500 border-slate-200 bg-white hover:bg-slate-100 hover:scale-110 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                }`}>
                <Icon
                  icon="heroicons-outline:chevron-double-left"
                  className="text-sm"
                />
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={!canPrev}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
                  !canPrev
                    ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                    : "text-slate-500 border-slate-200 bg-white hover:bg-slate-100 hover:scale-110 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                }`}>
                <Icon
                  icon="heroicons-outline:chevron-left"
                  className="text-sm"
                />
              </button>
            </li>

            {paginationItems.map((item, idx) => {
              if (item === "...") {
                return (
                  <li key={`dots-${idx}`}>
                    <span className="w-8 h-8 flex items-center justify-center text-sm text-slate-400">
                      ...
                    </span>
                  </li>
                );
              }

              const pageIdx = item - 1;

              return (
                <li key={item}>
                  <button
                    type="button"
                    aria-current="page"
                    onClick={() => handleGotoPage(pageIdx)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 active:scale-90 ${
                      pageIdx === displayPageIndex
                        ? "bg-primary-600 text-white shadow-sm hover:brightness-110 hover:scale-105"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:scale-110 dark:hover:bg-slate-700"
                    }`}>
                    {item}
                  </button>
                </li>
              );
            })}

            <li>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={!canNext}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
                  !canNext
                    ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                    : "text-primary-600 border-primary-200 bg-primary-50/50 hover:bg-primary-50 hover:scale-110 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                }`}>
                <Icon
                  icon="heroicons-outline:chevron-right"
                  className="text-sm"
                />
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={handleLastPage}
                disabled={!canNext}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
                  !canNext
                    ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                    : "text-primary-600 border-primary-200 bg-primary-50/50 hover:bg-primary-50 hover:scale-110 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                }`}>
                <Icon
                  icon="heroicons-outline:chevron-double-right"
                  className="text-sm"
                />
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default TempTable;
