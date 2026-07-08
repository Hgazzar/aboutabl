import { useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useTranslation } from "react-i18next";
import TeacherClassCard from "@/components/teacher/TeacherClassCard";
import {
  ClassesViewMode,
  TeacherClassOverviewItem,
} from "@/types/teacherClasses";

const ALL_CLASSES_FILTER = "all";

export type TeacherClassesOverviewSectionProps = {
  classes: TeacherClassOverviewItem[];
  loading?: boolean;
  error?: string | null;
  titleKey?: string;
  hideTitle?: boolean;
};

export const TeacherClassesOverviewSection = ({
  classes,
  loading = false,
  error = null,
  titleKey = "TEACHER_CLASSES.TITLE",
  hideTitle = false,
}: TeacherClassesOverviewSectionProps) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ClassesViewMode>("grid");
  const [selectedClassId, setSelectedClassId] = useState<string>(ALL_CLASSES_FILTER);

  const filteredClasses = useMemo(() => {
    if (selectedClassId === ALL_CLASSES_FILTER) {
      return classes;
    }

    const classId = Number(selectedClassId);
    return classes.filter((item) => item.class_id === classId);
  }, [classes, selectedClassId]);

  return (
    <Box id="classes-overview" sx={{ scrollMarginTop: 24 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent={hideTitle ? "flex-end" : "space-between"}
        spacing={2}
        sx={{ mb: 3 }}
      >
        {!hideTitle && (
          <Typography
            sx={{
              fontSize: { xs: "1.125rem", md: "1.25rem" },
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "0.02em",
            }}
          >
            {t(titleKey)}
          </Typography>
        )}

        <Stack direction="row" alignItems="center" spacing={1.25}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              displayEmpty
              disabled={loading || classes.length === 0}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                borderRadius: "12px",
                bgcolor: "#FFFFFF",
                fontSize: "0.875rem",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" },
              }}
            >
              <MenuItem value={ALL_CLASSES_FILTER}>
                {t("TEACHER_CLASSES.ALL_CLASSES")}
              </MenuItem>
              {classes.map((item) => (
                <MenuItem key={item.class_id} value={String(item.class_id)}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack
            direction="row"
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              bgcolor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <IconButton
              aria-label={t("TEACHER_CLASSES.GRID_VIEW")}
              onClick={() => setViewMode("grid")}
              sx={{
                borderRadius: 0,
                width: 44,
                height: 40,
                bgcolor: viewMode === "grid" ? "#F3F4F6" : "transparent",
              }}
            >
              <GridViewOutlinedIcon
                sx={{ fontSize: 20, color: viewMode === "grid" ? "#111827" : "#6B7280" }}
              />
            </IconButton>
            <IconButton
              aria-label={t("TEACHER_CLASSES.LIST_VIEW")}
              onClick={() => setViewMode("list")}
              sx={{
                borderRadius: 0,
                width: 44,
                height: 40,
                bgcolor: viewMode === "list" ? "#F3F4F6" : "transparent",
              }}
            >
              <ViewListOutlinedIcon
                sx={{ fontSize: 20, color: viewMode === "list" ? "#111827" : "#6B7280" }}
              />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!loading && error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && filteredClasses.length === 0 && (
        <Box
          sx={{
            p: 4,
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px dashed #D1D5DB",
            textAlign: "center",
          }}
        >
          <Typography color="text.secondary">{t("TEACHER_CLASSES.EMPTY")}</Typography>
        </Box>
      )}

      {!loading && filteredClasses.length > 0 && viewMode === "grid" && (
        <Grid container spacing={2.5}>
          {filteredClasses.map((classItem) => (
            <Grid item key={classItem.class_id} xs={12} sm={6} lg={4}>
              <TeacherClassCard classItem={classItem} variant="grid" />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && filteredClasses.length > 0 && viewMode === "list" && (
        <Stack spacing={2.5}>
          {filteredClasses.map((classItem) => (
            <TeacherClassCard key={classItem.class_id} classItem={classItem} variant="list" />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default TeacherClassesOverviewSection;
