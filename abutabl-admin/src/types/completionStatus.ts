import { ClassDetailsTimeRange } from "@/types/classDetails";
import { CompletionBreakdown, CompletionScope } from "@/types/teacherAnalytics";

/**
 * charts.completion_status from class overview — percentages computed by backend SSOT.
 */
export type CompletionStatusByScope = Record<CompletionScope, CompletionBreakdown>;

export type CompletionStatusQueryParams = {
  range?: ClassDetailsTimeRange;
};

export type CompletionStatusResponse = {
  status: boolean;
  range: ClassDetailsTimeRange;
  class_id: number;
  by_scope: CompletionStatusByScope | null;
};

export const COMPLETION_STATUS_SCOPES: CompletionScope[] = [
  "all",
  "assignments",
  "quizzes",
];
