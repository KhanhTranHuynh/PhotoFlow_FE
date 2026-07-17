import { toast } from "react-toastify";

const DEFAULT_POSITION = { position: "top-right" };

export const getApiResultMeta = (response) => {
  const errorCodeRaw = response?.errorCode ?? response?.data?.errorCode;
  const message = response?.message || response?.data?.message || "";

  const parsed = Number(errorCodeRaw);
  const errorCode = Number.isFinite(parsed) ? parsed : null;

  return { errorCode, message };
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

  const { errorCode, message } = getApiResultMeta(response);

  // Rule:
  // - errorCode > 0 => success
  // - errorCode <= 0 OR missing/invalid => error
  const isSuccess = typeof errorCode === "number" && errorCode > 0;

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
