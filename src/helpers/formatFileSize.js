const formatFileSize = (bytes) => {
  const size = Number(bytes);

  if (!size || Number.isNaN(size)) return "--";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export default formatFileSize;
