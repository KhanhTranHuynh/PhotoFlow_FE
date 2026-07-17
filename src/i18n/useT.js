// src/i18n/useT.js
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export function useT() {
  const { i18n } = useTranslation();

  return useMemo(() => {
    return (
      i18n.getResourceBundle(i18n.language, "translation") ||
      i18n.getResourceBundle(i18n.options.fallbackLng[0], "translation") ||
      {}
    );
  }, [i18n.language]);
}
