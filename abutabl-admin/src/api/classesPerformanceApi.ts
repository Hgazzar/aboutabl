import { getRequest } from "@/utils/fetchMethods";
import { ClassDetailsOverviewResponse } from "@/types/classDetailsOverview";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import {
  ClassesPerformancePoint,
  ClassesPerformanceQueryParams,
  ClassesPerformanceSeriesResponse,
} from "@/types/classesPerformance";

const buildQuery = (
  params: ClassesPerformanceQueryParams = {}
): Record<string, string> => ({
  range: params.range ?? "week",
});

/**
 * Reads charts.performance_line from class overview as-is.
 * No FE recalculation, defaults, or invented values for series points.
 */
export const classesPerformanceApi = {
  async getSeries(
    classId: number,
    params: ClassesPerformanceQueryParams = {}
  ): Promise<ClassesPerformanceSeriesResponse> {
    const range = (params.range ?? "week") as ClassDetailsTimeRange;
    const overview = (await getRequest(
      buildQuery(params),
      `/api/dashboard/teacher/classes/${classId}/overview`
    )) as ClassDetailsOverviewResponse;

    const rawLine = overview?.charts?.performance_line;
    const points: ClassesPerformancePoint[] = Array.isArray(rawLine)
      ? rawLine.map((point) => ({
          label: point.label,
          class_percent: point.class_percent,
          school_percent: point.school_percent,
        }))
      : [];

    return {
      status: overview?.status,
      range: (overview?.range as ClassDetailsTimeRange) ?? range,
      class_id: overview?.class?.class_id ?? classId,
      points,
    };
  },
};

export const classesPerformanceQueryKey = (
  classId: number,
  params: ClassesPerformanceQueryParams = {}
) => ["classes-performance", classId, params.range ?? "week"] as const;
