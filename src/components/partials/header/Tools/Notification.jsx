import React, { useState, useEffect, useRef } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Link } from "react-router-dom";
import { Menu } from "@headlessui/react";
import { useSelector, useDispatch } from "react-redux";
import { getPersonalDetail, getPersonalPaging } from "@/store/api/notification";
import { useNavigate } from "react-router-dom";
import { formatTime, groupByDate } from "@/helpers/notification";
import { patchItem, setUnreadCount } from "@/store/redux/notificationSlice";
import usePermission from "@/hooks/usePermission";
import NotifAvatar from "@/views/notification/NotifAvatar";

const PAGE_SIZE = 50;

const getNotificationType = (source) =>
  source?.notification_type ??
  source?.notification_subtype ??
  source?.payload?.notification_type ??
  source?.payload?.notification_subtype ??
  null;

const getOrderIdFromNotification = (source) =>
  source?.data?.order_id ??
  source?.payload?.data?.order_id ??
  source?.order_id ??
  source?.orderId ??
  source?.payload?.order_id ??
  source?.payload?.orderId ??
  null;

const notifyLabel = (unreadCount) => (
  <span className="relative lg:h-[32px] lg:w-[32px] text-slate-900 lg:dark:bg-slate-900 dark:text-white cursor-pointer text-[20px] flex flex-col items-center justify-center">
    <Icon icon="heroicons-outline:bell" className="text-primary-500" />
    {unreadCount > 0 && (
      <span className="absolute lg:right-0 lg:top-0 -top-2 -right-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    )}
  </span>
);

const NotifRow = ({ item, onClick }) => {
  const isUnread = item.is_read === 0;

  return (
    <Menu.Item>
      {({ active }) => (
        <div
          onClick={() => onClick(item)}
          className={`
            relative flex items-center gap-3 px-3 py-2 mx-1.5 rounded-xl cursor-pointer transition-colors
            ${
              active
                ? "bg-slate-100 dark:bg-slate-700"
                : isUnread
                  ? "bg-[#e7f0fd]/30 dark:bg-blue-950/20"
                  : ""
            }
          `}>
          <NotifAvatar item={item} />
          <div className="flex-1 min-w-0">
            <p
              className={`text-[13.5px] leading-snug mb-0.5 line-clamp-3 ${
                isUnread
                  ? "text-slate-800 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              dangerouslySetInnerHTML={{
                __html: item.title
                  ? `<strong class="font-semibold text-slate-900 dark:text-white">${item.title}</strong> ${item.message || ""}`
                  : item.message || "",
              }}
            />
            <span
              className={`text-xs font-medium ${
                isUnread
                  ? "text-blue-500"
                  : "text-slate-400 dark:text-slate-500"
              }`}>
              {formatTime(item.createdate)}
            </span>
          </div>
          {isUnread && (
            <div className="flex-shrink-0">
              <span className="block w-3 h-3 bg-blue-500 rounded-full" />
            </div>
          )}
        </div>
      )}
    </Menu.Item>
  );
};

const Notification = () => {
  const thongBaoNhanVien = usePermission("thong_bao_nhan_vien");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("all");
  const [unreadItems, setUnreadItems] = useState([]);
  const [unreadLoading, setUnreadLoading] = useState(false);

  const safeItems = useSelector(
    (state) => state.notification.items?.items ?? [],
  );
  const prevSafeItemsRef = useRef(safeItems);
  const loading = useSelector((state) => state.notification.loading);
  const unreadCount = useSelector((state) => {
    const count = state.notification.items?.unread_count;
    if (typeof count === "number") return count;
    if (Array.isArray(count))
      return count.filter((n) => n.is_read === 0).length;
    return 0;
  });

  const displayItems = activeTab === "unread" ? unreadItems : safeItems;
  const isLoading = activeTab === "unread" ? unreadLoading : loading;
  const groups = groupByDate(displayItems);

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === "unread") {
      setUnreadLoading(true);
      const res = await getPersonalPaging({
        page: 1,
        pagesize: PAGE_SIZE,
        is_read: 0,
      });
      setUnreadItems(res?.data?.items ?? []);
      setUnreadLoading(false);
    }
  };

  const handleRead = async (item) => {
    try {
      // 1. Gọi API xác nhận
      const res = await getPersonalDetail({ id: item.id });
      const detail = res?.data ?? res ?? {};

      // 2. Update store
      if (item.is_read === 0) {
        dispatch(patchItem({ id: item.id, changes: { is_read: 1 } }));

        // 3. Xoá khỏi unreadItems nếu đang ở tab chưa đọc
        if (activeTab === "unread") {
          setUnreadItems((prev) => prev.filter((n) => n.id !== item.id));
        }

        // 4. Lấy count mới từ server
        const countRes = await getPersonalPaging({ page: 1, pagesize: 1 });
        if (countRes?.data?.unread_count !== undefined) {
          dispatch(setUnreadCount(countRes.data.unread_count));
        }
      }

      // 5. Navigate
      const notificationType =
        getNotificationType(detail) ?? getNotificationType(item);
      const orderId =
        getOrderIdFromNotification(detail) ?? getOrderIdFromNotification(item);

      if (notificationType === "ORDER" && orderId) {
        navigate(`/don-hang/chi-tiet-don-hang/${orderId}`);
        return;
      }

      if (notificationType === "DEBT" && thongBaoNhanVien) {
        navigate(`/tai-chinh-thu`);
      }
    } catch (error) {
      console.error("Lỗi đọc thông báo:", error);

      const fallbackType = getNotificationType(item);
      const fallbackOrderId = getOrderIdFromNotification(item);

      if (fallbackType === "ORDER" && fallbackOrderId) {
        navigate(`/don-hang/chi-tiet-don-hang/${fallbackOrderId}`);
      } else if (fallbackType === "DEBT" && thongBaoNhanVien) {
        navigate(`/tai-chinh-thu`);
      }
    }
  };

  // Socket đọc từ thiết bị khác → xoá khỏi unreadItems
  useEffect(() => {
    const handleRemoteRead = (e) => {
      const { id } = e.detail;
      if (!id) return;
      setUnreadItems((prev) => prev.filter((n) => n.id !== id));
    };

    window.addEventListener("notification:read", handleRemoteRead);
    return () =>
      window.removeEventListener("notification:read", handleRemoteRead);
  }, []);

  useEffect(() => {
    const prev = prevSafeItemsRef.current;

    if (activeTab === "unread") {
      const newItems = safeItems.filter(
        (item) => item.is_read === 0 && !prev.some((p) => p.id === item.id),
      );

      if (newItems.length > 0) {
        setUnreadItems((current) => {
          const existingIds = new Set(current.map((n) => n.id));
          const toAdd = newItems.filter((n) => !existingIds.has(n.id));
          return toAdd.length > 0 ? [...toAdd, ...current] : current;
        });
      }
    }

    // ✅ Gán ref CUỐI cùng, sau khi đã dùng xong
    prevSafeItemsRef.current = safeItems;
  }, [safeItems, activeTab]);

  return (
    <Dropdown
      align="none"
      classMenuItems="xl:w-[400px] md:w-[380px] w-[320px] !fixed top-20 right-4 !p-0 overflow-hidden"
      label={notifyLabel(unreadCount)}>
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[22px] font-semibold text-slate-900 dark:text-white mb-3">
          Thông báo
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => handleTabChange("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}>
            Tất cả
          </button>
          <button
            onClick={() => handleTabChange("unread")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "unread"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}>
            Chưa đọc
            {unreadCount > 0 && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  activeTab === "unread"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                }`}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── List ── */}
      <div className="max-h-[540px] overflow-y-auto pb-2">
        {isLoading && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Đang tải...
          </div>
        )}

        {!isLoading && displayItems.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            {activeTab === "unread"
              ? "Không có thông báo chưa đọc"
              : "Không có thông báo nào"}
          </div>
        )}

        {!isLoading &&
          groups.map((group) => (
            <div key={group.key}>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                  {group.label}
                </span>
                {group.key === groups[0]?.key && (
                  <Menu.Item>
                    {({ close }) => (
                      <Link
                        to="/thong-bao"
                        className="text-sm text-blue-500 hover:text-blue-600 font-normal"
                        onClick={() => close()}>
                        Xem tất cả
                      </Link>
                    )}
                  </Menu.Item>
                )}
              </div>
              {group.items.map((item) => (
                <NotifRow key={item.id} item={item} onClick={handleRead} />
              ))}
            </div>
          ))}
      </div>

      {/* ── Footer ── */}
      {safeItems.length > 0 && (
        <Menu.Item>
          {({ close }) => (
            <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 text-center">
              <Link
                to="/thong-bao"
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                onClick={() => close()}>
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </Menu.Item>
      )}
    </Dropdown>
  );
};

export default Notification;
