import i18n, { t } from "i18next";
import { initReactI18next } from "react-i18next";

import translationEN from "../locales/en.json";
import translationAR from "../locales/ar.json";

// the translations
const resources = {
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",

    interpolation: {
      escapeValue: false, // react already safes arom xss
    },
  });

export default i18n;

export type TranslatedWord = keyof (typeof resources)["en"]["translation"];

export const dictionary = <T extends TranslatedWord>(word: T) => t(word);
