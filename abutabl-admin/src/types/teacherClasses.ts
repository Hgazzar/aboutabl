export type TeacherClassHealthStatus = "good" | "needs_review" | "at_risk";

export type TeacherClassPerformanceTrend = "up" | "down" | "stable";

export type TeacherClassOverviewItem = {
  class_id: number;
  grade_id: number;
  name: string;
  grade_name: string;
  class_name: string;
  student_count: number;
  health_status: TeacherClassHealthStatus;
  health_label: string;
  performance: {
    percent: number;
    trend: TeacherClassPerformanceTrend;
  };
  students_need_attention: number;
  pending_assignments: number;
  top_student: {
    id: number;
    name: string;
    performance_percent: number;
  } | null;
  is_active: boolean;
};

export type TeacherClassesOverviewResponse = {
  status: boolean;
  meta: {
    total: number;
    filter: "all" | "single";
    class_id: number | null;
  };
  classes: TeacherClassOverviewItem[];
};

export type ClassesViewMode = "grid" | "list";
