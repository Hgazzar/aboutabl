import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import Cookies from "js-cookie";
import TeacherDashboardHeader, {
  TeacherDashboardStats,
} from "@/components/teacher/TeacherDashboardHeader";
import TeacherClassesOverviewSection from "@/components/teacher/TeacherClassesOverviewSection";
import TeacherAnalyticsSection from "@/components/teacher/TeacherAnalyticsSection";
import TeacherAlertsSection from "@/components/teacher/TeacherAlertsSection";
import { getRequest } from "@/utils/fetchMethods";
import {
  TeacherClassesOverviewResponse,
  TeacherClassOverviewItem,
} from "@/types/teacherClasses";
import { TeacherAnalyticsResponse } from "@/types/teacherAnalytics";
import { TeacherAlertsResponse } from "@/types/teacherAlerts";

type TeacherOverviewApiStats = {
  total_classes: number;
  total_students: number;
  students_need_attention: number;
  assignments_in_review: number;
};

type TeacherOverviewResponse = {
  status: boolean;
  teacher?: { id: number; name: string };
  stats?: TeacherOverviewApiStats;
};

const mapStats = (stats?: TeacherOverviewApiStats): TeacherDashboardStats => ({
  totalClasses: stats?.total_classes ?? 0,
  totalStudents: stats?.total_students ?? 0,
  studentsNeedAttention: stats?.students_need_attention ?? 0,
  assignmentsToReview: stats?.assignments_in_review ?? 0,
  studentsGrowthThisTerm: 0,
});

const TeacherOverview = () => {
  const [userName, setUserName] = useState(Cookies.get("username") || "");
  const [stats, setStats] = useState<TeacherDashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    studentsNeedAttention: 0,
    assignmentsToReview: 0,
    studentsGrowthThisTerm: 0,
  });
  const [classes, setClasses] = useState<TeacherClassOverviewItem[]>([]);
  const [analytics, setAnalytics] = useState<TeacherAnalyticsResponse | null>(null);
  const [alerts, setAlerts] = useState<TeacherAlertsResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      setOverviewLoading(true);
      setOverviewError(null);

      try {
        const response = (await getRequest(
          {},
          "/api/dashboard/teacher/overview"
        )) as TeacherOverviewResponse;

        if (cancelled) {
          return;
        }

        if (response?.teacher?.name) {
          setUserName(response.teacher.name);
        } else if (Cookies.get("username")) {
          setUserName(Cookies.get("username") || "");
        }

        setStats(mapStats(response?.stats));
      } catch (err: any) {
        if (!cancelled) {
          setOverviewError(err?.message || "Failed to load dashboard overview.");
        }
      } finally {
        if (!cancelled) {
          setOverviewLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      setClassesLoading(true);
      setClassesError(null);

      try {
        const response = (await getRequest(
          {},
          "/api/dashboard/teacher/classes"
        )) as TeacherClassesOverviewResponse;

        if (cancelled) {
          return;
        }

        setClasses(Array.isArray(response?.classes) ? response.classes : []);
      } catch (err: any) {
        if (!cancelled) {
          setClassesError(err?.message || "Failed to load classes overview.");
          setClasses([]);
        }
      } finally {
        if (!cancelled) {
          setClassesLoading(false);
        }
      }
    };

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      try {
        const response = (await getRequest(
          {},
          "/api/dashboard/teacher/stats"
        )) as TeacherAnalyticsResponse;

        if (cancelled) {
          return;
        }

        setAnalytics(response?.status ? response : null);
      } catch (err: any) {
        if (!cancelled) {
          setAnalyticsError(err?.message || "Failed to load analytics.");
          setAnalytics(null);
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAlerts = async () => {
      setAlertsLoading(true);
      setAlertsError(null);

      try {
        const response = (await getRequest(
          {},
          "/api/dashboard/teacher/alerts"
        )) as TeacherAlertsResponse;

        if (cancelled) {
          return;
        }

        setAlerts(response?.status ? response : null);
      } catch (err: any) {
        if (!cancelled) {
          setAlertsError(err?.message || "Failed to load alerts.");
          setAlerts(null);
        }
      } finally {
        if (!cancelled) {
          setAlertsLoading(false);
        }
      }
    };

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (overviewLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100%" }}>
      {overviewError && (
        <Typography color="error" sx={{ px: 3, pt: 2 }}>
          {overviewError}
        </Typography>
      )}

      <TeacherDashboardHeader userName={userName} stats={stats} />

      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 4 }}>
        <TeacherClassesOverviewSection
          classes={classes}
          loading={classesLoading}
          error={classesError}
        />

        <TeacherAnalyticsSection
          data={analytics}
          loading={analyticsLoading}
          error={analyticsError}
        />

        <TeacherAlertsSection
          data={alerts}
          loading={alertsLoading}
          error={alertsError}
        />
      </Box>
    </Box>
  );
};

export default TeacherOverview;
