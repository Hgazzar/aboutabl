import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import ClassLearningProgress from "@/components/teacher/class-details/ClassLearningProgress";
import ClassActivitiesTasks from "@/components/teacher/class-details/ClassActivitiesTasks";
import ClassStudentsOverview from "@/components/teacher/class-details/ClassStudentsOverview";
import ClassAlerts from "@/components/teacher/class-details/ClassAlerts";
import ClassOverviewChartsSection from "@/components/teacher/class-details/ClassOverviewChartsSection";
import ClassOverviewStatsRow from "@/components/teacher/class-details/ClassOverviewStatsRow";
import StandardsAnalytics from "@/components/teacher/class-details/StandardsAnalytics";
import { ClassDetailsOverviewResponse } from "@/types/classDetailsOverview";
import { ClassDetailsTimeRange } from "@/types/classDetails";

export type ClassOverviewTabProps = {
  data: ClassDetailsOverviewResponse | null;
  loading?: boolean;
  error?: string | null;
  timeRange: ClassDetailsTimeRange;
  onOpenStudentProfile?: (studentId: number) => void;
};

export const ClassOverviewTab = ({
  data,
  loading = false,
  error = null,
  timeRange,
  onOpenStudentProfile,
}: ClassOverviewTabProps) => {
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

  const { stats, charts, learning_progress: learningProgress } = data;

  return (
    <>
      <ClassOverviewStatsRow stats={stats} />

      <ClassOverviewChartsSection
        performanceLine={charts.performance_line}
        completionStatus={charts.completion_status}
      />

      <ClassLearningProgress learningProgress={learningProgress} />

      <StandardsAnalytics classId={data.class.class_id} range={data.range} />

      <ClassActivitiesTasks classId={data.class.class_id} headerTimeRange={timeRange} />

      <ClassStudentsOverview
        classId={data.class.class_id}
        headerTimeRange={timeRange}
        onOpenStudentProfile={onOpenStudentProfile}
      />

      <ClassAlerts classId={data.class.class_id} />
    </>
  );
};

export default ClassOverviewTab;
