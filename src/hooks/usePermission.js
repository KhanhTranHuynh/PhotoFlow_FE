import { useSelector } from "react-redux";
import { permissions } from "@/configs/permissions";

export default function usePermission(key) {
  // lấy roles từ redux
  const roles = useSelector((state) => state.auth.user?.roles || []);

  // convert sang mảng code
  const roleCodes = roles.map((item) => item.code);

  // admin full quyền
  // if (roleCodes.includes("ADMIN")) {
  //   return true;
  // }

  // lấy danh sách role được phép
  const allowRoles = permissions[key] || [];

  // check có role phù hợp không
  return allowRoles.some((role) => roleCodes.includes(role));
}
