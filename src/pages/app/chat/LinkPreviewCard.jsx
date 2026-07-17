import React from "react";

const LinkPreviewCard = ({ preview }) => {
  if (!preview) return null;

  const { url, title, description, image, siteName, favicon } = preview;

  const handleOpenLink = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleOpenLink}
      className="
        w-full
        max-w-md
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-200
        cursor-pointer
        hover:shadow-md
        hover:border-slate-300
        dark:bg-slate-800
        dark:border-slate-700
      ">
      {/* IMAGE */}
      {image && (
        <div className="w-full h-[180px] overflow-hidden bg-slate-100 dark:bg-slate-700">
          <img
            src={image}
            alt={title}
            className="
              w-full
              h-full
              object-cover
              transition-transform
              duration-300
              hover:scale-105
            "
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* CONTENT */}
      <div className="p-3">
        {/* SITE INFO */}
        <div className="flex items-center gap-2 mb-2">
          {favicon && (
            <img
              src={favicon}
              alt="favicon"
              className="w-4 h-4 rounded-sm object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}

          <span
            className="
              text-xs
              text-slate-500
              dark:text-slate-400
              truncate
            ">
            {siteName || new URL(url).hostname}
          </span>
        </div>

        {/* TITLE */}
        <h3
          className="
            text-sm
            font-semibold
            text-slate-900
            dark:text-white
            line-clamp-2
            break-words
          ">
          {title || "No title"}
        </h3>

        {/* DESCRIPTION */}
        {description && (
          <p
            className="
              mt-1
              text-xs
              text-slate-600
              dark:text-slate-300
              line-clamp-2
              break-words
            ">
            {description}
          </p>
        )}

        {/* URL */}
        <div
          className="
            mt-3
            text-[11px]
            text-blue-500
            truncate
          ">
          {url}
        </div>
      </div>
    </div>
  );
};

export default LinkPreviewCard;
