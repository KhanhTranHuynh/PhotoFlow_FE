// src/components/GlobalOverlayLoading.jsx
import React from "react";

const GlobalOverlayLoading = () => {
  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full" />
    </div>
  );
};

export default GlobalOverlayLoading;
