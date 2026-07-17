export const getTodayStr = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

export const getDateBefore = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date.toISOString().split("T")[0]; // yyyy-mm-dd
};
