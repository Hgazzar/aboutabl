import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RemoveIcon from "@mui/icons-material/Remove";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ClassesViewMode,
  TeacherClassHealthStatus,
  TeacherClassOverviewItem,
  TeacherClassPerformanceTrend,
} from "@/types/teacherClasses";
// @ts-expect-error CRA svgr
import { ReactComponent as TrendArrowIcon } from "@/assets/arrow.svg";
// @ts-expect-error CRA svgr
import { ReactComponent as BirdIcon } from "@/assets/bird.svg";

const HEALTH_STYLES: Record<
  TeacherClassHealthStatus,
  { bg: string; color: string; border: string }
> = {
  good: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  needs_review: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  at_risk: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
};

const PerformanceTrendIcon = ({ trend }: { trend: TeacherClassPerformanceTrend }) => {
  if (trend === "up") {
    return <TrendArrowIcon aria-hidden />;
  }

  if (trend === "down") {
    return <TrendingDownIcon sx={{ fontSize: 18, color: "#DC2626" }} />;
  }

  return <RemoveIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />;
};

type TeacherClassCardProps = {
  classItem: TeacherClassOverviewItem;
  variant: ClassesViewMode;
};

export const TeacherClassCard = ({ classItem, variant }: TeacherClassCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const healthStyle = HEALTH_STYLES[classItem.health_status];
  const performancePercent = Math.min(100, Math.max(0, classItem.performance.percent));

  const attentionRow = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1.1,
        borderRadius: "10px",
        bgcolor: "#FFF7ED",
        border: "1px solid #FFEDD5",
        flex: variant === "list" ? 1 : undefined,
      }}
    >
      <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: "#EA580C" }} />
      <Typography sx={{ fontSize: "0.8125rem", color: "#9A3412", fontWeight: 500 }}>
        {t("TEACHER_CLASSES.STUDENTS_NEED_ATTENTION", {
          count: classItem.students_need_attention,
        })}
      </Typography>
    </Box>
  );

  const pendingRow = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1.1,
        borderRadius: "10px",
        bgcolor: "#F9FAFB",
        border: "1px solid #E5E7EB",
        flex: variant === "list" ? 1 : undefined,
      }}
    >
      <AssignmentOutlinedIcon sx={{ fontSize: 18, color: "#6B7280" }} />
      <Typography sx={{ fontSize: "0.8125rem", color: "#374151", fontWeight: 500 }}>
        {t("TEACHER_CLASSES.PENDING_ASSIGNMENTS", {
          count: classItem.pending_assignments,
        })}
      </Typography>
    </Box>
  );

  const topStudentRow = classItem.top_student ? (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1.1,
        borderRadius: "10px",
        bgcolor: "#ECFDF5",
        border: "1px solid #A7F3D0",
      }}
    >
      <Box sx={{ width: 22, height: 22, flexShrink: 0, overflow: "hidden" }}>
        <BirdIcon style={{ width: 22, height: 22 }} aria-hidden />
      </Box>
      <Typography sx={{ fontSize: "0.8125rem", color: "#047857" }}>
        {t("TEACHER_CLASSES.TOP_STUDENT")}{" "}
        <Box component="span" sx={{ fontWeight: 700, color: "#038E7B" }}>
          {classItem.top_student.name}
        </Box>
      </Typography>
    </Box>
  ) : null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "16px",
        bgcolor: "#FFFFFF",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827" }}>
            {classItem.name}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: "0.875rem", color: "#6B7280" }}>
            {t("TEACHER_CLASSES.STUDENT_COUNT", { count: classItem.student_count })}
          </Typography>
        </Box>

        <Box
          sx={{
            px: 1.25,
            py: 0.35,
            borderRadius: "999px",
            bgcolor: healthStyle.bg,
            color: healthStyle.color,
            border: `1px solid ${healthStyle.border}`,
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {classItem.health_label}
        </Box>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
          {t("TEACHER_CLASSES.CLASS_PERFORMANCE")}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>
            {Math.round(performancePercent)}%
          </Typography>
          <PerformanceTrendIcon trend={classItem.performance.trend} />
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={performancePercent}
        sx={{
          mb: 2,
          height: 8,
          borderRadius: "999px",
          bgcolor: "#E5E7EB",
          "& .MuiLinearProgress-bar": {
            borderRadius: "999px",
            bgcolor: "#038E7B",
          },
        }}
      />

      {variant === "list" ? (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mb: 1.25 }}>
          {attentionRow}
          {pendingRow}
        </Stack>
      ) : (
        <Stack spacing={1.25} sx={{ mb: 1.25 }}>
          {attentionRow}
          {pendingRow}
        </Stack>
      )}

      {topStudentRow && <Box sx={{ mb: 2 }}>{topStudentRow}</Box>}

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ mt: "auto", pt: topStudentRow ? 0 : 1 }}
      >
        <Button
          fullWidth
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          onClick={() => navigate(`/teacher/classes/${classItem.class_id}/overview`)}
          sx={{
            py: 1.2,
            borderRadius: "12px",
            bgcolor: "#038E7B",
            color: "#FFFFFF",
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { bgcolor: "#027A6A", boxShadow: "none" },
            "& .MuiButton-endIcon": { ml: "auto" },
            justifyContent: "space-between",
            px: 2,
          }}
        >
          {t("TEACHER_CLASSES.VIEW_CLASS")}
        </Button>

        {variant === "grid" && (
          <>
            <IconButton
              aria-label={t("TEACHER_CLASSES.CALENDAR")}
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                width: 44,
                height: 44,
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 20, color: "#374151" }} />
            </IconButton>
            <IconButton
              aria-label={t("TEACHER_CLASSES.MATERIALS")}
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                width: 44,
                height: 44,
              }}
            >
              <MenuBookOutlinedIcon sx={{ fontSize: 20, color: "#374151" }} />
            </IconButton>
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default TeacherClassCard;
