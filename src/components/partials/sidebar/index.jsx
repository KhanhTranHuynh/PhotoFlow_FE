import React, { useRef, useEffect, useState } from "react";
import SidebarLogo from "./Logo";
import Navmenu from "./Navmenu";
import useMenu from "@/hooks/useMenu"; // 👈 thay cho import menuItems tĩnh
import SimpleBar from "simplebar-react";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import svgRabitImage from "@/assets/images/svg/rabit.svg";
import { useSelector } from "react-redux";
import { getAvatarInitials } from "@/utils/getAvatarInitials";

const Sidebar = () => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const menus = useMenu(); // 👈 danh sách menu đã được filter theo role

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableNodeRef.current.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    scrollableNodeRef.current.addEventListener("scroll", handleScroll);
  }, [scrollableNodeRef]);

  const [collapsed, setMenuCollapsed] = useSidebar();
  const [menuHover, setMenuHover] = useState(false);
  const [isSemiDark] = useSemiDark();
  const [skin] = useSkin();

  // 👇 Lấy thông tin user hiện tại — chỉnh lại path cho đúng với store thật của bạn
  const user = useSelector((state) => state.auth?.user);
  const avatarText = getAvatarInitials(user?.ho_ten);

  return (
    <div className={isSemiDark ? "dark" : ""}>
      <div
        className={`sidebar-wrapper bg-white dark:bg-slate-800 ${
          collapsed ? "w-[72px] close_sidebar" : "w-[248px]"
        } ${menuHover ? "sidebar-hovered" : ""} ${
          skin === "bordered"
            ? "border-r border-slate-200 dark:border-slate-700"
            : "shadow-base"
        }`}
        onMouseEnter={() => setMenuHover(true)}
        onMouseLeave={() => setMenuHover(false)}>
        <SidebarLogo menuHover={menuHover} />
        <div
          className={`h-[60px] absolute top-[80px] nav-shadow z-[1] w-full transition-all duration-200 pointer-events-none ${
            scroll ? "opacity-100" : "opacity-0"
          }`}></div>

        <SimpleBar
          className={`sidebar-menu px-4 ${
            collapsed || !menuHover
              ? "h-[calc(100%-80px)]"
              : "h-[calc(100%-80px-84px)]"
          }`}
          scrollableNodeProps={{ ref: scrollableNodeRef }}>
          <Navmenu menus={menus} />{" "}
          {/* 👈 dùng menus đã filter thay vì menuItems */}
          {/* {!collapsed && (
            <div className="bg-slate-900 mb-16 mt-24 p-4 relative text-center rounded-2xl text-white">
              <img
                src={svgRabitImage}
                alt=""
                className="mx-auto relative -mt-[73px]"
              />
              <div className="max-w-[160px] mx-auto mt-6">
                <div className="widget-title">Unlimited Access </div>
                <div className="text-xs font-light">
                  Upgrade your system to business plan
                </div>
              </div>
              <div className="mt-6">
                <button className="btn bg-white hover:bg-opacity-80 text-slate-900 btn-sm w-full block">
                  Upgrade
                </button>
              </div>
            </div>
          )} */}
        </SimpleBar>

        {/* ✅ Khối thông tin user - cố định ở đáy sidebar */}
        {!collapsed && (
          <div className="sidebar-user-footer absolute bottom-0 left-0 w-full px-2 pb-2 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 rounded-2xl p-1">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center font-bold text-primary-600 dark:text-primary-300 text-sm">
                  {avatarText}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-500 text-white whitespace-nowrap">
                  {user?.ten_vai_tro?.[0]}
                </span>
              </div>
              <div className="min-w-0 pt-1">
                <div className="text-base font-semibold text-slate-800 dark:text-white truncate">
                  {user?.ho_ten}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-300 truncate mt-1">
                  {user?.so_dien_thoai}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
