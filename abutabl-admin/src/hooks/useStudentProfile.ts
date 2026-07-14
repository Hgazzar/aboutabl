import { useQuery } from "react-query";
import {
  studentProfileApi,
  studentProfileQueryKey,
} from "@/api/studentProfileApi";
import {
  StudentProfileQueryParams,
  StudentProfileResponse,
} from "@/types/studentProfile";

export type UseStudentProfileArgs = {
  classId: number | null;
  studentId: number | null;
  params?: StudentProfileQueryParams;
  enabled?: boolean;
};

export const useStudentProfile = ({
  classId,
  studentId,
  params = {},
  enabled = true,
}: UseStudentProfileArgs) => {
  const safeClassId = classId ?? 0;
  const safeStudentId = studentId ?? 0;

  return useQuery<StudentProfileResponse, Error>(
    studentProfileQueryKey(safeClassId, safeStudentId, params),
    () => studentProfileApi.getProfile(safeClassId, safeStudentId, params),
    {
      enabled: enabled && safeClassId > 0 && safeStudentId > 0,
      keepPreviousData: true,
      staleTime: 30_000,
      retry: 1,
    }
  );
};

export default useStudentProfile;
