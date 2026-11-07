/** Canonical question-bank types (API validation + UI switches). */
export type QuestionBankType = "MCQ" | "TF" | "SHN" | "Matching";

const TYPE_MAP: Record<string, QuestionBankType> = {
  mcq: "MCQ",
  tf: "TF",
  shn: "SHN",
  matching: "Matching",
};

/** Normalize API/legacy casing (e.g. `mcq`) to canonical `MCQ` / `TF` / … */
export function normalizeQuestionType(
  raw: unknown,
  fallback: QuestionBankType = "MCQ"
): QuestionBankType {
  if (raw == null || raw === "") return fallback;
  const key = String(raw).trim();
  if (key === "MCQ" || key === "TF" || key === "SHN" || key === "Matching") {
    return key;
  }
  return TYPE_MAP[key.toLowerCase()] ?? fallback;
}
