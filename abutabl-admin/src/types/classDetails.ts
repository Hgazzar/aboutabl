export type ClassDetailsTab = "overview" | "students" | "assignments";

export type ClassDetailsTimeRange = "week" | "month" | "term";

export const CLASS_DETAILS_TABS: ClassDetailsTab[] = [
  "overview",
  "students",
  "assignments",
];

export const CLASS_DETAILS_TIME_RANGES: ClassDetailsTimeRange[] = [
  "week",
  "month",
  "term",
];

export const isClassDetailsTab = (value: string | undefined): value is ClassDetailsTab =>
  CLASS_DETAILS_TABS.includes(value as ClassDetailsTab);
