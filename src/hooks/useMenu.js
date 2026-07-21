import { useSelector } from "react-redux";

import { topMenu } from "@/configs/top-menu";
import { menuRoles } from "@/configs/menu-role";
import { getUserRoleCodes } from "@/utils/getUserRoleCodes"; // 👈 dùng lại hàm chuẩn hóa role

export default function useMenu() {
  const user = useSelector((state) => state.auth.user);
  const roleCodes = getUserRoleCodes(user); // 👈 thay vì user.roles.map(item => item.code)

  const menus = topMenu
    .filter((menu) => {
      const allowRoles = menuRoles[menu.key] || [];
      return allowRoles.some((role) => roleCodes.includes(role));
    })
    .map((menu) => {
      // Nếu menu có megamenu, filter luôn từng item con theo key (nếu có set key riêng)
      if (!menu.megamenu) return menu;

      return {
        ...menu,
        megamenu: menu.megamenu.map((group) => ({
          ...group,
          singleMegamenu: (group.singleMegamenu || []).filter((child) => {
            if (!child.key) return true; // không set key riêng thì cho hiện theo menu cha
            const allowRoles = menuRoles[child.key] || [];
            return allowRoles.some((role) => roleCodes.includes(role));
          }),
        })),
      };
    });

  return menus;
}
