import { useQuery } from "react-query";
import {
  studentAssignmentsApi,
  studentAssignmentsQueryKey,
  StudentAssignmentsParams,
} from "@/api/studentAssignmentsApi";
import { StudentProfileActivityList } from "@/types/studentProfile";
import { ClassDetailsTimeRange } from "@/types/classDetails";

export type UseStudentAssignmentsArgs = {
  classId: number | null;
  studentId: number | null;
  range?: ClassDetailsTimeRange;
  page?: number;
  enabled?: boolean;
};

export const useStudentAssignments = ({
  classId,
  studentId,
  range = "week",
  page = 1,
  enabled = true,
}: UseStudentAssignmentsArgs) => {
  const safeClassId = classId ?? 0;
  const safeStudentId = studentId ?? 0;
  const params: StudentAssignmentsParams = {
    range,
    assignments_page: page,
  };

  return useQuery<StudentProfileActivityList, Error>(
    studentAssignmentsQueryKey(safeClassId, safeStudentId, params),
    () => studentAssignmentsApi.get(safeClassId, safeStudentId, params),
    {
      enabled: enabled && safeClassId > 0 && safeStudentId > 0,
      staleTime: 30_000,
      retry: 1,
    }
  );
};

export default useStudentAssignments;
