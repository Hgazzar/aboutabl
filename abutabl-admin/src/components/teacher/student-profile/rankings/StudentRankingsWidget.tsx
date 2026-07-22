import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { ClassDetailsTimeRange, toMetricTimeRange } from "@/types/classDetails";
import { StudentProfileRankingsScope } from "@/types/studentProfile";
import StudentRankingsCard from "@/components/teacher/student-profile/rankings/StudentRankingsCard";
import StudentRankingsSkeleton from "@/components/teacher/student-profile/rankings/StudentRankingsSkeleton";

export type StudentRankingsWidgetProps = {
  classId: number;
  studentId: number;
  timeRange: ClassDetailsTimeRange;
};

/** Top-N carousel size — sent as limit= to the profile API (not sliced in React). */
const RANKINGS_LIMIT = 10;

/**
 * Student Rankings — display-only.
 * Uses the same Student Profile endpoint via useStudentProfile (scope / search / limit).
 */
export const StudentRankingsWidget = ({
  classId,
  studentId,
  timeRange,
}: StudentRankingsWidgetProps) => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<StudentProfileRankingsScope>("class");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, error, isFetching } = useStudentProfile({
    classId,
    studentId,
    params: {
      range: toMetricTimeRange(timeRange),
      scope,
      search: search || undefined,
      limit: RANKINGS_LIMIT,
    },
    enabled: classId > 0 && studentId > 0,
  });

  if (isLoading && !data) {
    return <StudentRankingsSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-sm text-[#B91C1C]">
        {error?.message || t("TEACHER_STUDENT_PROFILE.RANKINGS_LOAD_ERROR")}
      </div>
    );
  }

  const rankings = data?.rankings;

  if (!rankings) {
    return <StudentRankingsSkeleton />;
  }

  return (
    <div className={isFetching && data ? "opacity-90" : undefined}>
      <StudentRankingsCard
        rankings={rankings}
        scope={scope}
        search={searchInput}
        onScopeChange={setScope}
        onSearchChange={setSearchInput}
      />
    </div>
  );
};

export default StudentRankingsWidget;
