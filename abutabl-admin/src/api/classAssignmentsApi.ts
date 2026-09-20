import { getRequest, postRequest, putRequest } from "@/utils/fetchMethods";
import { AssignmentDetailsResponse } from "@/types/classAssignments";

export type AssignModuleType =
  | "subjects"
  | "units"
  | "lessons"
  | "lessons_contents"
  | "quizes"
  | "games";

export type LearningActivityType = "ebook" | "game" | "worksheet" | "quiz";

export type LearningActivitySelection = {
  activity_type: LearningActivityType;
  activity_id: number;
  title: string;
  grading_mode?: string;
  subject_id?: number;
};

export type LearningActivityBook = {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
};

export type LearningActivitySection = {
  key: string;
  activity_type: LearningActivityType;
  label: string;
  subject_id: number;
  count: number;
};

export type LearningActivityItem = {
  activity_type: LearningActivityType;
  activity_id: number;
  source_table: string;
  grading_mode: string;
  title: string;
  subject_id: number;
  content_type?: string | null;
};

export type AssignModuleOption = {
  id: number;
  name: string;
};

/** @deprecated Prefer Learning Activities store payload. */
export type CreateAssignmentPayload = {
  school_id: number;
  type: AssignModuleType;
  type_id: number;
  due_at: string;
  class_id?: number[];
  student_id?: number[];
  teacher_id?: number;
};

export type CreateLearningActivitiesAssignmentPayload = {
  school_id: number;
  title?: string;
  subject_id?: number;
  due_at: string;
  class_id?: number[];
  student_id?: number[];
  teacher_id?: number;
  activities: Array<{
    activity_type: LearningActivityType;
    activity_id: number;
  }>;
};

type ModuleDataResponse = {
  status?: boolean;
  data?: AssignModuleOption[];
};

type StoreAssignResponse = {
  status?: boolean;
  msg?: string;
  data?: {
    assign_id?: number;
    type?: string;
    activities_count?: number;
  };
};

type DataListResponse<T> = {
  status?: boolean;
  data?: T[];
};

export const fetchAssignModuleOptions = async (
  schoolId: number,
  type: AssignModuleType
): Promise<AssignModuleOption[]> => {
  const response = (await getRequest(
    { school_id: schoolId, type },
    "/api/assigns/get_module_data"
  )) as ModuleDataResponse;

  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows
    .map((row) => ({
      id: Number(row.id),
      name: String(row.name ?? ""),
    }))
    .filter((row) => row.id > 0);
};

export const fetchLearningActivityBooks = async (
  schoolId: number
): Promise<LearningActivityBook[]> => {
  const response = (await getRequest(
    { school_id: schoolId },
    "/api/assigns/learning_activities/books"
  )) as DataListResponse<LearningActivityBook>;

  return Array.isArray(response?.data) ? response.data : [];
};

export const fetchLearningActivitySections = async (
  schoolId: number,
  subjectId: number
): Promise<LearningActivitySection[]> => {
  const response = (await getRequest(
    { school_id: schoolId, subject_id: subjectId },
    "/api/assigns/learning_activities/sections"
  )) as DataListResponse<LearningActivitySection>;

  return Array.isArray(response?.data) ? response.data : [];
};

export const fetchLearningActivityItems = async (
  schoolId: number,
  subjectId: number,
  section: string
): Promise<LearningActivityItem[]> => {
  const response = (await getRequest(
    { school_id: schoolId, subject_id: subjectId, section },
    "/api/assigns/learning_activities/activities"
  )) as DataListResponse<LearningActivityItem>;

  return Array.isArray(response?.data) ? response.data : [];
};

export const storeAssignment = async (
  payload: CreateAssignmentPayload
): Promise<StoreAssignResponse> => {
  return postRequest(payload, "/api/assigns/store") as Promise<StoreAssignResponse>;
};

export const storeLearningActivitiesAssignment = async (
  payload: CreateLearningActivitiesAssignmentPayload
): Promise<StoreAssignResponse> => {
  return postRequest(
    payload,
    "/api/assigns/store"
  ) as Promise<StoreAssignResponse>;
};

/** F-043 — Assignment Details (Screen #6). */
export const fetchAssignmentDetails = async (
  classId: number,
  assignmentId: number
): Promise<AssignmentDetailsResponse> => {
  return getRequest(
    {},
    `/api/dashboard/teacher/classes/${classId}/assignments/${assignmentId}`
  ) as Promise<AssignmentDetailsResponse>;
};

/** ASSIGN-EDIT-001 V1 — PUT /api/assigns/{assignId} (title only). */
export const updateAssignmentTitle = async (
  assignId: number,
  title: string
): Promise<{
  status?: boolean;
  msg?: string;
  data?: { assign_id?: number; title?: string };
}> => {
  return putRequest({ title }, `/api/assigns/${assignId}`) as Promise<{
    status?: boolean;
    msg?: string;
    data?: { assign_id?: number; title?: string };
  }>;
};

/** ASSIGN-EXTEND-001 — PUT /api/assigns/{assignId}/due_at (extend deadline). */
export const extendAssignmentDueAt = async (
  assignId: number,
  dueAtIso: string
): Promise<{
  status?: boolean;
  msg?: string;
  data?: { assign_id?: number; due_at?: string };
}> => {
  return putRequest({ due_at: dueAtIso }, `/api/assigns/${assignId}/due_at`) as Promise<{
    status?: boolean;
    msg?: string;
    data?: { assign_id?: number; due_at?: string };
  }>;
};

/** ASSIGN-REASSIGN-001 — POST /api/assigns/{assignId}/reassign */
export const reassignAssignment = async (
  assignId: number,
  studentIds: number[]
): Promise<{
  status?: boolean;
  msg?: string;
  data?: {
    assign_id?: number;
    reassigned_student_ids?: number[];
    notified?: number;
  };
}> => {
  return postRequest(
    { student_ids: studentIds },
    `/api/assigns/${assignId}/reassign`
  ) as Promise<{
    status?: boolean;
    msg?: string;
    data?: {
      assign_id?: number;
      reassigned_student_ids?: number[];
      notified?: number;
    };
  }>;
};

/** Remind missing students — POST .../assignments/{assignmentId}/remind-missing */
export const sendMissingAssignmentReminders = async (
  classId: number,
  assignmentId: number
): Promise<{ status?: boolean; data?: { sent?: number; student_ids?: number[] }; msg?: string }> => {
  return postRequest(
    {},
    `/api/dashboard/teacher/classes/${classId}/assignments/${assignmentId}/remind-missing`
  ) as Promise<{
    status?: boolean;
    data?: { sent?: number; student_ids?: number[] };
    msg?: string;
  }>;
};

/** Multi-Activity teacher review — GET /api/assigns/{assignId}/learning_activities/review */
export const fetchLearningActivitiesReview = async (
  assignId: number
): Promise<LearningActivitiesReviewPayload | null> => {
  const response = (await getRequest(
    {},
    `/api/assigns/${assignId}/learning_activities/review`
  )) as { status?: boolean; data?: LearningActivitiesReviewPayload };

  if (!response?.status || !response.data) {
    return null;
  }

  return response.data;
};

/** Worksheet (manual) grade — POST /api/assigns/learning_activities/{assignActivityId}/manual_grade */
export const submitLearningActivityManualGrade = async (
  assignActivityId: number,
  body: {
    student_id: number;
    score?: number;
    max_score?: number;
    percent?: number;
    feedback?: string;
  }
): Promise<{ status?: boolean; data?: unknown; msg?: string }> => {
  return postRequest(
    body,
    `/api/assigns/learning_activities/${assignActivityId}/manual_grade`
  ) as Promise<{ status?: boolean; data?: unknown; msg?: string }>;
};

/** Parent Assignment finalize/return — POST /api/assigns/{assignId}/students/{studentId}/finalize_parent */
export const finalizeParentAssignment = async (
  assignId: number,
  studentId: number
): Promise<{
  status?: boolean;
  data?: {
    assign_id: number;
    assign_student_id: number;
    student_id: number;
    submission_status: string;
    submitted_at: string | null;
    graded_at: string | null;
    lifecycle?: { mode: string; status: string };
    grade?: AssignmentGradePayload;
  };
  msg?: string;
}> => {
  return postRequest(
    {},
    `/api/assigns/${assignId}/students/${studentId}/finalize_parent`
  ) as Promise<{
    status?: boolean;
    data?: {
      assign_id: number;
      assign_student_id: number;
      student_id: number;
      submission_status: string;
      submitted_at: string | null;
      graded_at: string | null;
      lifecycle?: { mode: string; status: string };
      grade?: AssignmentGradePayload;
    };
    msg?: string;
  }>;
};

/** Backend VALID_POINTS for rubric criterion scores. */
export const ASSIGNMENT_RUBRIC_POINTS = [1, 2, 3, 4] as const;

export type AssignmentRubricCriterion = {
  id: number;
  label: string;
  weight: number;
  max_points: number;
  sort_order: number;
};

export type AssignmentRubricDefinition = {
  id: number;
  title: string;
  criteria: AssignmentRubricCriterion[];
};

/** GET/PUT /api/assigns/{assignId}/rubric — teacher payload */
export type AssignmentRubricPayload = {
  assign_id: number;
  possible_xp: number | null;
  rubric: AssignmentRubricDefinition | null;
  rubric_locked: boolean;
};

export type AssignmentGradeCriterionScore = {
  criterion_id: number;
  points: number;
};

export type AssignmentGradePayload = {
  id: number;
  assign_id: number;
  assign_student_id: number;
  status: "draft" | "finalized" | string;
  final_percent: number;
  possible_xp: number | null;
  earned_xp: number | null;
  badge: { key: string; label: string } | null;
  teacher_feedback: string | null;
  graded_by: number | null;
  teacher_id?: number | null;
  teacher_name?: string | null;
  teacher_photo_url?: string | null;
  finalized_at: string | null;
  criteria: AssignmentGradeCriterionScore[];
};

export type UpsertAssignmentRubricBody = {
  title?: string | null;
  criteria: Array<{ label: string; weight: number }>;
};

export type UpsertAssignmentGradeDraftBody = {
  criteria: Array<{ criterion_id: number; points: number }>;
  teacher_feedback?: string | null;
};

/** GET /api/assigns/{assignId}/rubric */
export const fetchAssignmentRubric = async (
  assignId: number
): Promise<AssignmentRubricPayload | null> => {
  const response = (await getRequest(
    {},
    `/api/assigns/${assignId}/rubric`
  )) as { status?: boolean; data?: AssignmentRubricPayload; msg?: string };

  if (!response?.status || !response.data) {
    return null;
  }

  return response.data;
};

/** PUT /api/assigns/{assignId}/rubric */
export const upsertAssignmentRubric = async (
  assignId: number,
  body: UpsertAssignmentRubricBody
): Promise<{
  status?: boolean;
  data?: AssignmentRubricPayload;
  msg?: string;
}> => {
  return putRequest(body, `/api/assigns/${assignId}/rubric`) as Promise<{
    status?: boolean;
    data?: AssignmentRubricPayload;
    msg?: string;
  }>;
};

/** GET /api/assigns/{assignId}/students/{studentId}/grade */
export const fetchAssignmentStudentGrade = async (
  assignId: number,
  studentId: number
): Promise<AssignmentGradePayload | null> => {
  const response = (await getRequest(
    {},
    `/api/assigns/${assignId}/students/${studentId}/grade`
  )) as {
    status?: boolean;
    data?: {
      assign_id: number;
      student_id: number;
      grade: AssignmentGradePayload | null;
    };
    msg?: string;
  };

  if (!response?.status || !response.data) {
    return null;
  }

  return response.data.grade ?? null;
};

/** PUT /api/assigns/{assignId}/students/{studentId}/grade */
export const upsertAssignmentStudentGrade = async (
  assignId: number,
  studentId: number,
  body: UpsertAssignmentGradeDraftBody
): Promise<{
  status?: boolean;
  data?: AssignmentGradePayload;
  msg?: string;
}> => {
  return putRequest(
    body,
    `/api/assigns/${assignId}/students/${studentId}/grade`
  ) as Promise<{
    status?: boolean;
    data?: AssignmentGradePayload;
    msg?: string;
  }>;
};

export const MAX_LEARNING_ACTIVITIES = 10;

export type LearningActivityReviewType =
  | "ebook"
  | "game"
  | "worksheet"
  | "quiz";

export type LearningActivityReviewSubmission = {
  id: number;
  status: string;
  score: number | null;
  max_score: number | null;
  percent: number | null;
  completeness: number | null;
  submitted_at: string | null;
  graded_at: string | null;
  teacher_feedback: string | null;
};

export type LearningActivityReviewRow = {
  assign_activity_id: number;
  assign_id: number;
  activity_type: LearningActivityReviewType | string;
  activity_id: number;
  source_table: string;
  grading_mode: string;
  title: string;
  sort_order: number;
  subject_id: number;
  path?: string | null;
  submission: LearningActivityReviewSubmission | null;
};

/** Student My Work item from learning_activities/review (Phase 3 backend). */
export type LearningActivitiesReviewMyWorkKind = "image" | "document" | "voice";

export type LearningActivitiesReviewMyWorkItem = {
  id: number;
  assign_id: number;
  assign_student_id: number;
  student_id: number;
  kind: LearningActivitiesReviewMyWorkKind | string;
  original_filename: string | null;
  url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  duration_ms: number | null;
  sort_order: number;
};

export type LearningActivitiesReviewStudent = {
  assign_student_id: number;
  student_id: number;
  opened_at: string | null;
  submission_status?: "active" | "submitted" | "graded" | string;
  submitted_at?: string | null;
  graded_at?: string | null;
  activities: LearningActivityReviewRow[];
  /** Optional student → teacher work; never an activity. */
  my_work?: LearningActivitiesReviewMyWorkItem[];
};

export type LearningActivitiesReviewPayload = {
  assign_id: number;
  title: string;
  type: string;
  due_at: string | null;
  activities: LearningActivityReviewRow[];
  students: LearningActivitiesReviewStudent[];
};

/** Serialized material row from GET/POST /api/assigns/{assignId}/materials */
export type AssignmentMaterialApiItem = {
  id: number;
  assign_id: number;
  kind: "file" | "voice" | "link" | string;
  label: string | null;
  url: string | null;
  original_filename?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  duration_ms?: number | null;
  sort_order?: number;
};

/** POST /api/assigns/{assignId}/materials — file upload */
export const storeAssignmentMaterialFile = async (
  assignId: number,
  file: File,
  label?: string | null
): Promise<{ status?: boolean; data?: AssignmentMaterialApiItem; msg?: string }> => {
  const body = new FormData();
  body.append("kind", "file");
  body.append("file", file);
  if (label && label.trim() !== "") {
    body.append("label", label.trim());
  }
  return postRequest(
    body,
    `/api/assigns/${assignId}/materials`
  ) as Promise<{ status?: boolean; data?: AssignmentMaterialApiItem; msg?: string }>;
};

/** POST /api/assigns/{assignId}/materials — voice upload */
export const storeAssignmentMaterialVoice = async (
  assignId: number,
  file: File,
  label?: string | null,
  durationMs?: number | null
): Promise<{ status?: boolean; data?: AssignmentMaterialApiItem; msg?: string }> => {
  const body = new FormData();
  body.append("kind", "voice");
  body.append("file", file);
  if (label && label.trim() !== "") {
    body.append("label", label.trim());
  }
  if (durationMs != null && Number.isFinite(durationMs) && durationMs > 0) {
    body.append("duration_ms", String(Math.round(durationMs)));
  }
  return postRequest(
    body,
    `/api/assigns/${assignId}/materials`
  ) as Promise<{ status?: boolean; data?: AssignmentMaterialApiItem; msg?: string }>;
};

/** POST /api/assigns/{assignId}/materials — external link */
export const storeAssignmentMaterialLink = async (
  assignId: number,
  url: string,
  label?: string | null
): Promise<{ status?: boolean; data?: AssignmentMaterialApiItem; msg?: string }> => {
  const body = new FormData();
  body.append("kind", "link");
  body.append("url", url.trim());
  if (label && label.trim() !== "") {
    body.append("label", label.trim());
  }
  return postRequest(
    body,
    `/api/assigns/${assignId}/materials`
  ) as Promise<{ status?: boolean; data?: AssignmentMaterialApiItem; msg?: string }>;
};
