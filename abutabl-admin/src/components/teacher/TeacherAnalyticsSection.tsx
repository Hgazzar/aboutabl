import { useMemo } from "react";
import {
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TeacherAnalyticsChartCard,
  TeacherCompletionDonutChart,
} from "@/components/teacher/TeacherCompletionStatusChart";
import { TeacherAnalyticsResponse } from "@/types/teacherAnalytics";

const CHART_COLORS = {
  performance: "#0F766E",
  attendance: "#14B8A6",
  completion: "#5EEAD4",
};

const truncateLabel = (value: string, maxLength = 12) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
};

export type TeacherAnalyticsSectionProps = {
  data: TeacherAnalyticsResponse | null;
  loading?: boolean;
  error?: string | null;
};

const ClassesComparisonChart = ({
  classes,
  showAttendance,
}: {
  classes: TeacherAnalyticsResponse["classes_comparison"];
  showAttendance: boolean;
}) => {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      classes.map((item) => ({
        name: item.name,
        performance: item.performance_percent,
        attendance: item.attendance_percent ?? 0,
        completion: item.completion_percent,
      })),
    [classes]
  );

  if (chartData.length === 0) {
    return (
      <Typography sx={{ color: "#6B7280", py: 6, textAlign: "center" }}>
        {t("TEACHER_ANALYTICS.EMPTY_COMPARISON")}
      </Typography>
    );
  }

  const legendItems = [
    { key: "performance", color: CHART_COLORS.performance, label: t("TEACHER_ANALYTICS.PERFORMANCE") },
    ...(showAttendance
      ? [{ key: "attendance", color: CHART_COLORS.attendance, label: t("TEACHER_ANALYTICS.ATTENDANCE") }]
      : []),
    { key: "completion", color: CHART_COLORS.completion, label: t("TEACHER_ANALYTICS.COMPLETION") },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 1.5, flexWrap: "wrap" }}>
        {legendItems.map((item) => (
          <Stack key={item.key} direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
            <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4} barCategoryGap="24%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickFormatter={(value) => truncateLabel(String(value))}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
          />
          <Bar dataKey="performance" name={t("TEACHER_ANALYTICS.PERFORMANCE")} fill={CHART_COLORS.performance} radius={[4, 4, 0, 0]} maxBarSize={18} />
          {showAttendance && (
            <Bar dataKey="attendance" name={t("TEACHER_ANALYTICS.ATTENDANCE")} fill={CHART_COLORS.attendance} radius={[4, 4, 0, 0]} maxBarSize={18} />
          )}
          <Bar dataKey="completion" name={t("TEACHER_ANALYTICS.COMPLETION")} fill={CHART_COLORS.completion} radius={[4, 4, 0, 0]} maxBarSize={18} />
          {chartData.length > 4 && (
            <Brush
              dataKey="name"
              height={24}
              stroke="#0F766E"
              travellerWidth={8}
              tickFormatter={(value) => truncateLabel(String(value), 8)}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const TeacherAnalyticsSection = ({
  data,
  loading = false,
  error = null,
}: TeacherAnalyticsSectionProps) => {
  const { t } = useTranslation();

  return (
    <Box id="teacher-analytics" sx={{ scrollMarginTop: 24, mt: 4 }}>
      <Typography
        sx={{
          fontSize: { xs: "1.125rem", md: "1.25rem" },
          fontWeight: 700,
          color: "#111827",
          letterSpacing: "0.02em",
          mb: 3,
        }}
      >
        {t("TEACHER_ANALYTICS.TITLE")}
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" },
            gap: 2.5,
          }}
        >
          <TeacherAnalyticsChartCard
            title={t("TEACHER_ANALYTICS.CLASSES_COMPARISON")}
            subtitle={t("TEACHER_ANALYTICS.CLASSES_COMPARISON_SUBTITLE")}
          >
            <ClassesComparisonChart
              classes={data?.classes_comparison ?? []}
              showAttendance={Boolean(data?.attendance_available)}
            />
          </TeacherAnalyticsChartCard>

          <TeacherAnalyticsChartCard title={t("TEACHER_ANALYTICS.COMPLETION_STATUS")}>
            <TeacherCompletionDonutChart completionStatus={data?.completion_status} />
          </TeacherAnalyticsChartCard>
        </Box>
      )}
    </Box>
  );
};

export default TeacherAnalyticsSection;
