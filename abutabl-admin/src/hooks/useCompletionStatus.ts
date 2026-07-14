import { useQuery } from "react-query";
import {
  completionStatusApi,
  completionStatusQueryKey,
} from "@/api/completionStatusApi";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import { CompletionStatusResponse } from "@/types/completionStatus";

export type UseCompletionStatusArgs = {
  classId: number | null;
  range?: ClassDetailsTimeRange;
  enabled?: boolean;
};

export const useCompletionStatus = ({
  classId,
  range = "week",
  enabled = true,
}: UseCompletionStatusArgs) => {
  const safeClassId = classId ?? 0;

  return useQuery<CompletionStatusResponse, Error>(
    completionStatusQueryKey(safeClassId, { range }),
    () => completionStatusApi.getStatus(safeClassId, { range }),
    {
      enabled: enabled && safeClassId > 0,
      staleTime: 30_000,
      retry: 1,
    }
  );
};

export default useCompletionStatus;
