import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enUS from "@/locales/en-US/common.json";
import ptBR from "@/locales/pt-BR/common.json";
import es419 from "@/locales/es-419/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "en-US": { common: enUS },
      "pt-BR": { common: ptBR },
      "es-419": { common: es419 },
    },
    ns: ["common"],
    defaultNS: "common",
    // Maps any region variant (es-MX, es-AR, en-GB, pt-PT...) to the closest
    // language we actually ship, before falling back to pt-BR as the last resort.
    fallbackLng: {
      es: ["es-419"],
      en: ["en-US"],
      pt: ["pt-BR"],
      default: ["pt-BR"],
    },
    supportedLngs: ["pt-BR", "en-US", "es-419"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "fuzen_language",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
