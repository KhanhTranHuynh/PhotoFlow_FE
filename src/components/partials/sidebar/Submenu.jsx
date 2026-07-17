import React, { useState } from "react";
import { Collapse } from "react-collapse";
import { NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Multilevel from "./Multi";

const Submenu = ({ activeSubmenu, item, i }) => {
  const [activeMultiMenu, setMultiMenu] = useState(null);
  const toggleMultiMenu = (j) => {
    if (activeMultiMenu === j) {
      setMultiMenu(null);
    } else {
      setMultiMenu(j);
    }
  };
  return (
    <Collapse isOpened={activeSubmenu === i}>
      <ul className="sub-menu  space-y-4  ">
        {item.child?.map((subItem, j) => (
          <li key={j} className="block pl-4 pr-1 first:pt-4  last:pb-4">
            {subItem?.multi_menu ? (
              <div>
                <div
                  onClick={() => toggleMultiMenu(j)}
                  className={`${
                    activeMultiMenu
                      ? " text-white font-medium"
                      : "text-slate-600 dark:text-slate-300"
                  } text-sm flex space-x-3 items-center transition-all duration-150 cursor-pointer`}>
                  <span
                    className={`${
                      activeMultiMenu
                        ? " bg-white ring-4 ring-opacity-[15%] ring-white/40"
                        : ""
                    } h-2 w-2 rounded-full border border-slate-400 dark:border-white inline-block flex-none `}></span>
                  <span className="flex-1">{subItem.childtitle}</span>
                  <span className="flex-none">
                    <span
                      className={`menu-arrow transform transition-all duration-300 ${
                        activeMultiMenu === j ? " rotate-90" : ""
                      }`}>
                      <Icon icon="ph:caret-right" />
                    </span>
                  </span>
                </div>
                <Multilevel
                  activeMultiMenu={activeMultiMenu}
                  j={j}
                  subItem={subItem}
                />
              </div>
            ) : (
              <NavLink to={subItem.childlink}>
                {({ isActive }) => (
                  <span
                    className={`${
                      isActive
                        ? " text-white font-medium"
                        : "text-slate-600 dark:text-slate-300"
                    } text-sm flex space-x-3 items-center transition-all duration-150`}>
                    <span
                      className={`${
                        isActive
                          ? " bg-white ring-4 ring-opacity-[15%] ring-white/40"
                          : ""
                      } h-2 w-2 rounded-full border border-slate-400 dark:border-white inline-block flex-none`}></span>
                    <span className="flex-1">{subItem.childtitle}</span>
                  </span>
                )}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </Collapse>
  );
};

export default Submenu;
