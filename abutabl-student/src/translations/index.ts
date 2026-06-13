import ar from "./AR/translation.json";
import en from "./EN/translation.json";
export type TLocale = "en" | "ar";

export const messages: { [key in TLocale]: Record<string, string> } = {
  en: en,
  ar: ar,
};
