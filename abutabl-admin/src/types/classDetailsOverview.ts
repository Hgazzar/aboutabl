import { ClassDetailsTimeRange } from "@/types/classDetails";
import { CompletionBreakdown, CompletionScope } from "@/types/teacherAnalytics";

export type ClassDetailsPerformanceTrendDirection = "up" | "down" | "stable";

export type ClassDetailsActivityStatus = "pending" | "completed" | "overdue";

export type ClassDetailsActivityType = "assignment" | "quiz";

export type ClassDetailsOverviewStats = {
  performance_percent: number;
  performance_trend: {
    direction: ClassDetailsPerformanceTrendDirection;
    delta_percent: number;
  };
  completion_rate_percent: number;
  students_need_attention: number;
};

export type ClassDetailsPerformanceSummary = {
  class_percent: number;
  school_percent: number;
};

export type ClassDetailsPerformancePoint = {
  label: string;
  class_percent: number;
  school_percent: number;
};

export type ClassDetailsCompletionStatus = CompletionBreakdown;

export type ClassDetailsCompletionStatusByScope = Record<CompletionScope, CompletionBreakdown>;

export type ClassDetailsActivity = {
  id: number;
  title: string;
  type: ClassDetailsActivityType;
  due_date: string | null;
  status: ClassDetailsActivityStatus;
  completion_percent: number;
};

export type ClassDetailsStudentPreview = {
  student_id: number;
  name: string;
  photo_url: string | null;
  performance_percent: number;
  performance_label: "below_average" | "average";
  needs_attention: boolean;
  overdue_count: number;
};

export type ClassDetailsOverviewResponse = {
  status: boolean;
  class: {
    class_id: number;
    label: string;
    subject_name: string;
    student_count: number;
  };
  range: ClassDetailsTimeRange;
  stats: ClassDetailsOverviewStats;
  charts: {
    performance_line: ClassDetailsPerformancePoint[];
    performance_summary?: ClassDetailsPerformanceSummary;
    completion_status: ClassDetailsCompletionStatusByScope;
  };
  activities: ClassDetailsActivity[];
  students_preview: ClassDetailsStudentPreview[];
};
