import { ClassDetailsTimeRange } from "@/types/classDetails";
import { useClassesPerformance } from "@/hooks/useClassesPerformance";
import ClassesPerformanceCard from "./ClassesPerformanceCard";

export type ClassesPerformanceWidgetProps = {
  classId: number;
  timeRange: ClassDetailsTimeRange;
};

/**
 * Container: fetches Performance Analytics series via overview API; renders presentational card.
 */
export const ClassesPerformanceWidget = ({
  classId,
  timeRange,
}: ClassesPerformanceWidgetProps) => {
  const { data, isLoading, isError, error } = useClassesPerformance({
    classId,
    range: timeRange,
  });

  return (
    <ClassesPerformanceCard
      points={data?.points ?? []}
      isLoading={isLoading && !data}
      isError={isError}
      errorMessage={error?.message ?? null}
    />
  );
};

export default ClassesPerformanceWidget;
