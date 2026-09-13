import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  TeacherAlertCategory,
  TeacherAlertItem,
  TeacherAlertProgressLabel,
  TeacherAlertType,
  TeacherAlertsResponse,
} from "@/types/teacherAlerts";
import {
  buildStudentProfilePath,
  resolveAlertProfileNavigation,
} from "@/utils/teacherAlertNavigation";

const EDGE_PADDING = 3; // 24px — equal inset for Student (left) and Actions (right)
const ACTIONS_CONTENT_WIDTH = 132;
const PROGRESS_THRESHOLD = 70;

const actionsColumnSx = {
  pr: EDGE_PADDING,
  width: { xs: 152, sm: ACTIONS_CONTENT_WIDTH + 24 },
};

const actionsContentSx = {
  width: { xs: 120, sm: ACTIONS_CONTENT_WIDTH },
  ml: "auto",
};

const getProgressBarColor = (percent: number) =>
  percent >= PROGRESS_THRESHOLD ? "#0F766E" : "#F59E0B";

const headerCellSx = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "#9CA3AF",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  borderBottom: "1px solid #E5E7EB",
  py: 1.5,
  whiteSpace: "nowrap",
};

export type TeacherAlertsSectionProps = {
  data: TeacherAlertsResponse | null;
  loading?: boolean;
  error?: string | null;
};

const getAlertTitleKey = (type: TeacherAlertType) => {
  if (type === "overdue_assignments") {
    return "TEACHER_ALERTS.OVERDUE_ASSIGNMENTS";
  }

  return "TEACHER_ALERTS.LOW_PERFORMANCE";
};

const getCategoryLabelKey = (category: TeacherAlertCategory) => {
  if (category === "quizzes") {
    return "TEACHER_ALERTS.QUIZZES";
  }

  if (category === "performance") {
    return "TEACHER_ALERTS.PERFORMANCE";
  }

  return "TEACHER_ALERTS.ASSIGNMENTS";
};

const StudentCell = ({ alert }: { alert: TeacherAlertItem }) => (
  <Stack direction="row" alignItems="center" spacing={1.5}>
    <Avatar
      src={alert.photo_url ?? undefined}
      alt={alert.name}
      sx={{
        width: 40,
        height: 40,
        bgcolor: "#E0F2F1",
        color: "#0F766E",
        fontSize: "0.875rem",
        fontWeight: 700,
      }}
    >
      {alert.name.charAt(0).toUpperCase()}
    </Avatar>
    <Box>
      <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111827" }}>
        {alert.name}
      </Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "#6B7280", mt: 0.25 }}>
        {alert.class.label}
      </Typography>
    </Box>
  </Stack>
);

const AlertTypeCell = ({ alert, t }: { alert: TeacherAlertItem; t: (key: string) => string }) => (
  <Box>
    <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>
      {t(getAlertTitleKey(alert.alert.type))}
    </Typography>
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
      <AssignmentOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
      <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>
        {t(getCategoryLabelKey(alert.alert.category))}
      </Typography>
    </Stack>
  </Box>
);

const ProgressCell = ({
  percent,
  label,
  t,
}: {
  percent: number;
  label: TeacherAlertProgressLabel;
  t: (key: string) => string;
}) => {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const barColor = getProgressBarColor(clampedPercent);
  const showBelowAverage = label === "below_average" || clampedPercent < PROGRESS_THRESHOLD;

  return (
    <Box sx={{ minWidth: 160, maxWidth: 220 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.75 }}>
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "#111827",
            minWidth: 36,
          }}
        >
          {clampedPercent}%
        </Typography>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={clampedPercent}
            sx={{
              height: 7,
              borderRadius: 999,
              bgcolor: "#E5E7EB",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                bgcolor: barColor,
              },
            }}
          />
        </Box>
      </Stack>
      {showBelowAverage && (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TrendingDownIcon sx={{ fontSize: 14, color: "#DC2626" }} />
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#DC2626" }}>
            {t("TEACHER_ALERTS.BELOW_AVERAGE")}
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

export const TeacherAlertsSection = ({
  data,
  loading = false,
  error = null,
}: TeacherAlertsSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const alerts = data?.alerts ?? [];

  const openStudentProfile = (alert: TeacherAlertItem) => {
    const nav = resolveAlertProfileNavigation(alert);
    if (!nav.classId || !nav.studentId) {
      return;
    }
    navigate(buildStudentProfilePath(nav));
  };

  return (
    <Box id="teacher-alerts" sx={{ scrollMarginTop: 24, mt: 4 }}>
      <Typography
        sx={{
          fontSize: { xs: "1.125rem", md: "1.25rem" },
          fontWeight: 700,
          color: "#111827",
          letterSpacing: "0.02em",
          mb: 3,
        }}
      >
        {t("TEACHER_ALERTS.TITLE")}
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : alerts.length === 0 ? (
          <Typography sx={{ color: "#6B7280", py: 6, textAlign: "center" }}>
            {t("TEACHER_ALERTS.EMPTY")}
          </Typography>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, pl: EDGE_PADDING }}>
                    {t("TEACHER_ALERTS.COL_STUDENT")}
                  </TableCell>
                  <TableCell sx={headerCellSx}>{t("TEACHER_ALERTS.COL_ALERT_TYPE")}</TableCell>
                  <TableCell sx={headerCellSx}>{t("TEACHER_ALERTS.COL_PROGRESS")}</TableCell>
                  <TableCell sx={{ ...headerCellSx, ...actionsColumnSx }}>
                    <Box sx={actionsContentSx}>
                      {t("TEACHER_ALERTS.COL_ACTIONS")}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow
                    key={alert.student_id}
                    sx={{
                      "&:last-child td": { borderBottom: 0 },
                      "& td": { borderBottom: "1px solid #F3F4F6", py: 2.25 },
                    }}
                  >
                    <TableCell sx={{ pl: EDGE_PADDING }}>
                      <StudentCell alert={alert} />
                    </TableCell>
                    <TableCell>
                      <AlertTypeCell alert={alert} t={t} />
                    </TableCell>
                    <TableCell>
                      <ProgressCell
                        percent={alert.progress.percent}
                        label={alert.progress.label}
                        t={t}
                      />
                    </TableCell>
                    <TableCell sx={actionsColumnSx}>
                      <Box sx={actionsContentSx}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={() => openStudentProfile(alert)}
                          sx={{
                            borderRadius: "999px",
                            borderColor: "#99F6E4",
                            bgcolor: "#F0FDFA",
                            color: "#0F766E",
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            px: 2.25,
                            py: 0.875,
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            boxShadow: "none",
                            "&:hover": {
                              borderColor: "#5EEAD4",
                              bgcolor: "#ECFDF5",
                              boxShadow: "none",
                            },
                          }}
                        >
                          {t("TEACHER_ALERTS.SHOW_DETAILS")}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default TeacherAlertsSection;
