import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import { StudentProfileActivityItem } from "@/types/studentProfile";
import { useStudentAssignments } from "@/hooks/useStudentAssignments";
import { StudentProfileHighlight } from "@/utils/teacherAlertNavigation";
import StudentAssignmentsCard from "./StudentAssignmentsCard";
import StudentAssignmentsSkeleton from "./StudentAssignmentsSkeleton";

export type StudentAssignmentsWidgetProps = {
  classId: number;
  studentId: number;
  timeRange: ClassDetailsTimeRange;
  /** F-047 — from Alerts deep-link (e.g. overdue → Missing tab). */
  highlight?: StudentProfileHighlight;
};

/** Profile opened_at / completed / submitted = reviewable; pure pending/missing = not. */
const hasReviewableSubmission = (item: StudentProfileActivityItem): boolean => {
  if (item.status === "completed" || item.status_badge === "submitted") {
    return true;
  }
  if (item.opened_at) {
    return true;
  }
  if (item.score != null) {
    return true;
  }
  return false;
};

export const StudentAssignmentsWidget = ({
  classId,
  studentId,
  timeRange,
  highlight = null,
}: StudentAssignmentsWidgetProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useStudentAssignments({
    classId,
    studentId,
    range: timeRange,
  });

  const handleReview = (item: StudentProfileActivityItem) => {
    if (!hasReviewableSubmission(item)) {
      toast.info(t("TEACHER_STUDENT_PROFILE.NO_SUBMISSION_TO_REVIEW"));
      return;
    }

    const assignId = Number(item.assign_id);
    if (!classId || !assignId || !studentId) {
      toast.info(t("TEACHER_STUDENT_PROFILE.NO_SUBMISSION_TO_REVIEW"));
      return;
    }

    navigate(
      `/teacher/classes/${classId}/assignments/${assignId}?review=${studentId}`
    );
  };

  const handleReminder = (_item: StudentProfileActivityItem) => {
    toast.info(t("TEACHER_STUDENT_PROFILE.REMINDER_NOT_IMPLEMENTED"));
  };

  if (isLoading && !data) {
    return <StudentAssignmentsSkeleton />;
  }

  return (
    <StudentAssignmentsCard
      items={data?.items ?? []}
      isError={isError}
      errorMessage={error?.message ?? null}
      highlight={highlight}
      onReview={handleReview}
      onReminder={handleReminder}
      canReview={hasReviewableSubmission}
    />
  );
};

export default StudentAssignmentsWidget;
