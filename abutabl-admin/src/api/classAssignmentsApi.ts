import { getRequest, postRequest } from "@/utils/fetchMethods";
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
    };
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
