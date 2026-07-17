import React, { useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useSelector } from "react-redux";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Radio from "@/components/ui/Radio";
import { getAvatarInitials } from "@/utils/getAvatarInitials";

import SimpleBar from "simplebar-react";
const MyProfile = () => {
  const user = useSelector((state) => state.auth.user);
  const avatarText = getAvatarInitials(
    user?.fullname || user?.username || "Người dùng",
  );

  return (
    <div>
      <header>
        <div className="flex px-6 pt-6">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="h-10 w-10 rounded-full">
                  <div className="block w-full h-full rounded-full bg-primary-500 text-white text-[10px] font-semibold flex items-center justify-center uppercase">
                    {avatarText}
                  </div>
                </div>
              </div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px]">
                  {user?.fullname || "Người dùng"}
                  <span className="status bg-success-500 inline-block h-[10px] w-[10px] rounded-full ml-3"></span>
                </span>
                <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal">
                  {user?.username || ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default MyProfile;
