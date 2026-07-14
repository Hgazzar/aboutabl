import { ClassDetailsTimeRange } from "@/types/classDetails";

export type StandardsSubjectSlug = "letters-explorer" | "math-explorer";

export type StandardsAuditDetail = {
  linked_at: string | null;
  link_type: "automatic" | "manual";
  reason: string;
  confidence_score: number | null;
  action: string;
};

export type StandardsChartItem = {
  standard_id: number;
  code: string;
  label: string;
  percent: number;
  status: "excellent" | "good" | "warning" | string;
  color: string;
  definition: string;
  domain: string;
  submissions: {
    completed: number;
    total: number;
  };
  assign_count: number;
  content_count: number;
  link_sources: string[];
  audit_details: StandardsAuditDetail[];
};

export type StandardsTab = {
  subject_id: number;
  slug: StandardsSubjectSlug;
  label: string;
  active: boolean;
};

export type StandardsSelectedItem = {
  standard_id: number;
  code: string;
  label: string;
  percent: number;
  status: string;
  color: string;
  definition: string;
  link_sources: string[];
  audit_details?: StandardsAuditDetail[];
};

export type ClassStandardsResponse = {
  status: boolean;
  source: string;
  range: ClassDetailsTimeRange;
  class_id: number;
  tabs: StandardsTab[];
  selected: StandardsSelectedItem | null;
  items: StandardsChartItem[];
};

export const isStandardsSubjectSlug = (value: string): value is StandardsSubjectSlug =>
  value === "letters-explorer" || value === "math-explorer";

/** Real audit rows only — excludes legacy fallback placeholders from the API. */
export const getVisibleAuditDetails = (
  details: StandardsAuditDetail[] | undefined
): StandardsAuditDetail[] =>
  (details ?? []).filter((entry) => !entry.reason?.startsWith("Legacy link"));
