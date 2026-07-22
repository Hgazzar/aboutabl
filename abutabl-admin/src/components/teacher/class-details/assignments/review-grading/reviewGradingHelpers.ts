import {
  QuizRuntimeAttemptMeta,
  QuizRuntimeResultRow,
  RuntimeReviewQuestionView,
} from "@/types/quizRuntime";

export type QuestionStatusKind =
  | "correct"
  | "incorrect"
  | "pending"
  | "unanswered";

export type AttemptStatusKind =
  | "pending_manual"
  | "passed"
  | "failed"
  | "completed";

export const resolveQuestionStatus = (
  row: RuntimeReviewQuestionView
): QuestionStatusKind => {
  if (!row.answer) {
    return "unanswered";
  }
  if (row.isManual && row.answer.needs_manual) {
    return "pending";
  }
  if (row.isCorrect === true) {
    return "correct";
  }
  if (row.isCorrect === false) {
    return "incorrect";
  }
  return "pending";
};

export const questionStatusIcon = (kind: QuestionStatusKind): string => {
  switch (kind) {
    case "correct":
      return "✅";
    case "incorrect":
      return "❌";
    case "pending":
      return "🟡";
    default:
      return "○";
  }
};

export const resolveAttemptStatus = (
  attempt: QuizRuntimeAttemptMeta,
  result: QuizRuntimeResultRow | null
): AttemptStatusKind => {
  if (result?.pending_manual) {
    return "pending_manual";
  }
  if (result) {
    return result.pass ? "passed" : "failed";
  }
  if (attempt.status === "finalized" || attempt.status === "submitted") {
    return "completed";
  }
  return "completed";
};

/** Standard empty display for Review Workspace stats — never "-", "--", or "Unknown". */
export const REVIEW_NA = "N/A";

/**
 * Display-only: API may return "0s" when started/submitted share the same second.
 * Show a clearer label without changing Backend calculation.
 */
export const isZeroSecondDurationLabel = (raw: string): boolean => {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "");
  return (
    normalized === "0s" ||
    normalized === "0sec" ||
    normalized === "0secs" ||
    normalized === "0second" ||
    normalized === "0seconds" ||
    normalized === "0"
  );
};
export const formatScoreFraction = (
  earned: number | null,
  max: number | null
): string => {
  if (earned == null && max == null) {
    return REVIEW_NA;
  }
  const earnedLabel = earned == null ? REVIEW_NA : String(earned);
  const maxLabel = max == null ? REVIEW_NA : String(max);
  return `${earnedLabel} / ${maxLabel}`;
};

export const formatQuestionTypeLabel = (type: string | null): string => {
  if (!type) {
    return "Question";
  }
  const key = type.trim().toLowerCase();
  const map: Record<string, string> = {
    mcq: "MCQ",
    tf: "True / False",
    matching: "Matching",
    shn: "Short Answer",
    essay: "Essay",
    upload: "Upload",
    ordering: "Ordering",
    "fill blank": "Fill Blank",
    fill_blank: "Fill Blank",
  };
  return map[key] ?? type;
};

export const formatDateTime = (
  value: string | null | undefined,
  locale: string
): string => {
  if (!value) {
    return REVIEW_NA;
  }
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
};
