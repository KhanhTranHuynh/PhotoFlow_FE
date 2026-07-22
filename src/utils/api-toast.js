import { toast } from "react-toastify";

const DEFAULT_POSITION = { position: "top-right" };

export const getApiResultMeta = (response) => {
  const codeRaw = response?.code ?? response?.data?.code;
  const message = response?.message || response?.data?.message || "";

  const parsed = Number(codeRaw);
  const code = Number.isFinite(parsed) ? parsed : null;

  return { code, message };
};

export const notifyApiByCode = (response, options = {}) => {
  const {
    successMessage = "Thành công",
    errorMessage = "Thất bại",
    onSuccess,
    onError,
    message: overrideMessage,
    toastOptions = DEFAULT_POSITION,
  } = options;
  console.log("notifyApiByCode response:", response);
  const { code, message } = getApiResultMeta(response);

  // Rule:
  // - code > 0 => success
  // - code <= 0 OR missing/invalid => error

  const finalMessage =
    overrideMessage || message || (code > 0 ? successMessage : errorMessage);

  if (code > 0) {
    toast.success(finalMessage, toastOptions);
    onSuccess?.(response);
    return "success";
  }

  toast.error(finalMessage, toastOptions);
  onError?.(response);
  return "error";
};
