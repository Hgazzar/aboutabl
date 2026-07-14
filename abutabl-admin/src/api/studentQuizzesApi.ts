import { getRequest } from "@/utils/fetchMethods";
import {
  StudentProfileActivityList,
  StudentProfileQueryParams,
  StudentProfileResponse,
} from "@/types/studentProfile";
import { ClassDetailsTimeRange } from "@/types/classDetails";

export type StudentQuizzesParams = {
  range?: ClassDetailsTimeRange;
  quizzes_page?: number;
};

/**
 * Slice activities.quizzes from Student Profile endpoint (SSOT).
 */
export const studentQuizzesApi = {
  async get(
    classId: number,
    studentId: number,
    params: StudentQuizzesParams = {}
  ): Promise<StudentProfileActivityList> {
    const query: StudentProfileQueryParams = {
      range: params.range ?? "week",
      quizzes_page: params.quizzes_page,
    };

    const profile = (await getRequest(
      {
        range: query.range,
        ...(query.quizzes_page && query.quizzes_page > 1
          ? { quizzes_page: query.quizzes_page }
          : {}),
      },
      `/api/dashboard/teacher/classes/${classId}/students/${studentId}/profile`
    )) as StudentProfileResponse;

    return (
      profile?.activities?.quizzes ?? {
        items: [],
        pagination: {
          current_page: 1,
          per_page: 10,
          last_page: 1,
          total: 0,
          has_more: false,
        },
        average_percent: null,
        average_available: false,
      }
    );
  },
};

export const studentQuizzesQueryKey = (
  classId: number,
  studentId: number,
  params: StudentQuizzesParams = {}
) =>
  [
    "student-quizzes",
    classId,
    studentId,
    params.range ?? "week",
    params.quizzes_page ?? 1,
  ] as const;
