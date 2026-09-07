/**
 * F-041E.3 — Teacher Class Assignments Read API types.
 * Source: GET /api/dashboard/teacher/classes/{classId}/assignments
 */

export type {
  AssignmentMaterialItem,
  AssignmentMaterialKind,
} from "@/types/assignmentMaterials";

export type WizardClassOption = {
  class_id: number;
  label: string;
};

export type ClassAssignmentCardStatus = "active" | "done" | "overdue";

export type ClassAssignmentStatusFilter = "all" | ClassAssignmentCardStatus;

export type ClassAssignmentsViewMode = "grid" | "list";

export type ClassAssignmentsSort =
  | "newest"
  | "oldest"
  | "due_date"
  | "completion";

export type ClassAssignmentListItem = {
  id: number;
  title: string;
  subtitle: string;
  assignment_type: "assignment" | "quiz";
  status: ClassAssignmentCardStatus;
  due_at: string | null;
  created_at: string | null;
  created_by: number;
  subject: { id: number; name: string } | null;
  module: string;
  target_students: number;
  completed_students: number;
  pending_students: number;
  overdue_students: number;
  completion_percentage: number;
  has_missing_students: boolean;
  has_overdue_students: boolean;
  standards_count: number;
};

export type ClassAssignmentsListResponse = {
  status?: boolean;
  class_id: number;
  source: string;
  filters: {
    search: string | null;
    status: string;
    subject: number | null;
    teacher: number | null;
    range: string;
    sort: string;
  };
  data: ClassAssignmentListItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

/**
 * F-043 — GET /api/dashboard/teacher/classes/{classId}/assignments/{assignmentId}
 */
export type AssignmentDetailsMaterials = {
  files: unknown[];
  voice_recordings: unknown[];
  links: unknown[];
};

export type AssignmentDetailsAssignment = {
  id: number;
  title: string;
  subject: { id: number; name: string } | null;
  module: string;
  module_type: string;
  assignment_type: "assignment" | "quiz";
  due_date: string | null;
  due_at: string | null;
  created_at: string | null;
  status: ClassAssignmentCardStatus;
  created_by: number;
  subtitle: string;
  standards_count: number;
};

export type AssignmentDetailsStatistics = {
  target_students: number;
  completed_students: number;
  pending_students: number;
  overdue_students: number;
  completion_percentage: number;
  has_missing_students: boolean;
  has_overdue_students: boolean;
  /** Quiz-only graded average from quiz_results; null for Tasks. */
  average_score?: number | null;
};

export type AssignmentStudentCompletionStatus =
  | "submitted"
  | "late"
  | "missing"
  | "graded";

/** Per-student row from AssignmentService::getForClass (assigns_students). */
export type AssignmentDetailsStudentRow = {
  student_id: number;
  assign_student_id?: number;
  name: string;
  photo_url?: string | null;
  status: AssignmentStudentCompletionStatus;
  /** Parent lifecycle SSOT for learning_activities. */
  submission_status?: "active" | "submitted" | "graded" | string;
  submitted_at?: string | null;
  graded_at?: string | null;
  opened_at: string | null;
  /** Quiz / Multi-Activity aggregate; null when no scored activities. */
  score_percent: number | null;
  /** Screen #9 — activity count (1 for legacy; N for learning_activities). */
  tasks_total?: number;
  tasks_completed?: number;
  /** Task completion for this assign (legacy 0/100; Multi-Activity completed/total). */
  completion_percent?: number | null;
  /** Assign-scoped accuracy (legacy quiz_results; Multi-Activity avg game/quiz/worksheet scores). */
  accuracy_percent?: number | null;
  /**
   * F-046E — Preformatted quiz attempt duration from Assignment Details API
   * (submitted_at - started_at). Null → UI shows N/A. Never computed in React.
   */
  duration?: string | null;
};

export type AssignmentDetailsResponse = {
  status?: boolean;
  class_id: number;
  source: string;
  assignment: AssignmentDetailsAssignment;
  statistics: AssignmentDetailsStatistics;
  students: AssignmentDetailsStudentRow[];
  materials: AssignmentDetailsMaterials;
};

export const normalizeClassAssignmentCard = (
  raw: Partial<ClassAssignmentListItem> & { assign_id?: number; type?: string }
): ClassAssignmentListItem | null => {
  const id = Number(raw.id ?? raw.assign_id ?? 0);
  if (!id) {
    return null;
  }

  const status = raw.status;
  if (status !== "active" && status !== "done" && status !== "overdue") {
    return null;
  }

  const assignmentType =
    raw.assignment_type === "quiz" || raw.type === "quiz" ? "quiz" : "assignment";

  return {
    id,
    title: String(raw.title ?? ""),
    subtitle: String(raw.subtitle ?? ""),
    assignment_type: assignmentType,
    status,
    due_at: raw.due_at ?? null,
    created_at: raw.created_at ?? null,
    created_by: Number(raw.created_by ?? 0),
    subject: raw.subject ?? null,
    module: String(raw.module ?? ""),
    target_students: Number(raw.target_students ?? 0),
    completed_students: Number(raw.completed_students ?? 0),
    pending_students: Number(raw.pending_students ?? 0),
    overdue_students: Number(raw.overdue_students ?? 0),
    completion_percentage: Number(raw.completion_percentage ?? 0),
    has_missing_students: Boolean(raw.has_missing_students),
    has_overdue_students: Boolean(raw.has_overdue_students),
    standards_count: Number(raw.standards_count ?? 0),
  };
};
