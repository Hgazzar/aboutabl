export type SubjectLang = "en" | "ar";

export function normalizeSubjectLang(value: unknown): SubjectLang {
  if (value === false || value === 0 || value === "0" || value === "ar") {
    return "ar";
  }
  return "en";
}

export function isSubjectLangEnglish(value: unknown): boolean {
  return normalizeSubjectLang(value) === "en";
}

export function subjectDisplayName(item: {
  lang?: string | null;
  name?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
}): string {
  const lang = normalizeSubjectLang(item?.lang);
  if (lang === "ar") {
    return String(item?.name_ar || item?.name || item?.name_en || "").trim();
  }
  return String(item?.name_en || item?.name || item?.name_ar || "").trim();
}

export function subjectDisplayAbout(item: {
  lang?: string | null;
  des?: string | null;
  des_en?: string | null;
  des_ar?: string | null;
}): string {
  const lang = normalizeSubjectLang(item?.lang);
  if (lang === "ar") {
    return String(item?.des_ar || item?.des || item?.des_en || "");
  }
  return String(item?.des_en || item?.des || item?.des_ar || "");
}

export function subjectDisplayPass(item: {
  lang?: string | null;
  pass?: string | null;
  pass_en?: string | null;
  pass_ar?: string | null;
}): string {
  const lang = normalizeSubjectLang(item?.lang);
  if (lang === "ar") {
    return String(item?.pass_ar || item?.pass || item?.pass_en || "");
  }
  return String(item?.pass_en || item?.pass || item?.pass_ar || "");
}
