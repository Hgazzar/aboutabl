export type CompletionScope = "all" | "assignments" | "quizzes";

export type CompletionBreakdown = {
  completed: number;
  in_progress: number;
  not_started: number;
  total: number;
};

export type ClassComparisonItem = {
  class_id: number;
  name: string;
  performance_percent: number;
  attendance_percent: number | null;
  completion_percent: number;
};

export type TeacherAnalyticsResponse = {
  status: boolean;
  attendance_available: boolean;
  classes_comparison: ClassComparisonItem[];
  completion_status: Record<CompletionScope, CompletionBreakdown>;
};
