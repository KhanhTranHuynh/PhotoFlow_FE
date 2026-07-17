import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import useMenu from "@/hooks/useMenu";

const normalizePath = (raw) => {
  if (!raw) return "/";
  const value = String(raw).trim();
  if (!value) return "/";
  const pathOnly = value.split("?")[0].split("#")[0];
  if (pathOnly.length > 1 && pathOnly.endsWith("/"))
    return pathOnly.slice(0, -1);
  return pathOnly;
};

const pathStartsWithSegment = (pathnameRaw, prefixRaw) => {
  const pathname = normalizePath(pathnameRaw);
  const prefix = normalizePath(prefixRaw);
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(prefix + "/");
};

const isTopMenuActive = (item, pathname) => {
  // Default behavior: make the menu active for its whole section.
  // This fixes cases like:
  // - menu link: /don-hang/danh-sach
  // - current:   /don-hang/chi-tiet-don-hang/:id
  switch (item?.key) {
    case "donHang":
      return pathStartsWithSegment(pathname, "/don-hang");
    case "congNo":
      return pathStartsWithSegment(pathname, "/cong-no");
    case "donHang_khachHang":
      return (
        pathStartsWithSegment(pathname, "/don-hang/danh-sach") ||
        pathStartsWithSegment(pathname, "/don-hang/tao-don-hang") ||
        pathStartsWithSegment(pathname, "/don-hang/sua-don-hang") ||
        pathStartsWithSegment(pathname, "/don-hang/chi-tiet-don-hang")
      );
    case "congNo_khachHang":
      return pathStartsWithSegment(pathname, "/khach-hang/cong-no");
    case "taiChinh":
      return (
        pathStartsWithSegment(pathname, "/tai-chinh-thu") ||
        pathStartsWithSegment(pathname, "/tai-chinh-chi")
      );
    default:
      return item?.link ? pathStartsWithSegment(pathname, item.link) : false;
  }
};

const HorizentalMenu = () => {
  const menus = useMenu();
  const location = useLocation();
  const pathname = location?.pathname || "/";

  return (
    <div className="main-menu">
      <ul>
        {menus?.map((item, i) => (
          <li
            key={i}
            className={
              item.child
                ? "menu-item-has-children"
                : item.megamenu
                  ? "menu-item-has-children has-megamenu"
                  : ""
            }>
            {/* Single menu */}
            {!item.child && !item.megamenu && (
              <NavLink to={item.link}>
                {() => (
                  <div
                    className={`text-box px-0.5 py-0.5 rounded-md transition-all duration-200 text-white ${
                      isTopMenuActive(item, pathname)
                        ? "bg-blue-800 font-semibold"
                        : "hover:opacity-80"
                    }`}>
                    {item.title}
                  </div>
                )}
              </NavLink>
            )}

            {/* Dropdown / Megamenu title */}
            {(item.child || item.megamenu) && (
              <NavLink
                to={
                  item.child
                    ? item.child[0]?.link
                    : item.megamenu?.[0]?.singleMegamenu?.[0]?.m_childlink
                }
                end={false}
                onClick={(e) => e.preventDefault()}>
                {() => (
                  // ✅ bỏ isActive, dùng isTopMenuActive thay thế
                  <div
                    className={`text-box px-0.5 py-0.5 rounded-md transition-all duration-200 text-white ${
                      isTopMenuActive(item, pathname)
                        ? "bg-blue-800 font-semibold"
                        : "hover:opacity-80"
                    }`}>
                    {item.title}
                  </div>
                )}
              </NavLink>
            )}

            {/* Dropdown menu */}
            {item.child && (
              <ul className="sub-menu">
                {item.child.map((childitem, index) => (
                  <li key={index}>
                    <NavLink to={childitem.link}>
                      {({ isActive }) => (
                        <div
                          className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-blue-700 text-white font-semibold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300"
                          }`}>
                          <span className="leading-[1]">
                            {childitem.childtitle}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}

            {/* Megamenu */}
            {item.megamenu && (
              <div className="rt-mega-menu">
                <div className="flex flex-col">
                  {" "}
                  {/* ✅ đổi từ flex-wrap + space-x sang flex-col */}
                  {item.megamenu.map((m_item, m_i) => (
                    <div key={m_i} className="w-full">
                      {m_item.megamenutitle && (
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                          <span>{m_item.megamenutitle}</span>
                        </div>
                      )}

                      {m_item.singleMegamenu.map((ms_item, ms_i) => (
                        <NavLink to={ms_item.m_childlink} key={ms_i}>
                          {({ isActive }) => (
                            <div
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[13px] leading-5 mb-0.5 whitespace-nowrap transition-all duration-150 ${
                                isActive
                                  ? "bg-blue-700 text-white font-medium"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300"
                              }`}>
                              <span
                                className={`h-[5px] w-[5px] rounded-full flex-none border ${
                                  isActive
                                    ? "bg-white border-white"
                                    : "border-slate-400 dark:border-slate-500"
                                }`}
                              />
                              <span className="capitalize">
                                {ms_item.m_childtitle}
                              </span>
                            </div>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HorizentalMenu;
