import {
  TeacherAlertItem,
  TeacherAlertType,
} from "@/types/teacherAlerts";

/**
 * F-047 — Extensible map: alert type → Student Profile focus target.
 * Add new alert types here without changing navigation callers.
 */
export type StudentProfileFocusSection =
  | "summary"
  | "assignments"
  | "quizzes"
  | "standards"
  | "smart_insight"
  | "evaluation"
  | "rankings";

export type StudentProfileHighlight = "overdue" | "missing" | null;

export type AlertProfileNavigation = {
  classId: number;
  studentId: number;
  focus: StudentProfileFocusSection;
  highlight: StudentProfileHighlight;
};

const ALERT_FOCUS_MAP: Record<
  TeacherAlertType,
  { focus: StudentProfileFocusSection; highlight: StudentProfileHighlight }
> = {
  overdue_assignments: { focus: "assignments", highlight: "overdue" },
  low_performance: { focus: "summary", highlight: null },
};

export const resolveAlertProfileNavigation = (
  alert: TeacherAlertItem
): AlertProfileNavigation => {
  const mapped = ALERT_FOCUS_MAP[alert.alert.type] ?? {
    focus: "summary" as const,
    highlight: null,
  };

  return {
    classId: Number(alert.class.id),
    studentId: Number(alert.student_id),
    focus: mapped.focus,
    highlight: mapped.highlight,
  };
};

/** Build path to existing Students tab Student Profile (no new page). */
export const buildStudentProfilePath = (
  nav: AlertProfileNavigation
): string => {
  const params = new URLSearchParams();
  params.set("student", String(nav.studentId));
  params.set("focus", nav.focus);
  if (nav.highlight) {
    params.set("highlight", nav.highlight);
  }
  return `/teacher/classes/${nav.classId}/students?${params.toString()}`;
};

export const STUDENT_PROFILE_SECTION_ID = (
  section: StudentProfileFocusSection
): string => `student-profile-${section}`;
