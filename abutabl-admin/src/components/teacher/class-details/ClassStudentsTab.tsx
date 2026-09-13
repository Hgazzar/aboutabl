import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { ClassDetailsTimeRange, toMetricTimeRange } from "@/types/classDetails";
import {
  EMPTY_PAGINATION,
  StudentProfileResponse,
} from "@/types/studentProfile";
import { EMPTY_CLASS_LEARNING_PROGRESS } from "@/types/classDetailsOverview";
import StudentSelectorToolbar from "@/components/teacher/student-profile/StudentSelectorToolbar";
import StudentSummaryBanner from "@/components/teacher/student-profile/StudentSummaryBanner";
import SummaryCards from "@/components/teacher/student-profile/SummaryCards";
import StudentActivitiesGrid from "@/components/teacher/student-profile/StudentActivitiesGrid";
import StudentAssignmentsWidget from "@/components/teacher/student-profile/assignments/StudentAssignmentsWidget";
import StudentQuizzesWidget from "@/components/teacher/student-profile/quizzes/StudentQuizzesWidget";
import StudentStandardsInsightsGrid from "@/components/teacher/student-profile/StudentStandardsInsightsGrid";
import StandardsCard from "@/components/teacher/student-profile/StandardsCard";
import SmartInsightCard from "@/components/teacher/student-profile/SmartInsightCard";
import TeacherEvaluationCard from "@/components/teacher/student-profile/TeacherEvaluationCard";
import StudentRankingsWidget from "@/components/teacher/student-profile/rankings/StudentRankingsWidget";
import StudentProfileSkeleton from "@/components/teacher/student-profile/StudentProfileSkeleton";
import ClassesPerformanceWidget from "@/components/teacher/class-details/classes-performance/ClassesPerformanceWidget";
import CompletionStatusWidget from "@/components/teacher/class-details/completion-status/CompletionStatusWidget";
import ClassChartsGrid from "@/components/teacher/class-details/ClassChartsGrid";
import LearningProgressCard from "@/components/teacher/shared/LearningProgressCard";
import { getRequest } from "@/utils/fetchMethods";
import { ClassStudentsOverviewResponse } from "@/types/classStudentsOverview";
import {
  STUDENT_PROFILE_SECTION_ID,
  StudentProfileFocusSection,
  StudentProfileHighlight,
} from "@/utils/teacherAlertNavigation";

export type ClassStudentsTabProps = {
  classId: number;
  timeRange: ClassDetailsTimeRange;
  selectedStudentId: number | null;
  onSelectStudent: (studentId: number) => void;
  /** F-047 — deep-link focus from Alerts (existing profile only). */
  profileFocus?: StudentProfileFocusSection | null;
  profileHighlight?: StudentProfileHighlight;
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
    accuracy_percent: 0,
    accuracy_available: false,
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
      insights: [],
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
  profileFocus = null,
  profileHighlight = null,
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

  const { data, isError, error, refetch, isFetching } = useStudentProfile({
    classId,
    studentId: selectedStudentId,
    params: { range: toMetricTimeRange(timeRange), subject: subjectSlug },
    enabled: selectedStudentId != null,
  });

  // selectedStudentId is source of truth — never paint keepPreviousData from another student.
  const isProfileForSelectedStudent =
    selectedStudentId != null &&
    data != null &&
    Number(data.student?.student_id) === Number(selectedStudentId);

  const profile = isProfileForSelectedStudent ? data : emptyProfile(classId);

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

  if (isError && !isProfileForSelectedStudent) {
    return (
      <div className="px-6 py-8 md:px-8">
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-sm text-[#B91C1C]">
          {error?.message || t("TEACHER_STUDENT_PROFILE.LOAD_ERROR")}
        </div>
      </div>
    );
  }

  if (!isProfileForSelectedStudent) {
    return <StudentProfileSkeleton />;
  }

  // F-047 — scroll to focused section after profile paint
  // (effect lives below early returns via dedicated component call site — run here)
  return (
    <ClassStudentsTabContent
      classId={classId}
      timeRange={timeRange}
      selectedStudentId={selectedStudentId}
      onSelectStudent={onSelectStudent}
      profile={profile}
      setSubjectSlug={setSubjectSlug}
      classmates={classmates}
      isFetching={isFetching}
      isError={isError}
      errorMessage={error?.message}
      refetch={refetch}
      profileFocus={profileFocus}
      profileHighlight={profileHighlight}
    />
  );
};

type ClassStudentsTabContentProps = {
  classId: number;
  timeRange: ClassDetailsTimeRange;
  selectedStudentId: number;
  onSelectStudent: (studentId: number) => void;
  profile: StudentProfileResponse;
  setSubjectSlug: (slug: string) => void;
  classmates: Array<{
    student_id: number;
    name: string;
    photo_url: string | null;
  }>;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  refetch: () => Promise<unknown> | void;
  profileFocus: StudentProfileFocusSection | null;
  profileHighlight: StudentProfileHighlight;
};

const ClassStudentsTabContent = ({
  classId,
  timeRange,
  selectedStudentId,
  onSelectStudent,
  profile,
  setSubjectSlug,
  classmates,
  isFetching,
  isError,
  errorMessage,
  refetch,
  profileFocus,
  profileHighlight,
}: ClassStudentsTabContentProps) => {
  useEffect(() => {
    if (!profileFocus) {
      return;
    }
    const timer = window.setTimeout(() => {
      const el = document.getElementById(
        STUDENT_PROFILE_SECTION_ID(profileFocus)
      );
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [profileFocus, selectedStudentId]);

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

      <div
        id={STUDENT_PROFILE_SECTION_ID("summary")}
        className="scroll-mt-24"
      >
        <SummaryCards
          student={profile.student}
          analytics={profile.analytics}
          completion={profile.completion}
        />
      </div>

      <ClassChartsGrid
        left={
          <ClassesPerformanceWidget classId={classId} timeRange={timeRange} />
        }
        right={
          <CompletionStatusWidget classId={classId} timeRange={timeRange} />
        }
      />

      <StudentActivitiesGrid
        left={
          <div
            id={STUDENT_PROFILE_SECTION_ID("assignments")}
            className={`h-full scroll-mt-24 rounded-2xl transition-shadow ${
              profileFocus === "assignments"
                ? "ring-2 ring-[#23B8A2] ring-offset-2"
                : ""
            }`}
          >
            <StudentAssignmentsWidget
              classId={classId}
              studentId={selectedStudentId}
              timeRange={timeRange}
              highlight={
                profileFocus === "assignments" ? profileHighlight : null
              }
            />
          </div>
        }
        right={
          <div
            id={STUDENT_PROFILE_SECTION_ID("quizzes")}
            className="h-full scroll-mt-24"
          >
            <StudentQuizzesWidget
              classId={classId}
              studentId={selectedStudentId}
              timeRange={timeRange}
            />
          </div>
        }
      />

      <div
        id={STUDENT_PROFILE_SECTION_ID("standards")}
        className="scroll-mt-24"
      >
        <StudentStandardsInsightsGrid
          left={
            <StandardsCard
              standards={profile.standards}
              onSubjectChange={setSubjectSlug}
            />
          }
          right={
            <LearningProgressCard
              data={profile.learning_progress}
              fillHeight
            />
          }
        />
      </div>

      <section
        id={STUDENT_PROFILE_SECTION_ID("smart_insight")}
        className="w-full scroll-mt-24"
        data-testid="student-smart-insight"
      >
        <SmartInsightCard
          key={`smart-insight-${selectedStudentId}`}
          smartInsight={profile.teacher_evaluation.smart_insight}
          isLoading={isFetching}
          isError={isError}
          errorMessage={errorMessage}
        />
      </section>

      <div
        id={STUDENT_PROFILE_SECTION_ID("evaluation")}
        className="scroll-mt-24"
      >
        <TeacherEvaluationCard
          key={`teacher-eval-${selectedStudentId}`}
          classId={classId}
          studentId={selectedStudentId}
          evaluation={profile.teacher_evaluation}
          onMutated={() => refetch()}
        />
      </div>

      <div
        id={STUDENT_PROFILE_SECTION_ID("rankings")}
        className="scroll-mt-24"
      >
        <StudentRankingsWidget
          classId={classId}
          studentId={selectedStudentId}
          timeRange={timeRange}
        />
      </div>
    </div>
  );
};

export default ClassStudentsTab;
