export type ClassDetailsTab = "overview" | "students" | "assignments";

export type ClassDetailsTimeRange = "week" | "month" | "term" | "all";

/** Metric / student-profile ranges — never includes `all`. */
export type ClassDetailsMetricTimeRange = Exclude<ClassDetailsTimeRange, "all">;

export const CLASS_DETAILS_TABS: ClassDetailsTab[] = [
  "overview",
  "students",
  "assignments",
];

/** Shared chips for overview / students (metrics ranges only). */
export const CLASS_DETAILS_METRIC_TIME_RANGES: ClassDetailsMetricTimeRange[] = [
  "week",
  "month",
  "term",
];

/** Assignments list chips — includes `all` (no created_at window). */
export const CLASS_DETAILS_TIME_RANGES: ClassDetailsTimeRange[] = [
  "week",
  "month",
  "term",
  "all",
];

/** Map UI time range to metrics/profile API range (`all` → `week`). */
export const toMetricTimeRange = (
  range: ClassDetailsTimeRange | undefined
): ClassDetailsMetricTimeRange => {
  if (!range || range === "all") {
    return "week";
  }
  return range;
};

export const isClassDetailsTab = (value: string | undefined): value is ClassDetailsTab =>
  CLASS_DETAILS_TABS.includes(value as ClassDetailsTab);
