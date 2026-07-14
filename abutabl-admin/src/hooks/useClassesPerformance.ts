import { useQuery } from "react-query";
import {
  classesPerformanceApi,
  classesPerformanceQueryKey,
} from "@/api/classesPerformanceApi";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import { ClassesPerformanceSeriesResponse } from "@/types/classesPerformance";

export type UseClassesPerformanceArgs = {
  classId: number | null;
  range?: ClassDetailsTimeRange;
  enabled?: boolean;
};

export const useClassesPerformance = ({
  classId,
  range = "week",
  enabled = true,
}: UseClassesPerformanceArgs) => {
  const safeClassId = classId ?? 0;

  return useQuery<ClassesPerformanceSeriesResponse, Error>(
    classesPerformanceQueryKey(safeClassId, { range }),
    () => classesPerformanceApi.getSeries(safeClassId, { range }),
    {
      enabled: enabled && safeClassId > 0,
      // Do not keepPreviousData: avoids showing another range as a FE fallback.
      staleTime: 30_000,
      retry: 1,
    }
  );
};

export default useClassesPerformance;
