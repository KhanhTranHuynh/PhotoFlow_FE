// src/components/ui/GlobalOverlayLoading.jsx
import React from "react";
import { createPortal } from "react-dom";

const GlobalOverlayLoading = () => {
  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] bg-black/50 backdrop-blur-[1px] flex items-center justify-center"
      role="alert"
      aria-busy="true"
      aria-live="assertive">
      <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full" />
    </div>,
    document.body,
  );
};

export default GlobalOverlayLoading;
