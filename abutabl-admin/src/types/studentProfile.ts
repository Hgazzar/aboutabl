import { ClassDetailsLearningProgress } from "@/types/classDetailsOverview";
import { StandardsAuditDetail } from "@/types/classStandards";

export type StudentProfileRange = "week" | "month" | "term";

export type StudentProfilePagination = {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
  has_more: boolean;
};

export type StudentProfileSummary = {
  student_id: number;
  name: string;
  photo_url: string | null;
  avatar: string | null;
  class_label: string;
  grade_label: string;
  rank: number;
  performance_percent: number;
  /** Assignment Completion % (assigns_students) — not Accuracy. */
  score_percent: number;
  /** Accuracy SSOT: Average(quiz_results.percent). */
  accuracy_percent?: number;
  accuracy_available?: boolean;
  status: string;
  performance_label: string;
  trend: string;
  needs_attention: boolean;
  overdue_count: number;
};

export type StudentProfileAnalyticsPoint = {
  day: string;
  date: string;
  value: number;
  completion_percent: number;
  class_avg_percent: number;
  completed: number;
  total: number;
};

export type StudentProfileAnalytics = {
  available: boolean;
  series: StudentProfileAnalyticsPoint[];
  summary: {
    performance_percent: number;
    delta_percent: number | null;
    completion_percent: number;
    attendance_percent: number | null;
    attendance_available: boolean;
  };
};

export type StudentProfileCompletion = {
  completed: number;
  missing: number;
  total: number;
  percent: number;
  score_percent: number;
};

/** Same shape as Class Overview learning_progress (shared SSOT, student scope). */
export type StudentProfileLearningProgress = ClassDetailsLearningProgress;

export type StudentProfileActivityItem = {
  id: number;
  assign_id: number;
  title: string;
  type: "assignment" | "quiz" | string;
  status: "pending" | "late" | "completed" | string;
  /** Backend badge key for UI: submitted | missing | pending */
  status_badge?: "submitted" | "missing" | "pending" | string;
  score: number | null;
  max_score: number | null;
  score_label: string | null;
  due_at: string | null;
  assigned_at: string | null;
  relative_time: string | null;
  opened_at: string | null;
};

export type StudentProfileActivityList = {
  items: StudentProfileActivityItem[];
  pagination: StudentProfilePagination;
  /** Quizzes only — additive; null when no scored quizzes exist. */
  average_percent?: number | null;
  average_available?: boolean;
};

export type StudentProfileStandardTab = {
  subject_id: number;
  slug: string;
  label: string;
  active: boolean;
};

export type StudentProfileStandardItem = {
  standard_id: number;
  code: string;
  label: string;
  definition: string | null;
  domain: string;
  percentage: number;
  percent: number;
  status: string;
  color: string;
  trend: string | null;
  submissions?: {
    completed: number;
    total: number;
  };
  link_sources?: string[];
  audit_details?: StandardsAuditDetail[];
};

export type StudentProfileStandards = {
  available: boolean;
  tabs: StudentProfileStandardTab[];
  selected: StudentProfileStandardItem | null;
  items: StudentProfileStandardItem[];
};

export type StudentProfileSmartInsightTask = {
  id: string;
  title: string;
  due: string | null;
  detail_url: string | null;
};

export type StudentProfileSmartInsightRecommendation = {
  title: string;
  description?: string;
  priority?: string | number;
  category?: string;
  action_type?: string;
  target_type?: string;
  target_id?: number | string | null;
  due_hint?: string | null;
  source_insight_id?: string;
  [key: string]: unknown;
};

export type StudentProfileSmartInsightExecutiveSummary = {
  overall_student_status?: string | null;
  strongest_positive_finding?: string | null;
  highest_priority_concern?: string | null;
  teacher_focus_area?: string | null;
  immediate_recommended_action?: string | null;
  overall_confidence?: number | null;
  findings?: string[];
  [key: string]: unknown;
};

export type StudentProfileSmartInsightCategoryGroup = {
  category: string;
  insights?: StudentProfileSmartInsightItem[];
  visible?: StudentProfileSmartInsightItem[];
  collapsed?: StudentProfileSmartInsightItem[];
  collapsed_count?: number;
  more_label?: string | null;
  [key: string]: unknown;
};

/**
 * One Smart Insight from the backend engine.
 * Known fields are typed; extra keys are allowed and must render dynamically.
 */
export type StudentProfileSmartInsightItem = {
  id: string;
  category?: string;
  severity?: string;
  title?: string;
  description?: string;
  recommendation?: string;
  /** Backend may send int or Critical/High/Medium/Low/Info — display as returned. */
  priority?: number | string;
  priority_rank?: number;
  generated_at?: string | null;
  supporting_metrics?: Record<string, unknown>;
  confidence?: number | string | null;
  recommendations?: unknown;
  risk_indicators?: unknown;
  positive_findings?: unknown;
  weaknesses?: unknown;
  trend?: string | null;
  recommended_tasks?: StudentProfileSmartInsightTask[];
  tasks?: StudentProfileSmartInsightTask[];
  [key: string]: unknown;
};

export type StudentProfileSmartInsight = {
  available: boolean;
  text: string | null;
  generated_at: string | null;
  insights: StudentProfileSmartInsightItem[];
  executive_summary?: StudentProfileSmartInsightExecutiveSummary | null;
  executive_score?: number | null;
  executive_level?: string | null;
  executive_confidence?: number | null;
  categories?: StudentProfileSmartInsightCategoryGroup[];
  recommendations?: StudentProfileSmartInsightRecommendation[];
  presentation_sections?: Array<Record<string, unknown>>;
  /** Optional backend tasks — omitted/empty hides Recommended Tasks UI. */
  recommended_tasks?: StudentProfileSmartInsightTask[];
  tasks?: StudentProfileSmartInsightTask[];
  [key: string]: unknown;
};

export type TeacherEvaluationNote = {
  id: number;
  school_id: number | null;
  teacher_id: number;
  teacher_name: string;
  class_id: number;
  student_id: number;
  note: string;
  created_at: string | null;
  updated_at: string | null;
  is_latest?: boolean;
};

export type StudentProfileTeacherEvaluation = {
  available: boolean;
  notes: TeacherEvaluationNote[];
  latest_feedback: TeacherEvaluationNote | null;
  recommendations: Array<Record<string, unknown>>;
  smart_insight: StudentProfileSmartInsight;
};

export type StudentProfileRankingItem = {
  student_id: number;
  name: string;
  photo_url: string | null;
  class_label: string;
  status: string;
  performance_label?: string;
  score_percent: number;
  performance_percent: number;
  rank: number;
  is_current: boolean;
};

export type StudentProfileRankingsScope = "class" | "all_classes";

export type StudentProfileRankings = {
  available: boolean;
  scope?: StudentProfileRankingsScope | string;
  class_rank: number | null;
  all_classes_rank?: number | null;
  all_classes_available?: boolean;
  school_rank: number | null;
  school_available: boolean;
  items: StudentProfileRankingItem[];
};

export type StudentProfileResponse = {
  status: boolean;
  source: string;
  range: StudentProfileRange | string;
  class_id: number;
  student: StudentProfileSummary;
  analytics: StudentProfileAnalytics;
  completion: StudentProfileCompletion;
  learning_progress: StudentProfileLearningProgress;
  activities: {
    assignments: StudentProfileActivityList;
    quizzes: StudentProfileActivityList;
  };
  standards: StudentProfileStandards;
  teacher_evaluation: StudentProfileTeacherEvaluation;
  rankings: StudentProfileRankings;
};

export type StudentProfileQueryParams = {
  range?: StudentProfileRange;
  subject?: string;
  assignments_page?: number;
  quizzes_page?: number;
  scope?: StudentProfileRankingsScope | string;
  search?: string;
  limit?: number;
};

export const EMPTY_PAGINATION: StudentProfilePagination = {
  current_page: 1,
  per_page: 10,
  last_page: 1,
  total: 0,
  has_more: false,
};
