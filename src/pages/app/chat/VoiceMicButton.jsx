import React from "react";
import Icon from "@/components/ui/Icon";

/**
 * VoiceMicButton
 * status: "idle" | "recording" | "processing" | "error"
 */
const VoiceMicButton = ({ status = "idle", onClick, disabled = false }) => {
  const isRecording = status === "recording";
  const isProcessing = status === "processing";

  const titleMap = {
    idle: "Ghi âm giọng nói",
    recording: "Dừng ghi âm",
    processing: "Đang xử lý...",
    error: "Lỗi ghi âm — thử lại",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isProcessing}
      title={titleMap[status] || "Ghi âm"}
      aria-label={titleMap[status] || "Ghi âm"}
      className={[
        "relative h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-1",
        isRecording
          ? "bg-danger-500 text-white focus:ring-danger-300"
          : isProcessing
            ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            : status === "error"
              ? "bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400"
              : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800",
      ].join(" ")}>
      {/* Pulse ring when recording */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full animate-ping bg-danger-400 opacity-50" />
      )}

      {isProcessing ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : isRecording ? (
        <span className="w-3 h-3 rounded-sm bg-white block" />
      ) : (
        <Icon icon="heroicons-outline:microphone" className="text-base" />
      )}
    </button>
  );
};

export default VoiceMicButton;
