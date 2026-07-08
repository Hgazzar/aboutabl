import { Box, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TeacherClassCard from "@/components/teacher/TeacherClassCard";
import { ClassesViewMode, TeacherClassOverviewItem } from "@/types/teacherClasses";

export type TeacherClassesGridProps = {
  classes: TeacherClassOverviewItem[];
  loading?: boolean;
  error?: string | null;
  viewMode?: ClassesViewMode;
};

export const TeacherClassesGrid = ({
  classes,
  loading = false,
  error = null,
  viewMode = "grid",
}: TeacherClassesGridProps) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ py: 2 }}>
        {error}
      </Typography>
    );
  }

  if (classes.length === 0) {
    return (
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
    );
  }

  if (viewMode === "list") {
    return (
      <Stack spacing={2.5}>
        {classes.map((classItem) => (
          <TeacherClassCard key={classItem.class_id} classItem={classItem} variant="list" />
        ))}
      </Stack>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {classes.map((classItem) => (
        <Grid item key={classItem.class_id} xs={12} sm={6} lg={4}>
          <TeacherClassCard classItem={classItem} variant="grid" />
        </Grid>
      ))}
    </Grid>
  );
};

export default TeacherClassesGrid;
