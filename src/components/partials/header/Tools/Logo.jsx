import React from "react";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useWidth from "@/hooks/useWidth";
import MainLogo from "@/assets/images/logo/logo-ht.svg";
import LogoWhite from "@/assets/images/logo/logo-white.svg";
import MobileLogo from "@/assets/images/logo/logo-c.svg";
import MobileLogoWhite from "@/assets/images/logo/logo-c-white.svg";

import usePermission from "@/hooks/usePermission";

const Logo = () => {
  const [isDark] = useDarkMode();
  const { width, breakpoints } = useWidth();
  const dashboard_view = usePermission("dashboard_view");

  return (
    <div>
      <Link to={dashboard_view ? "/" : "/trang-ca-nhan"}>
        <img
          src={isDark ? MainLogo : MainLogo}
          alt="logo"
          className={`object-contain ${
            width >= breakpoints.xl
              ? "h-10 w-auto" // desktop
              : "h-8 w-auto" // mobile
          }`}
        />
      </Link>
    </div>
  );
};

export default Logo;
