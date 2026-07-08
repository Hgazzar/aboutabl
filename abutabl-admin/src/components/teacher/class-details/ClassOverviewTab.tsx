import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import ClassOverviewChartsSection from "@/components/teacher/class-details/ClassOverviewChartsSection";
import ClassOverviewStatsRow from "@/components/teacher/class-details/ClassOverviewStatsRow";
import { ClassDetailsOverviewResponse } from "@/types/classDetailsOverview";

const cardSx = {
  p: 2.5,
  borderRadius: "16px",
  bgcolor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
  height: "100%",
};

const sectionTitleSx = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#111827",
  mb: 2,
};

const headerCellSx = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "#9CA3AF",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  borderBottom: "1px solid #E5E7EB",
  py: 1.5,
};

export type ClassOverviewTabProps = {
  data: ClassDetailsOverviewResponse | null;
  loading?: boolean;
  error?: string | null;
};

const activityStatusColor = (status: string) => {
  if (status === "completed") return { bg: "#ECFDF5", color: "#047857" };
  if (status === "overdue") return { bg: "#FEF2F2", color: "#B91C1C" };
  return { bg: "#F3F4F6", color: "#6B7280" };
};

export const ClassOverviewTab = ({ data, loading = false, error = null }: ClassOverviewTabProps) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10, bgcolor: "#F7F9FA" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: "#F7F9FA" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const { stats, charts, activities, students_preview: studentsPreview } = data;

  return (
    <>
      <ClassOverviewStatsRow stats={stats} />

      <ClassOverviewChartsSection
        performanceLine={charts.performance_line}
        completionStatus={charts.completion_status}
      />

      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, bgcolor: "#F7F9FA" }}>
        <Paper elevation={0} sx={{ ...cardSx, mb: 2.5 }}>
          <Typography sx={sectionTitleSx}>{t("TEACHER_CLASS_DETAILS.ACTIVITIES_TITLE")}</Typography>
          {activities.length === 0 ? (
            <Typography sx={{ color: "#6B7280", py: 2 }}>{t("TEACHER_CLASS_DETAILS.EMPTY_ACTIVITIES")}</Typography>
          ) : (
            <Stack spacing={1.5}>
              {activities.map((activity) => {
                const statusStyle = activityStatusColor(activity.status);
                return (
                  <Stack
                    key={activity.id}
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{ py: 1.25, borderBottom: "1px solid #F3F4F6", "&:last-child": { borderBottom: 0 } }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827" }}>
                        {activity.title}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#6B7280", mt: 0.25 }}>
                        {t(`TEACHER_CLASS_DETAILS.ACTIVITY_TYPE_${activity.type.toUpperCase()}`)}
                        {activity.due_date ? ` · ${t("TEACHER_CLASS_DETAILS.DUE")} ${activity.due_date}` : ""}
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}>
                        {activity.completion_percent}%
                      </Typography>
                      <Chip
                        label={t(`TEACHER_CLASS_DETAILS.ACTIVITY_STATUS_${activity.status.toUpperCase()}`)}
                        size="small"
                        sx={{
                          bgcolor: statusStyle.bg,
                          color: statusStyle.color,
                          fontWeight: 600,
                          fontSize: "0.6875rem",
                        }}
                      />
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={cardSx}>
          <Typography sx={sectionTitleSx}>{t("TEACHER_CLASS_DETAILS.STUDENTS_TITLE")}</Typography>
          {studentsPreview.length === 0 ? (
            <Typography sx={{ color: "#6B7280", py: 2 }}>{t("TEACHER_CLASS_DETAILS.EMPTY_STUDENTS")}</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx}>{t("TEACHER_CLASS_DETAILS.COL_STUDENT")}</TableCell>
                    <TableCell sx={headerCellSx}>{t("TEACHER_CLASS_DETAILS.COL_PROGRESS")}</TableCell>
                    <TableCell sx={headerCellSx}>{t("TEACHER_CLASS_DETAILS.COL_STATUS")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentsPreview.map((student) => (
                    <TableRow key={student.student_id} sx={{ "& td": { borderBottom: "1px solid #F3F4F6", py: 1.75 } }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={student.photo_url ?? undefined} sx={{ width: 36, height: 36, bgcolor: "#E0F2F1", color: "#00A78E", fontSize: "0.875rem" }}>
                            {student.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>{student.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, minWidth: 32 }}>
                            {student.performance_percent}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, student.performance_percent)}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 999,
                              bgcolor: "#E5E7EB",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: student.performance_percent >= 70 ? "#00A78E" : "#F59E0B",
                              },
                            }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {student.needs_attention ? (
                          <Chip
                            label={t("TEACHER_CLASS_DETAILS.NEEDS_ATTENTION")}
                            size="small"
                            sx={{ bgcolor: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.6875rem" }}
                          />
                        ) : (
                          <Chip
                            label={t("TEACHER_CLASS_DETAILS.ON_TRACK")}
                            size="small"
                            sx={{ bgcolor: "#ECFDF5", color: "#047857", fontWeight: 600, fontSize: "0.6875rem" }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default ClassOverviewTab;
