import { useSelector } from "react-redux";

import { topMenu } from "@/configs/top-menu";
import { menuRoles } from "@/configs/menu-role";

export default function useMenu() {
  const roles = useSelector((state) => state.auth.user?.roles || []);

  const roleCodes = roles.map((item) => item.code);

  const menus = topMenu.filter((menu) => {
    const allowRoles = menuRoles[menu.key] || [];

    // ADMIN thấy tất cả
    // if (roleCodes.includes("ADMIN")) {
    //   return true;
    // }

    return allowRoles.some((role) => roleCodes.includes(role));
  });

  return menus;
}
