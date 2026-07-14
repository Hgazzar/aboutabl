import { ClassDetailsTimeRange } from "@/types/classDetails";
import { useCompletionStatus } from "@/hooks/useCompletionStatus";
import CompletionStatusCard from "./CompletionStatusCard";

export type CompletionStatusWidgetProps = {
  classId: number;
  timeRange: ClassDetailsTimeRange;
};

/**
 * Container: fetches overview completion_status via useCompletionStatus; presentational render only.
 */
export const CompletionStatusWidget = ({
  classId,
  timeRange,
}: CompletionStatusWidgetProps) => {
  const { data, isLoading, isError, error } = useCompletionStatus({
    classId,
    range: timeRange,
  });

  return (
    <CompletionStatusCard
      byScope={data?.by_scope ?? null}
      isLoading={isLoading && !data}
      isError={isError}
      errorMessage={error?.message ?? null}
    />
  );
};

export default CompletionStatusWidget;
