import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { menuRoles } from "@/configs/menu-role";
import { getUserRoleCodes } from "@/utils/getUserRoleCodes";

export default function ProtectedRoute({ menuKey, children }) {
  const user = useSelector((state) => state.auth.user);
  const roleCodes = getUserRoleCodes(user);

  const allowRoles = menuRoles[menuKey] || [];
  const hasPermission = allowRoles.some((role) => roleCodes.includes(role));

  if (!hasPermission) {
    return <Navigate to="/404" replace />;
  }

  return children;
}
