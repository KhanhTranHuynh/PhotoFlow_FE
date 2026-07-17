// src/components/LanguageSwitcher.jsx
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}>
      {LANGUAGES.map((lng) => (
        <option key={lng.code} value={lng.code}>
          {lng.label}
        </option>
      ))}
    </select>
  );
}
