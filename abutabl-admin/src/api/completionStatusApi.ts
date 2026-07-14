import { getRequest } from "@/utils/fetchMethods";
import { ClassDetailsOverviewResponse } from "@/types/classDetailsOverview";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import {
  CompletionStatusByScope,
  CompletionStatusQueryParams,
  CompletionStatusResponse,
} from "@/types/completionStatus";

const buildQuery = (
  params: CompletionStatusQueryParams = {}
): Record<string, string> => ({
  range: params.range ?? "week",
});

/**
 * Reads charts.completion_status from class overview as-is.
 * Frontend display only — no recalculation or invented breakdowns.
 */
export const completionStatusApi = {
  async getStatus(
    classId: number,
    params: CompletionStatusQueryParams = {}
  ): Promise<CompletionStatusResponse> {
    const range = (params.range ?? "week") as ClassDetailsTimeRange;
    const overview = (await getRequest(
      buildQuery(params),
      `/api/dashboard/teacher/classes/${classId}/overview`
    )) as ClassDetailsOverviewResponse;

    const raw = overview?.charts?.completion_status;
    const by_scope: CompletionStatusByScope | null =
      raw && typeof raw === "object" ? (raw as CompletionStatusByScope) : null;

    return {
      status: overview?.status,
      range: (overview?.range as ClassDetailsTimeRange) ?? range,
      class_id: overview?.class?.class_id ?? classId,
      by_scope,
    };
  },
};

export const completionStatusQueryKey = (
  classId: number,
  params: CompletionStatusQueryParams = {}
) => ["completion-status", classId, params.range ?? "week"] as const;
