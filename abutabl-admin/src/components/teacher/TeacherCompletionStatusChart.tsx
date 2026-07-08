import { useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CompletionBreakdown, CompletionScope } from "@/types/teacherAnalytics";

const CHART_COLORS = {
  completed: "#004D34",
  inProgress: "#5EEAD4",
  notStarted: "#D1D5DB",
};

const COMPLETION_SCOPES: CompletionScope[] = ["all", "assignments", "quizzes"];

const EMPTY_COMPLETION_STATUS: Record<CompletionScope, CompletionBreakdown> = {
  all: { completed: 0, in_progress: 0, not_started: 0, total: 0 },
  assignments: { completed: 0, in_progress: 0, not_started: 0, total: 0 },
  quizzes: { completed: 0, in_progress: 0, not_started: 0, total: 0 },
};

export type TeacherAnalyticsChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerRight?: React.ReactNode;
};

export const TeacherAnalyticsChartCard = ({
  title,
  subtitle,
  children,
  headerRight,
}: TeacherAnalyticsChartCardProps) => (
  <Box
    sx={{
      bgcolor: "#FFFFFF",
      borderRadius: "16px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
      p: { xs: 2, md: 2.5 },
      height: "100%",
      minHeight: 360,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mb: 2 }}
    >
      <Box>
        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: "0.8125rem", color: "#6B7280", mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {headerRight}
    </Stack>
    <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
  </Box>
);

export type TeacherCompletionDonutChartProps = {
  completionStatus?: Record<CompletionScope, CompletionBreakdown>;
};

export const TeacherCompletionDonutChart = ({
  completionStatus = EMPTY_COMPLETION_STATUS,
}: TeacherCompletionDonutChartProps) => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<CompletionScope>("all");

  const breakdown = completionStatus[scope];

  const displayBreakdown = useMemo(() => {
    if (!breakdown || breakdown.total === 0) {
      return {
        completed: 0,
        in_progress: 0,
        not_started: 100,
        total: 0,
      };
    }

    return breakdown;
  }, [breakdown]);

  const donutData = useMemo(() => {
    const segments = [
      {
        key: "completed",
        name: t("TEACHER_ANALYTICS.COMPLETED"),
        value: displayBreakdown.completed,
        color: CHART_COLORS.completed,
      },
      {
        key: "in_progress",
        name: t("TEACHER_ANALYTICS.IN_PROGRESS"),
        value: displayBreakdown.in_progress,
        color: CHART_COLORS.inProgress,
      },
      {
        key: "not_started",
        name: t("TEACHER_ANALYTICS.NOT_STARTED"),
        value: displayBreakdown.not_started,
        color: CHART_COLORS.notStarted,
      },
    ].filter((item) => item.value > 0);

    if (segments.length > 0) {
      return segments;
    }

    return [
      {
        key: "not_started",
        name: t("TEACHER_ANALYTICS.NOT_STARTED"),
        value: 100,
        color: CHART_COLORS.notStarted,
      },
    ];
  }, [displayBreakdown, t]);

  const legendItems = [
    {
      key: "completed",
      color: CHART_COLORS.completed,
      value: displayBreakdown.completed,
      label: t("TEACHER_ANALYTICS.COMPLETED"),
    },
    {
      key: "in_progress",
      color: CHART_COLORS.inProgress,
      value: displayBreakdown.in_progress,
      label: t("TEACHER_ANALYTICS.IN_PROGRESS"),
    },
    {
      key: "not_started",
      color: CHART_COLORS.notStarted,
      value: displayBreakdown.not_started,
      label: t("TEACHER_ANALYTICS.NOT_STARTED"),
    },
  ];

  const scopeLabel = (value: CompletionScope) => {
    if (value === "assignments") {
      return t("TEACHER_ANALYTICS.ASSIGNMENTS");
    }

    if (value === "quizzes") {
      return t("TEACHER_ANALYTICS.QUIZZES");
    }

    return t("TEACHER_ANALYTICS.ALL");
  };

  return (
    <Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={scope}
        onChange={(_, value: CompletionScope | null) => {
          if (value) {
            setScope(value);
          }
        }}
        sx={{
          mb: 2,
          bgcolor: "#F3F4F6",
          borderRadius: "10px",
          p: 0.5,
          "& .MuiToggleButton-root": {
            border: 0,
            borderRadius: "8px !important",
            px: 1.5,
            py: 0.5,
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "#6B7280",
            textTransform: "none",
            "&.Mui-selected": {
              bgcolor: "#0F766E",
              color: "#FFFFFF",
              "&:hover": { bgcolor: "#0D9488" },
            },
          },
        }}
      >
        {COMPLETION_SCOPES.map((item) => (
          <ToggleButton key={item} value={item}>
            {scopeLabel(item)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
        justifyContent="center"
        spacing={3}
        sx={{ minHeight: 240 }}
      >
        <Box sx={{ width: 220, height: 220 }}>
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
                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Stack spacing={1.5} sx={{ minWidth: 160 }}>
          {legendItems.map((item) => (
            <Stack
              key={item.key}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>
                  {item.label}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>
                {item.value}%
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default TeacherCompletionDonutChart;
