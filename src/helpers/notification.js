import Icon from "@/components/ui/Icon";

export const notificationIcon = (type) => {
  const icons = {
    ORDER: {
      icon: "heroicons-outline:shopping-cart",
      bg: "bg-slate-100",
      color: "text-slate-500",
    },
    ORDER_NEW: {
      icon: "heroicons-outline:shopping-cart",
      bg: "bg-slate-100",
      color: "text-slate-600",
    },
    ORDER_PENDING: {
      icon: "heroicons-outline:exclamation",
      bg: "bg-yellow-100",
      color: "text-yellow-500",
    },
    ORDER_DONE: {
      icon: "heroicons-outline:check",
      bg: "bg-green-100",
      color: "text-green-500",
    },
    DEBT: {
      icon: "heroicons-outline:currency-dollar",
      bg: "bg-yellow-100",
      color: "text-yellow-600",
    },
    PAYMENT: {
      icon: "heroicons-outline:credit-card",
      bg: "bg-orange-100",
      color: "text-orange-500",
    },
    CUSTOMER: {
      icon: "heroicons-outline:user",
      bg: "bg-blue-100",
      color: "text-blue-400",
    },
    DEFAULT: {
      icon: "heroicons-outline:bell",
      bg: "bg-slate-100",
      color: "text-slate-500",
    },
  };
  return icons[type] || icons.DEFAULT;
};

export const badgeConfig = (subtype) => {
  const map = {
    ORDER: { label: "Đơn hàng", className: "bg-blue-100 text-blue-600" },
    ORDER_NEW: { label: "Đơn hàng", className: "bg-blue-100 text-blue-600" },
    ORDER_PENDING: { label: "Khẩn", className: "bg-red-100 text-red-500" },
    ORDER_DONE: { label: "Đơn hàng", className: "bg-blue-100 text-blue-600" },
    DEBT: { label: "Công nợ", className: "bg-yellow-100 text-yellow-600" },
    PAYMENT: {
      label: "Thanh toán",
      className: "bg-orange-100 text-orange-500",
    },
    CUSTOMER: { label: "Khách hàng", className: "bg-sky-100 text-sky-500" },
  };
  return map[subtype] || null;
};

export const formatTime = (dateStr) => {
  if (!dateStr) return "";

  // Nếu server trả UTC string nhưng thiếu Z (vd: "2026-06-08T10:00:00")
  // thêm Z để browser hiểu đúng là UTC
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(dateStr)
    ? dateStr
    : dateStr + "Z"; // ← chỉ thêm nếu chưa có timezone

  const date = new Date(normalized);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 0) return "Vừa xong"; // chặn âm do lệch đồng hồ nhỏ

  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Hôm qua, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

export const groupByDate = (items) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = [];
  const map = new Map();

  items.forEach((item) => {
    const d = new Date(item.createdate);
    d.setHours(0, 0, 0, 0);
    let key, label;

    if (d.getTime() === today.getTime()) {
      key = "today";
      label = `HÔM NAY – ${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
    } else if (d.getTime() === yesterday.getTime()) {
      key = "yesterday";
      label = `HÔM QUA – ${String(yesterday.getDate()).padStart(2, "0")}/${String(yesterday.getMonth() + 1).padStart(2, "0")}/${yesterday.getFullYear()}`;
    } else {
      key = d.toISOString();
      label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }

    if (!map.has(key)) {
      map.set(key, { key, label, items: [] });
      groups.push(map.get(key));
    }
    map.get(key).items.push(item);
  });

  return groups;
};
