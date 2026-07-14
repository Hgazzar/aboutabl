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
import { ClassesPerformancePoint } from "@/types/classesPerformance";
import { CLASSES_PERFORMANCE_COLORS } from "./classesPerformanceTheme";

export type ClassesPerformanceChartProps = {
  points: ClassesPerformancePoint[];
};

/**
 * Presentational only — renames API keys for Recharts series binding.
 * Does not recalculate, sort, filter, or invent point values.
 * class_percent → Class (yellow), school_percent → All Classes (teal).
 */
export const ClassesPerformanceChart = ({ points }: ClassesPerformanceChartProps) => {
  const { t } = useTranslation();

  if (points.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-[#6B7280]">
        {t("TEACHER_CLASS_DETAILS.EMPTY_PERFORMANCE")}
      </p>
    );
  }

  // Key rename only for Recharts dataKey binding — values and order unchanged.
  const data = points.map((point) => ({
    label: point.label,
    class: point.class_percent,
    allClasses: point.school_percent,
  }));

  return (
    <div className="min-h-[260px] flex-1">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke={CLASSES_PERFORMANCE_COLORS.grid}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: CLASSES_PERFORMANCE_COLORS.axisTick }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 12, fill: CLASSES_PERFORMANCE_COLORS.axisTick }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === "class"
                ? t("TEACHER_CLASS_DETAILS.LEGEND_CLASS")
                : t("TEACHER_CLASS_DETAILS.LEGEND_ALL_CLASSES"),
            ]}
            contentStyle={{
              borderRadius: 10,
              border: `1px solid ${CLASSES_PERFORMANCE_COLORS.grid}`,
              boxShadow: CLASSES_PERFORMANCE_COLORS.cardShadow,
            }}
          />
          <Line
            type="monotone"
            dataKey="class"
            name={t("TEACHER_CLASS_DETAILS.LEGEND_CLASS")}
            stroke={CLASSES_PERFORMANCE_COLORS.classLine}
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: CLASSES_PERFORMANCE_COLORS.classLine,
              strokeWidth: 0,
            }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="allClasses"
            name={t("TEACHER_CLASS_DETAILS.LEGEND_ALL_CLASSES")}
            stroke={CLASSES_PERFORMANCE_COLORS.allClassesLine}
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: CLASSES_PERFORMANCE_COLORS.allClassesLine,
              strokeWidth: 0,
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClassesPerformanceChart;
