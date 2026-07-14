import { ClassDetailsTimeRange } from "@/types/classDetails";
import { useStudentQuizzes } from "@/hooks/useStudentQuizzes";
import StudentQuizzesCard from "./StudentQuizzesCard";
import StudentQuizzesSkeleton from "./StudentQuizzesSkeleton";

export type StudentQuizzesWidgetProps = {
  classId: number;
  studentId: number;
  timeRange: ClassDetailsTimeRange;
};

export const StudentQuizzesWidget = ({
  classId,
  studentId,
  timeRange,
}: StudentQuizzesWidgetProps) => {
  const { data, isLoading, isError, error } = useStudentQuizzes({
    classId,
    studentId,
    range: timeRange,
  });

  if (isLoading && !data) {
    return <StudentQuizzesSkeleton />;
  }

  return (
    <StudentQuizzesCard
      items={data?.items ?? []}
      averagePercent={data?.average_percent ?? null}
      averageAvailable={Boolean(data?.average_available)}
      isError={isError}
      errorMessage={error?.message ?? null}
    />
  );
};

export default StudentQuizzesWidget;
