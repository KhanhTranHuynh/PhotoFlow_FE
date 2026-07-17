import { pageTitles } from "@/configs/page-titles";

export const getPageTitle = (pathname) => {
  if (pageTitles[pathname]) return pageTitles[pathname];

  const match = Object.keys(pageTitles).find((pattern) => {
    const regex = new RegExp("^" + pattern.replace(/:[^/]+/g, "[^/]+") + "$");
    return regex.test(pathname);
  });

  return match ? pageTitles[match] : pathname;
};
