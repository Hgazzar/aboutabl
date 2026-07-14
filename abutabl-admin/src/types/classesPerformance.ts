import { ClassDetailsTimeRange } from "@/types/classDetails";

/**
 * Point from charts.performance_line — fields kept as returned by the overview API.
 * Mapping for display labels only: class_percent → Class, school_percent → All Classes.
 */
export type ClassesPerformancePoint = {
  label: string;
  class_percent: number;
  school_percent: number;
};

export type ClassesPerformanceQueryParams = {
  range?: ClassDetailsTimeRange;
};

export type ClassesPerformanceSeriesResponse = {
  status: boolean;
  range: ClassDetailsTimeRange;
  class_id: number;
  points: ClassesPerformancePoint[];
};
