import React from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Menu } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { handleLogout, logoutWithApi } from "../../../../store/redux/auth";
import { getAvatarInitials } from "@/utils/getAvatarInitials";

const profileLabel = (user, { alwaysShowName = false } = {}) => {
  const displayName = user?.fullname || user?.so_dien_thoai || "Người dùng";
  const avatarText = getAvatarInitials(displayName);

  const nameWrapperClass = alwaysShowName ? "flex" : "md:flex hidden";

  return (
    <div className="flex items-center ">
      <div className="flex-none">
        <div className="lg:h-8 lg:w-8 h-7 w-7 rounded-full border-2 border-primary-600">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="block w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="block w-full h-full rounded-full bg-primary-500 text-white text-[10px] font-semibold flex items-center justify-center uppercase">
              {avatarText}
            </div>
          )}
        </div>
      </div>
      <div
        className={`flex-none text-slate-600 dark:text-white text-sm font-normal items-center overflow-hidden text-ellipsis whitespace-nowrap ltr:ml-2 rtl:mr-2 ${nameWrapperClass}`}>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap w-[120px] block">
          {displayName}
        </span>
        <span className="text-base inline-block ltr:ml-[10px] rtl:mr-[10px]">
          <Icon icon="heroicons-outline:chevron-down" />
        </span>
      </div>
    </div>
  );
};

const Profile = ({ alwaysShowName = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const ProfileMenu = [
    {
      label: "Trang cá nhân",
      icon: "heroicons-outline:user",
      action: () => {
        navigate("/trang-ca-nhan");
      },
    },
    {
      label: "Logout",
      icon: "heroicons-outline:login",
      action: () => {
        dispatch(logoutWithApi()).then((action) => {
          if (logoutWithApi.fulfilled.match(action)) {
            navigate("/");
          }
        });
      },
    },
  ];

  return (
    <Dropdown
      label={profileLabel(user, { alwaysShowName })}
      classMenuItems="w-[180px] top-[58px]">
      {ProfileMenu.map((item, index) => (
        <Menu.Item key={index}>
          {({ active }) => (
            <div
              onClick={() => item.action()}
              className={`${
                active
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                  : "text-slate-600 dark:text-slate-300"
              } block     ${
                item.hasDivider
                  ? "border-t border-slate-100 dark:border-slate-700"
                  : ""
              }`}>
              <div className={`block cursor-pointer px-4 py-2`}>
                <div className="flex items-center">
                  <span className="block text-xl ltr:mr-3 rtl:ml-3">
                    <Icon icon={item.icon} />
                  </span>
                  <span className="block text-sm">{item.label}</span>
                </div>
              </div>
            </div>
          )}
        </Menu.Item>
      ))}
    </Dropdown>
  );
};

export default Profile;
