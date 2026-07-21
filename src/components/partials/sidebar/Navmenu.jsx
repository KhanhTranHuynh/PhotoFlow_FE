import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Collapse } from "react-collapse";
import Icon from "@/components/ui/Icon";
import { useDispatch } from "react-redux";
import useMobileMenu from "@/hooks/useMobileMenu";
import Submenu from "./Submenu";
import { getPageTitle } from "@/utils/getPageTitle";
import { toggleMobileChatSidebar } from "@/store/redux/chatSlice";

const Navmenu = ({ menus }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const toggleSubmenu = (i) => {
    setActiveSubmenu(activeSubmenu === i ? null : i);
  };

  const location = useLocation();
  const locationName = location.pathname;

  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const dispatch = useDispatch();

  useEffect(() => {
    let submenuIndex = null;
    menus.map((item, i) => {
      if (!item.child) return;
      if (item.link === locationName) {
        submenuIndex = null;
      } else {
        const ciIndex = item.child.findIndex(
          (ci) => ci.childlink === locationName,
        );
        if (ciIndex !== -1) {
          submenuIndex = i;
        }
      }
    });

    document.title = `HT | ${getPageTitle(location.pathname)}`;
    setActiveSubmenu(submenuIndex);
    dispatch(toggleMobileChatSidebar(false));
    if (mobileMenu) {
      setMobileMenu(false);
    }
  }, [location]);

  // ✅ Lấy tất cả child links từ megamenu để kiểm tra active
  const getMegamenuLinks = (item) => {
    if (!item.megamenu) return [];
    return item.megamenu.flatMap((group) =>
      (group.singleMegamenu || []).map((m) => m.m_childlink),
    );
  };

  return (
    <>
      <ul>
        {menus.map((item, i) => {
          const megamenuLinks = getMegamenuLinks(item);
          const isMegamenuActive = megamenuLinks.includes(locationName);

          return (
            <li
              key={item.key ?? i}
              className={`single-sidebar-menu 
                ${item.child || item.megamenu ? "item-has-children" : ""}
                ${activeSubmenu === i ? "open" : ""}
                ${
                  locationName === item.link || isMegamenuActive
                    ? "menu-item-active"
                    : ""
                }`}>
              {/* Item thông thường - không có child, không có megamenu */}
              {!item.child && !item.megamenu && !item.isHeadr && (
                <NavLink className="menu-link" to={item.link}>
                  <span className="menu-icon flex-grow-0">
                    <Icon icon={item.icon} />
                  </span>
                  <div className="text-box flex-grow">{item.title}</div>
                  {item.badge && (
                    <span className="menu-badge">{item.badge}</span>
                  )}
                </NavLink>
              )}

              {item.isHeadr && !item.child && (
                <div className="menulabel">{item.title}</div>
              )}

              {/* Item có child (submenu cũ) */}
              {item.child && (
                <div
                  className={`menu-link ${
                    activeSubmenu === i
                      ? "parent_active not-collapsed"
                      : "collapsed"
                  }`}
                  onClick={() => toggleSubmenu(i)}>
                  <div className="flex-1 flex items-start">
                    <span className="menu-icon">
                      <Icon icon={item.icon} />
                    </span>
                    <div className="text-box">{item.title}</div>
                  </div>
                  <div className="flex-0">
                    <div
                      className={`menu-arrow transform transition-all duration-300 ${
                        activeSubmenu === i
                          ? "rotate-90 text-white"
                          : "text-white"
                      }`}>
                      <Icon
                        icon="heroicons-outline:chevron-right"
                        className={
                          activeSubmenu === i
                            ? "text-white !text-white"
                            : "text-slate-500"
                        }
                        style={{
                          color: activeSubmenu === i ? "#fff" : "#64748b",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ Item có megamenu → toggle thay vì navigate */}
              {item.megamenu && (
                <div
                  className={`menu-link ${
                    activeSubmenu === i || isMegamenuActive
                      ? "parent_active not-collapsed"
                      : "collapsed"
                  }`}
                  onClick={() => toggleSubmenu(i)}>
                  <div className="flex-1 flex items-start">
                    <span className="menu-icon">
                      <Icon icon={item.icon} />
                    </span>
                    <div className="text-box">{item.title}</div>
                  </div>
                  <div className="flex-0">
                    <div
                      className={`menu-arrow transform transition-all duration-300 ${
                        activeSubmenu === i
                          ? "rotate-90 text-white"
                          : "text-white"
                      }`}>
                      <Icon
                        icon="heroicons-outline:chevron-right"
                        className={
                          activeSubmenu === i
                            ? "text-white !text-white"
                            : "text-slate-500"
                        }
                        style={{
                          color: activeSubmenu === i ? "#fff" : "#64748b",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Submenu activeSubmenu={activeSubmenu} item={item} i={i} />

              {/* ✅ Render megamenu dạng collapse giống submenu */}
              {item.megamenu && (
                <Collapse isOpened={activeSubmenu === i}>
                  <ul className="sub-menu">
                    {item.megamenu.flatMap((group, gIndex) =>
                      (group.singleMegamenu || []).map((child, j) => (
                        <li key={child.m_childlink ?? `${gIndex}-${j}`}>
                          <NavLink
                            to={child.m_childlink}
                            className={({ isActive }) =>
                              `block text-sm py-2 px-4 ${
                                isActive ? "text-primary-500 font-semibold" : ""
                              }`
                            }>
                            {child.m_childtitle}
                          </NavLink>
                        </li>
                      )),
                    )}
                  </ul>
                </Collapse>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default Navmenu;
