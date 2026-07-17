function formatMoney(value, removeZero = false) {
  const formatted = Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (removeZero && Number(value) % 1 === 0) {
    return formatted.replace(/\.00$/, "");
  }

  return formatted;
}

export const formatMoneyPhay = (value) => {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
};

export const formatDateDDMMYYYY = (isoString) => {
  if (!isoString) return "";

  const date = new Date(isoString);

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatMonthValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export default {
  formatMoney,
  formatMoneyPhay,
  formatDateDDMMYYYY,
  formatMonthValue,
};
