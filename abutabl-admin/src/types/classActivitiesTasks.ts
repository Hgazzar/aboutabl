import { ClassDetailsTimeRange } from "@/types/classDetails";

export type ActivitiesTasksFilter = "all" | "pending" | "late" | "completed";

export type ActivitiesTasksTabCounts = {
  all: number;
  pending: number;
  late: number;
  completed: number;
};

export type ActivitiesTasksItem = {
  id: number;
  assign_id: number;
  student_id: number;
  title: string;
  context: string;
  type: "assignment" | "quiz";
  status: Exclude<ActivitiesTasksFilter, "all">;
  due_at: string | null;
  assigned_at: string | null;
  relative_time: string | null;
  opened_at: string | null;
};

export type ClassActivitiesTasksResponse = {
  status: boolean;
  source: string;
  range: ClassDetailsTimeRange;
  filter: ActivitiesTasksFilter;
  class_id: number;
  tab_counts: ActivitiesTasksTabCounts;
  items: ActivitiesTasksItem[];
};

export const ACTIVITIES_TASKS_FILTERS: ActivitiesTasksFilter[] = [
  "all",
  "pending",
  "late",
  "completed",
];
