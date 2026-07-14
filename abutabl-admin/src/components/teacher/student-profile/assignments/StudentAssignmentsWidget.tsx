import { ClassDetailsTimeRange } from "@/types/classDetails";
import { useStudentAssignments } from "@/hooks/useStudentAssignments";
import StudentAssignmentsCard from "./StudentAssignmentsCard";
import StudentAssignmentsSkeleton from "./StudentAssignmentsSkeleton";

export type StudentAssignmentsWidgetProps = {
  classId: number;
  studentId: number;
  timeRange: ClassDetailsTimeRange;
};

export const StudentAssignmentsWidget = ({
  classId,
  studentId,
  timeRange,
}: StudentAssignmentsWidgetProps) => {
  const { data, isLoading, isError, error } = useStudentAssignments({
    classId,
    studentId,
    range: timeRange,
  });

  if (isLoading && !data) {
    return <StudentAssignmentsSkeleton />;
  }

  return (
    <StudentAssignmentsCard
      items={data?.items ?? []}
      isError={isError}
      errorMessage={error?.message ?? null}
    />
  );
};

export default StudentAssignmentsWidget;
