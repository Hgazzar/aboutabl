import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TeacherAnalyticsChartCard,
  TeacherCompletionDonutChart,
} from "@/components/teacher/TeacherCompletionStatusChart";
import {
  ClassDetailsCompletionStatus,
  ClassDetailsCompletionStatusByScope,
  ClassDetailsPerformancePoint,
} from "@/types/classDetailsOverview";
import { CompletionScope } from "@/types/teacherAnalytics";

const CHART_COLORS = {
  classLine: "#059669",
  schoolLine: "#D4A843",
};

const EMPTY_COMPLETION: ClassDetailsCompletionStatusByScope = {
  all: { completed: 0, in_progress: 0, not_started: 0, total: 0 },
  assignments: { completed: 0, in_progress: 0, not_started: 0, total: 0 },
  quizzes: { completed: 0, in_progress: 0, not_started: 0, total: 0 },
};

const chartCardClass =
  "flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]";

export type ClassOverviewChartsSectionProps = {
  performanceLine: ClassDetailsPerformancePoint[];
  completionStatus?: ClassDetailsCompletionStatusByScope | ClassDetailsCompletionStatus;
};

const normalizePerformanceLine = (points: ClassDetailsPerformancePoint[]) =>
  points.map((point) => ({
    label: point.label,
    class: Number(point.class_percent ?? 0),
    school: Number(point.school_percent ?? 0),
  }));

const normalizeCompletionStatus = (
  status?: ClassDetailsCompletionStatusByScope | ClassDetailsCompletionStatus
): Record<CompletionScope, ClassDetailsCompletionStatus> => {
  if (!status) {
    return EMPTY_COMPLETION;
  }

  if ("all" in status) {
    return status;
  }

  return {
    all: status,
    assignments: status,
    quizzes: status,
  };
};

const PerformanceLineCard = ({
  data,
}: {
  data: ReturnType<typeof normalizePerformanceLine>;
}) => {
  const { t } = useTranslation();

  return (
    <article className={chartCardClass}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111827] md:text-[1.0625rem]">
            {t("TEACHER_CLASS_DETAILS.PERFORMANCE_CHART")}
          </h2>
          <p className="mt-1 text-sm font-medium text-[#059669]">
            {t("TEACHER_CLASS_DETAILS.PERFORMANCE_CHART_SUBTITLE")}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4 pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS.classLine }}
            />
            <span className="text-sm font-medium text-[#374151]">
              {t("TEACHER_CLASS_DETAILS.LEGEND_CLASS")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS.schoolLine }}
            />
            <span className="text-sm font-medium text-[#374151]">
              {t("TEACHER_CLASS_DETAILS.LEGEND_SCHOOL")}
            </span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#6B7280]">
          {t("TEACHER_CLASS_DETAILS.EMPTY_COMPLETION")}
        </p>
      ) : (
        <div className="min-h-[260px] flex-1">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === "class"
                    ? t("TEACHER_CLASS_DETAILS.LEGEND_CLASS")
                    : t("TEACHER_CLASS_DETAILS.LEGEND_SCHOOL"),
                ]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                }}
              />
              <Line
                type="monotone"
                dataKey="class"
                name={t("TEACHER_CLASS_DETAILS.LEGEND_CLASS")}
                stroke={CHART_COLORS.classLine}
                strokeWidth={2.5}
                dot={{ r: 4, fill: CHART_COLORS.classLine, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="school"
                name={t("TEACHER_CLASS_DETAILS.LEGEND_SCHOOL")}
                stroke={CHART_COLORS.schoolLine}
                strokeWidth={2.5}
                dot={{ r: 4, fill: CHART_COLORS.schoolLine, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
};

export const ClassOverviewChartsSection = ({
  performanceLine,
  completionStatus,
}: ClassOverviewChartsSectionProps) => {
  const { t } = useTranslation();
  const performanceData = useMemo(
    () => normalizePerformanceLine(performanceLine),
    [performanceLine]
  );
  const scopedCompletion = useMemo(
    () => normalizeCompletionStatus(completionStatus),
    [completionStatus]
  );

  return (
    <section className="bg-[#F7F9FA] px-6 pb-0 pt-1 md:px-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <PerformanceLineCard data={performanceData} />
        <TeacherAnalyticsChartCard title={t("TEACHER_ANALYTICS.COMPLETION_STATUS")}>
          <TeacherCompletionDonutChart completionStatus={scopedCompletion} />
        </TeacherAnalyticsChartCard>
      </div>
    </section>
  );
};

export default ClassOverviewChartsSection;
