import { getRequest } from "@/utils/fetchMethods";
import {
  StudentProfileQueryParams,
  StudentProfileRange,
  StudentProfileResponse,
} from "@/types/studentProfile";

const buildQuery = (params: StudentProfileQueryParams = {}): Record<string, string | number> => {
  const query: Record<string, string | number> = {
    range: params.range ?? "week",
  };

  if (params.subject) {
    query.subject = params.subject;
  }

  if (params.assignments_page && params.assignments_page > 1) {
    query.assignments_page = params.assignments_page;
  }

  if (params.quizzes_page && params.quizzes_page > 1) {
    query.quizzes_page = params.quizzes_page;
  }

  if (params.scope) {
    query.scope = params.scope;
  }

  if (params.search != null && params.search !== "") {
    query.search = params.search;
  }

  if (params.limit != null && params.limit > 0) {
    query.limit = params.limit;
  }

  return query;
};

export const studentProfileApi = {
  getProfile(
    classId: number,
    studentId: number,
    params: StudentProfileQueryParams = {}
  ): Promise<StudentProfileResponse> {
    return getRequest(
      buildQuery(params),
      `/api/dashboard/teacher/classes/${classId}/students/${studentId}/profile`
    ) as Promise<StudentProfileResponse>;
  },
};

export const studentProfileQueryKey = (
  classId: number,
  studentId: number,
  params: StudentProfileQueryParams = {}
) =>
  [
    "student-profile",
    classId,
    studentId,
    params.range ?? "week",
    params.subject ?? "letters-explorer",
    params.assignments_page ?? 1,
    params.quizzes_page ?? 1,
    params.scope ?? "class",
    params.search ?? "",
    params.limit ?? null,
  ] as const;

export type { StudentProfileRange };
