import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CompletionBreakdown } from "@/types/teacherAnalytics";
import { COMPLETION_STATUS_COLORS } from "./completionStatusTheme";

export type CompletionStatusDonutProps = {
  breakdown: CompletionBreakdown;
};

/**
 * Presentational — layout/sizing matched to Overview TeacherCompletionDonutChart.
 * Displays API percent fields as-is (no FE percentage math).
 */
export const CompletionStatusDonut = ({ breakdown }: CompletionStatusDonutProps) => {
  const { t } = useTranslation();

  const hasData =
    breakdown.total > 0 ||
    breakdown.completed > 0 ||
    breakdown.in_progress > 0 ||
    breakdown.not_started > 0;

  if (!hasData) {
    return (
      <p className="py-16 text-center text-sm text-[#6B7280]">
        {t("TEACHER_CLASS_DETAILS.EMPTY_COMPLETION")}
      </p>
    );
  }

  const legendItems = [
    {
      key: "completed",
      color: COMPLETION_STATUS_COLORS.completed,
      label: t("TEACHER_CLASS_DETAILS.COMPLETED"),
      value: breakdown.completed,
    },
    {
      key: "in_progress",
      color: COMPLETION_STATUS_COLORS.inProgress,
      label: t("TEACHER_CLASS_DETAILS.IN_PROGRESS"),
      value: breakdown.in_progress,
    },
    {
      key: "not_started",
      color: COMPLETION_STATUS_COLORS.notStarted,
      label: t("TEACHER_CLASS_DETAILS.NOT_STARTED"),
      value: breakdown.not_started,
    },
  ];

  const donutData = legendItems
    .filter((item) => item.value > 0)
    .map((item) => ({
      key: item.key,
      name: item.label,
      value: item.value,
      color: item.color,
    }));

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <div className="h-[220px] w-[220px] shrink-0">
        {donutData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={2}
                stroke="none"
              >
                {donutData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, ""]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      <ul className="flex min-w-[160px] flex-col gap-3.5">
        {legendItems.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span
                className="text-sm"
                style={{ color: COMPLETION_STATUS_COLORS.legendLabel }}
              >
                {item.label}
              </span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: COMPLETION_STATUS_COLORS.legendValue }}
            >
              {item.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompletionStatusDonut;
