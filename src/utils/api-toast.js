import { toast } from "react-toastify";

const DEFAULT_POSITION = { position: "top-right" };

export const getApiResultMeta = (response) => {
  const codeRaw = response?.code ?? response?.data?.code;
  const message = response?.message || response?.data?.message || "";

  const parsed = Number(codeRaw);
  const code = Number.isFinite(parsed) ? parsed : null;

  return { code, message };
};

export const notifyApiByErrorCode = (response, options = {}) => {
  const {
    successMessage = "Thành công",
    errorMessage = "Thất bại",
    onSuccess,
    onError,
    message: overrideMessage,
    toastOptions = DEFAULT_POSITION,
  } = options;

  const { code, message } = getApiResultMeta(response);

  // Rule:
  // - code > 0 => success
  // - code <= 0 OR missing/invalid => error
  const isSuccess = typeof code === "number" && code > 0;

  const finalMessage =
    overrideMessage || message || (isSuccess ? successMessage : errorMessage);

  if (isSuccess) {
    toast.success(finalMessage, toastOptions);
    onSuccess?.(response);
    return "success";
  }

  toast.error(finalMessage, toastOptions);
  onError?.(response);
  return "error";
};
