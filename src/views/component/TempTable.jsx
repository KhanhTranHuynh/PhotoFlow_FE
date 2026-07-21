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
  initialPageSize = 6,
  showPagination = true,
  enableSorting = false,
  paginationMode = "client", // 'client' | 'server'
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

  const isServerPagination = paginationMode === "server";
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
              <thead className="bg-slate-200 dark:bg-slate-700">
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
                            className={resolveClassName(headerClassName, {
                              column,
                            })}
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
                                    ${sortState ? "text-primary-500" : "text-slate-400"}
                                  `}>
                                  <Icon
                                    icon={
                                      sortState === "ASC"
                                        ? "heroicons-outline:chevron-up"
                                        : sortState === "DESC"
                                          ? "heroicons-outline:chevron-down"
                                          : "heroicons-outline:selector"
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
                className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
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
                              className={resolveClassName(cellClassName, {
                                cell,
                                row,
                              })}>
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
        <div className="md:flex md:space-y-0 space-y-5 justify-center mt-6 items-center">
          <ul className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* Prev */}
            <li className="text-xl leading-4 rtl:rotate-180">
              <button
                className={`${
                  !canPrev
                    ? "opacity-50 cursor-not-allowed text-slate-400"
                    : "text-primary-600 dark:text-primary-300"
                }`}
                onClick={handlePreviousPage}
                disabled={!canPrev}>
                <Icon icon="heroicons-outline:chevron-left" />
              </button>
            </li>

            {/* Pages */}
            {paginationItems.map((item, idx) => {
              if (item === "...") {
                return (
                  <li key={`dots-${idx}`}>
                    <span className="flex h-6 min-w-6 px-2 items-center justify-center text-slate-500">
                      ...
                    </span>
                  </li>
                );
              }

              const pageIdx = item - 1;

              return (
                <li key={item}>
                  <button
                    aria-current="page"
                    className={`
                      ${
                        pageIdx === displayPageIndex
                          ? "bg-primary-600 dark:bg-primary-500 text-white font-medium"
                          : "bg-slate-100 dark:bg-slate-700 dark:text-slate-400 text-slate-900 font-normal"
                      }
                      text-sm rounded leading-[16px] flex h-6 min-w-6 px-2 items-center justify-center transition-all duration-150
                    `}
                    onClick={() => handleGotoPage(pageIdx)}>
                    {item}
                  </button>
                </li>
              );
            })}

            {/* Next */}
            <li className="text-xl leading-4 rtl:rotate-180">
              <button
                className={`${
                  !canNext
                    ? "opacity-50 cursor-not-allowed text-slate-400"
                    : "text-primary-600 dark:text-primary-300"
                }`}
                onClick={handleNextPage}
                disabled={!canNext}>
                <Icon icon="heroicons-outline:chevron-right" />
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default TempTable;
