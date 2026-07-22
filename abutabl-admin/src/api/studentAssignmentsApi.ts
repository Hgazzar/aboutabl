import { getRequest } from "@/utils/fetchMethods";
import {
  StudentProfileActivityList,
  StudentProfileQueryParams,
  StudentProfileResponse,
} from "@/types/studentProfile";
import { ClassDetailsTimeRange, toMetricTimeRange } from "@/types/classDetails";

export type StudentAssignmentsParams = {
  range?: ClassDetailsTimeRange;
  assignments_page?: number;
};

/**
 * Slice activities.assignments from Student Profile endpoint (SSOT).
 */
export const studentAssignmentsApi = {
  async get(
    classId: number,
    studentId: number,
    params: StudentAssignmentsParams = {}
  ): Promise<StudentProfileActivityList> {
    const query: StudentProfileQueryParams = {
      range: toMetricTimeRange(params.range),
      assignments_page: params.assignments_page,
    };

    const profile = (await getRequest(
      {
        range: query.range,
        ...(query.assignments_page && query.assignments_page > 1
          ? { assignments_page: query.assignments_page }
          : {}),
      },
      `/api/dashboard/teacher/classes/${classId}/students/${studentId}/profile`
    )) as StudentProfileResponse;

    return (
      profile?.activities?.assignments ?? {
        items: [],
        pagination: {
          current_page: 1,
          per_page: 10,
          last_page: 1,
          total: 0,
          has_more: false,
        },
      }
    );
  },
};

export const studentAssignmentsQueryKey = (
  classId: number,
  studentId: number,
  params: StudentAssignmentsParams = {}
) =>
  [
    "student-assignments",
    classId,
    studentId,
    params.range ?? "week",
    params.assignments_page ?? 1,
  ] as const;
