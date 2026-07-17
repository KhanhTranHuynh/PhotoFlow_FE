export const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const cookieStr = document.cookie || "";
  const parts = cookieStr.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValParts] = part.trim().split("=");
    if (!rawKey) continue;
    if (rawKey === name) {
      const rawVal = rawValParts.join("=");
      return rawVal ? decodeURIComponent(rawVal) : "";
    }
  }
  return null;
};

export const setCookie = (
  name,
  value,
  {
    path = "/",
    maxAge,
    expires,
    sameSite = "Lax",
    secure = window.location?.protocol === "https:",
  } = {},
) => {
  if (typeof document === "undefined") return;

  let cookie = `${name}=${encodeURIComponent(value ?? "")}`;

  if (typeof maxAge === "number") cookie += `; Max-Age=${maxAge}`;
  if (expires instanceof Date) cookie += `; Expires=${expires.toUTCString()}`;
  if (path) cookie += `; Path=${path}`;
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  if (secure) cookie += `; Secure`;

  document.cookie = cookie;
};

export const removeCookie = (name, { path = "/" } = {}) => {
  setCookie(name, "", { path, maxAge: 0 });
};
