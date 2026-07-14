import { ClassDetailsTimeRange } from "@/types/classDetails";

export type StudentsOverviewSortField = "performance" | "score" | "status" | "rank" | "name";

export type StudentsOverviewOrder = "asc" | "desc";

export type StudentsOverviewPerformanceLabel =
  | "very_good"
  | "good"
  | "average"
  | "below_average";

export type StudentsOverviewTrend = "up" | "down" | "stable";

export type StudentsOverviewStatus = "good" | "average" | "needs_attention" | "no_data";

export type StudentsOverviewItem = {
  student_id: number;
  name: string;
  photo_url: string | null;
  class_label: string;
  performance: {
    percent: number;
    label: StudentsOverviewPerformanceLabel;
    trend: StudentsOverviewTrend;
  };
  score: {
    percent: number;
    completed: number;
    total: number;
    has_data: boolean;
  };
  status: StudentsOverviewStatus;
  rank: number;
  overdue_count: number;
  needs_attention: boolean;
};

export type ClassStudentsOverviewResponse = {
  status: boolean;
  source: string;
  range: ClassDetailsTimeRange;
  class_id: number;
  class_label: string;
  meta: {
    total_students: number;
    sort: StudentsOverviewSortField;
    order: StudentsOverviewOrder;
  };
  items: StudentsOverviewItem[];
};

export const STUDENTS_OVERVIEW_SORT_FIELDS: StudentsOverviewSortField[] = [
  "name",
  "performance",
  "score",
  "status",
  "rank",
];
