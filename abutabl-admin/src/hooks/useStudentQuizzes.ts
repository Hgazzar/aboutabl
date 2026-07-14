import { useQuery } from "react-query";
import {
  studentQuizzesApi,
  studentQuizzesQueryKey,
  StudentQuizzesParams,
} from "@/api/studentQuizzesApi";
import { StudentProfileActivityList } from "@/types/studentProfile";
import { ClassDetailsTimeRange } from "@/types/classDetails";

export type UseStudentQuizzesArgs = {
  classId: number | null;
  studentId: number | null;
  range?: ClassDetailsTimeRange;
  page?: number;
  enabled?: boolean;
};

export const useStudentQuizzes = ({
  classId,
  studentId,
  range = "week",
  page = 1,
  enabled = true,
}: UseStudentQuizzesArgs) => {
  const safeClassId = classId ?? 0;
  const safeStudentId = studentId ?? 0;
  const params: StudentQuizzesParams = {
    range,
    quizzes_page: page,
  };

  return useQuery<StudentProfileActivityList, Error>(
    studentQuizzesQueryKey(safeClassId, safeStudentId, params),
    () => studentQuizzesApi.get(safeClassId, safeStudentId, params),
    {
      enabled: enabled && safeClassId > 0 && safeStudentId > 0,
      staleTime: 30_000,
      retry: 1,
    }
  );
};

export default useStudentQuizzes;
