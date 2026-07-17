import React from "react";
import Icon from "@/components/ui/Icon";
import { notificationIcon } from "@/helpers/notification";

// ─── Avatar with initials fallback ───────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-green-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
];

const getAvatarColor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (title = "") => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const NotifAvatar = ({ item }) => {
  const iconConfig = notificationIcon(
    item.notification_subtype || item.notification_type,
  );
  const bgColor = getAvatarColor(item.title || item.id?.toString());
  const initials = getInitials(item.title);

  return (
    <div className="relative flex-shrink-0 w-14 h-14">
      {item.avatar_url ? (
        <img
          src={item.avatar_url}
          alt=""
          className="w-14 h-14 rounded-full object-cover"
        />
      ) : (
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-medium text-base ${bgColor}`}>
          {initials}
        </div>
      )}
      <div
        className={`absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 ${iconConfig.bg}`}>
        <Icon
          icon={iconConfig.icon}
          className={`text-[11px] ${iconConfig.color}`}
        />
      </div>
    </div>
  );
};

export { getAvatarColor, getInitials, AVATAR_COLORS };
export default NotifAvatar;
