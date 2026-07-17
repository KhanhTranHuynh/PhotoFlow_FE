import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { menuRoles } from "@/configs/menu-role";

export default function ProtectedRoute({ menuKey, children }) {
  const roles = useSelector((state) => state.auth.user?.roles || []);
  const roleCodes = roles.map((item) => item.code);

  if (roleCodes.includes("ADMIN")) {
    return children;
  }

  const allowRoles = menuRoles[menuKey] || [];
  const hasPermission = allowRoles.some((role) => roleCodes.includes(role));

  if (!hasPermission) {
    return <Navigate to="/404" replace />;
  }

  return children;
}
