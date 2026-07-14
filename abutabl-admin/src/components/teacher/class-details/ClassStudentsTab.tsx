import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import {
  EMPTY_PAGINATION,
  StudentProfileResponse,
} from "@/types/studentProfile";
import { EMPTY_CLASS_LEARNING_PROGRESS } from "@/types/classDetailsOverview";
import StudentSelectorToolbar from "@/components/teacher/student-profile/StudentSelectorToolbar";
import StudentSummaryBanner from "@/components/teacher/student-profile/StudentSummaryBanner";
import SummaryCards from "@/components/teacher/student-profile/SummaryCards";
import LearningProgress from "@/components/teacher/student-profile/LearningProgress";
import StudentActivitiesGrid from "@/components/teacher/student-profile/StudentActivitiesGrid";
import StudentAssignmentsWidget from "@/components/teacher/student-profile/assignments/StudentAssignmentsWidget";
import StudentQuizzesWidget from "@/components/teacher/student-profile/quizzes/StudentQuizzesWidget";
import StudentStandardsInsightsGrid from "@/components/teacher/student-profile/StudentStandardsInsightsGrid";
import StandardsCard from "@/components/teacher/student-profile/StandardsCard";
import SmartInsightPlaceholder from "@/components/teacher/student-profile/SmartInsightPlaceholder";
import TeacherEvaluationPlaceholder from "@/components/teacher/student-profile/TeacherEvaluationPlaceholder";
import StudentRankingsWidget from "@/components/teacher/student-profile/rankings/StudentRankingsWidget";
import StudentProfileSkeleton from "@/components/teacher/student-profile/StudentProfileSkeleton";
import ClassesPerformanceWidget from "@/components/teacher/class-details/classes-performance/ClassesPerformanceWidget";
import CompletionStatusWidget from "@/components/teacher/class-details/completion-status/CompletionStatusWidget";
import ClassChartsGrid from "@/components/teacher/class-details/ClassChartsGrid";
import { getRequest } from "@/utils/fetchMethods";
import { ClassStudentsOverviewResponse } from "@/types/classStudentsOverview";

export type ClassStudentsTabProps = {
  classId: number;
  timeRange: ClassDetailsTimeRange;
  selectedStudentId: number | null;
  onSelectStudent: (studentId: number) => void;
};

const emptyProfile = (classId: number): StudentProfileResponse => ({
  status: true,
  source: "composed_student_profile",
  range: "week",
  class_id: classId,
  student: {
    student_id: 0,
    name: "",
    photo_url: null,
    avatar: null,
    class_label: "",
    grade_label: "",
    rank: 0,
    performance_percent: 0,
    score_percent: 0,
    status: "no_data",
    performance_label: "",
    trend: "stable",
    needs_attention: false,
    overdue_count: 0,
  },
  analytics: {
    available: false,
    series: [],
    summary: {
      performance_percent: 0,
      delta_percent: null,
      completion_percent: 0,
      attendance_percent: null,
      attendance_available: false,
    },
  },
  completion: {
    completed: 0,
    missing: 0,
    total: 0,
    percent: 0,
    score_percent: 0,
  },
  learning_progress: { ...EMPTY_CLASS_LEARNING_PROGRESS },
  activities: {
    assignments: { items: [], pagination: { ...EMPTY_PAGINATION } },
    quizzes: { items: [], pagination: { ...EMPTY_PAGINATION } },
  },
  standards: {
    available: false,
    tabs: [],
    selected: null,
    items: [],
  },
  teacher_evaluation: {
    available: false,
    notes: [],
    latest_feedback: null,
    recommendations: [],
    smart_insight: {
      available: false,
      text: null,
      generated_at: null,
    },
  },
  rankings: {
    available: false,
    scope: "class",
    class_rank: null,
    all_classes_rank: null,
    all_classes_available: false,
    school_rank: null,
    school_available: false,
    items: [],
  },
});

export const ClassStudentsTab = ({
  classId,
  timeRange,
  selectedStudentId,
  onSelectStudent,
}: ClassStudentsTabProps) => {
  const { t } = useTranslation();
  const [subjectSlug, setSubjectSlug] = useState("letters-explorer");

  useEffect(() => {
    if (selectedStudentId != null) {
      return;
    }

    let cancelled = false;

    const bootstrapFirstStudent = async () => {
      try {
        const response = (await getRequest(
          { range: timeRange, sort: "rank", order: "asc" },
          `/api/dashboard/teacher/classes/${classId}/students-overview`
        )) as ClassStudentsOverviewResponse;

        if (cancelled) {
          return;
        }

        const firstId = response?.items?.[0]?.student_id;
        if (firstId) {
          onSelectStudent(firstId);
        }
      } catch {
        // Empty state handled below when no student is selected.
      }
    };

    bootstrapFirstStudent();

    return () => {
      cancelled = true;
    };
  }, [classId, onSelectStudent, selectedStudentId, timeRange]);

  const { data, isLoading, isError, error } = useStudentProfile({
    classId,
    studentId: selectedStudentId,
    params: { range: timeRange, subject: subjectSlug },
    enabled: selectedStudentId != null,
  });

  const profile = data ?? emptyProfile(classId);

  const classmates = useMemo(
    () =>
      (profile.rankings.items ?? []).map((item) => ({
        student_id: item.student_id,
        name: item.name,
        photo_url: item.photo_url,
      })),
    [profile.rankings.items]
  );

  if (selectedStudentId == null) {
    return (
      <div className="px-6 py-10 md:px-8">
        <p className="text-center text-sm text-[#6B7280]">
          {t("TEACHER_STUDENT_PROFILE.SELECT_STUDENT_HINT")}
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return <StudentProfileSkeleton />;
  }

  if (isError) {
    return (
      <div className="px-6 py-8 md:px-8">
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-sm text-[#B91C1C]">
          {error?.message || t("TEACHER_STUDENT_PROFILE.LOAD_ERROR")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 pb-8 pt-6 md:px-8">
      <StudentSelectorToolbar
        student={profile.student}
        classmates={classmates}
        onSelectStudent={onSelectStudent}
      />

      <StudentSummaryBanner
        student={profile.student}
        schoolRank={profile.rankings.school_rank}
        schoolAvailable={profile.rankings.school_available}
      />

      <SummaryCards
        student={profile.student}
        analytics={profile.analytics}
        completion={profile.completion}
      />

      <ClassChartsGrid
        left={
          <ClassesPerformanceWidget classId={classId} timeRange={timeRange} />
        }
        right={
          <CompletionStatusWidget classId={classId} timeRange={timeRange} />
        }
      />

      <LearningProgress learningProgress={profile.learning_progress} />

      <StudentActivitiesGrid
        left={
          <StudentAssignmentsWidget
            classId={classId}
            studentId={selectedStudentId}
            timeRange={timeRange}
          />
        }
        right={
          <StudentQuizzesWidget
            classId={classId}
            studentId={selectedStudentId}
            timeRange={timeRange}
          />
        }
      />

      <StudentStandardsInsightsGrid
        left={
          <StandardsCard
            standards={profile.standards}
            onSubjectChange={setSubjectSlug}
          />
        }
        right={<SmartInsightPlaceholder />}
      />

      <TeacherEvaluationPlaceholder />

      <StudentRankingsWidget
        classId={classId}
        studentId={selectedStudentId}
        timeRange={timeRange}
      />
    </div>
  );
};

export default ClassStudentsTab;
