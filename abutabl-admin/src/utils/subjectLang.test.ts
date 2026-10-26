import {
  isSubjectLangEnglish,
  normalizeSubjectLang,
  subjectDisplayAbout,
  subjectDisplayName,
} from "./subjectLang";

describe("subjectLang", () => {
  it("treats ar/false/0 as Arabic and everything else as English", () => {
    expect(normalizeSubjectLang("ar")).toBe("ar");
    expect(normalizeSubjectLang(false)).toBe("ar");
    expect(normalizeSubjectLang("en")).toBe("en");
    expect(normalizeSubjectLang(true)).toBe("en");
    expect(isSubjectLangEnglish("ar")).toBe(false);
    expect(isSubjectLangEnglish(true)).toBe(true);
  });

  it("picks Arabic name/about when subject lang is ar", () => {
    expect(
      subjectDisplayName({
        lang: "ar",
        name_en: "Lughaty Al Arabia KG1",
        name_ar: "لغتي العربية",
      })
    ).toBe("لغتي العربية");
    expect(
      subjectDisplayAbout({
        lang: "ar",
        des_en: "English about",
        des_ar: "وصف عربي",
      })
    ).toBe("وصف عربي");
  });
});
