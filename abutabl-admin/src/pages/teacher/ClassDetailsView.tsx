import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ClassDetailsHeader from "@/components/teacher/class-details/ClassDetailsHeader";
import ClassOverviewTab from "@/components/teacher/class-details/ClassOverviewTab";
import ClassStudentsTab from "@/components/teacher/class-details/ClassStudentsTab";
import { getRequest } from "@/utils/fetchMethods";
import {
  ClassDetailsTab,
  ClassDetailsTimeRange,
  isClassDetailsTab,
} from "@/types/classDetails";
import { ClassDetailsOverviewResponse } from "@/types/classDetailsOverview";
import {
  TeacherClassesOverviewResponse,
  TeacherClassOverviewItem,
} from "@/types/teacherClasses";
import {
  StudentProfileFocusSection,
  StudentProfileHighlight,
} from "@/utils/teacherAlertNavigation";

/** Lazy-loaded to avoid HMR/circular init issues with the assignments tab module. */
const ClassAssignmentsTab = lazy(
  () => import("@/components/teacher/class-details/assignments/ClassAssignmentsTab")
);

/**
 * Unified teacher Classes screen — sidebar /teacher/classes and
 * /teacher/classes/:classId/:tab share this view + ClassDetailsHeader.
 */
const ClassDetailsView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { classId: classIdParam, tab: tabParam } = useParams<{
    classId?: string;
    tab?: string;
  }>();

  const [classes, setClasses] = useState<TeacherClassOverviewItem[]>([]);
  const [overview, setOverview] = useState<ClassDetailsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<ClassDetailsTimeRange>("week");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const activeClassId = classIdParam ? Number(classIdParam) : null;
  const activeTab: ClassDetailsTab = isClassDetailsTab(tabParam) ? tabParam : "overview";

  const profileFocus = useMemo((): StudentProfileFocusSection | null => {
    const raw = searchParams.get("focus");
    if (
      raw === "summary" ||
      raw === "assignments" ||
      raw === "quizzes" ||
      raw === "standards" ||
      raw === "smart_insight" ||
      raw === "evaluation" ||
      raw === "rankings"
    ) {
      return raw;
    }
    return null;
  }, [searchParams]);

  const profileHighlight = useMemo((): StudentProfileHighlight => {
    const raw = searchParams.get("highlight");
    if (raw === "overdue" || raw === "missing") {
      return raw;
    }
    return null;
  }, [searchParams]);

  // F-047 — deep-link from Alerts Show Details (?student=&focus=&highlight=)
  useEffect(() => {
    const studentRaw = searchParams.get("student");
    if (!studentRaw) {
      return;
    }
    const studentId = Number(studentRaw);
    if (Number.isFinite(studentId) && studentId > 0) {
      setSelectedStudentId(studentId);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = (await getRequest(
          {},
          "/api/dashboard/teacher/classes"
        )) as TeacherClassesOverviewResponse;

        if (cancelled) {
          return;
        }

        const classesList = Array.isArray(response?.classes) ? response.classes : [];
        setClasses(classesList);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || t("TEACHER_CLASS_DETAILS.LOAD_ERROR"));
          setClasses([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (classes.length === 0) {
      return;
    }

    if (!classIdParam) {
      navigate(`/teacher/classes/${classes[0].class_id}/overview`, { replace: true });
      return;
    }

    if (!tabParam) {
      navigate(`/teacher/classes/${classIdParam}/overview`, { replace: true });
      return;
    }

    if (!isClassDetailsTab(tabParam)) {
      navigate(`/teacher/classes/${classIdParam}/overview`, { replace: true });
    }
  }, [classIdParam, classes, loading, navigate, tabParam]);

  useEffect(() => {
    if (activeTab !== "overview" || !activeClassId) {
      return;
    }

    let cancelled = false;

    const loadOverview = async () => {
      setOverviewLoading(true);
      setOverviewError(null);

      try {
        const response = (await getRequest(
          { range: timeRange === "all" ? "week" : timeRange },
          `/api/dashboard/teacher/classes/${activeClassId}/overview`
        )) as ClassDetailsOverviewResponse;

        if (cancelled) {
          return;
        }

        setOverview(response?.status ? response : null);
      } catch (err: any) {
        if (!cancelled) {
          setOverviewError(err?.message || t("TEACHER_CLASS_DETAILS.OVERVIEW_LOAD_ERROR"));
          setOverview(null);
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
  }, [activeClassId, activeTab, timeRange, t]);

  const activeClass = useMemo(
    () =>
      activeClassId !== null
        ? classes.find((item) => item.class_id === activeClassId) ?? null
        : null,
    [activeClassId, classes]
  );

  const subjectLabel = useMemo(() => {
    if (!activeClass) {
      return "";
    }

    return overview?.class?.subject_name || activeClass.grade_name || activeClass.name;
  }, [activeClass, overview]);

  const studentCount = useMemo(() => {
    if (!activeClass) {
      return 0;
    }

    return overview?.class?.student_count ?? activeClass.student_count;
  }, [activeClass, overview]);

  useEffect(() => {
    if (loading || classes.length === 0 || activeClassId === null) {
      return;
    }

    const isValidClass = classes.some((item) => item.class_id === activeClassId);

    if (!isValidClass) {
      navigate(`/teacher/classes/${classes[0].class_id}/overview`, { replace: true });
    }
  }, [activeClassId, classes, loading, navigate]);

  useEffect(() => {
    setSelectedStudentId(null);
  }, [activeClassId]);

  const handleClassChange = (classId: number) => {
    setSelectedStudentId(null);
    navigate(`/teacher/classes/${classId}/${activeTab}`);
  };

  const handleTabChange = (tab: ClassDetailsTab) => {
    if (activeClassId === null) {
      return;
    }

    if (tab !== "assignments" && timeRange === "all") {
      setTimeRange("week");
    }

    navigate(`/teacher/classes/${activeClassId}/${tab}`);
  };

  const handleSelectStudent = useCallback((studentId: number) => {
    setSelectedStudentId(studentId);
  }, []);

  const handleOpenStudentProfile = useCallback(
    (studentId: number) => {
      if (activeClassId === null) {
        return;
      }

      setSelectedStudentId(studentId);
      navigate(`/teacher/classes/${activeClassId}/students`);
    },
    [activeClassId, navigate]
  );

  const isRedirecting =
    loading || (!classIdParam && classes.length > 0) || (classIdParam && !tabParam);

  if (isRedirecting) {
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

  if (!activeClass) {
    return (
      <Box sx={{ p: 3, bgcolor: "#F7F9FA" }}>
        <Typography color="text.secondary">{t("TEACHER_CLASS_DETAILS.EMPTY")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "#F7F9FA" }}>
      <ClassDetailsHeader
        subjectLabel={subjectLabel}
        studentCount={studentCount}
        classes={classes}
        activeClassId={activeClass.class_id}
        activeTab={activeTab}
        timeRange={timeRange}
        onClassChange={handleClassChange}
        onTabChange={handleTabChange}
        onTimeRangeChange={setTimeRange}
      />

      {activeTab === "overview" ? (
        <ClassOverviewTab
          data={overview}
          loading={overviewLoading}
          error={overviewError}
          timeRange={timeRange}
          onOpenStudentProfile={handleOpenStudentProfile}
        />
      ) : activeTab === "students" ? (
        <ClassStudentsTab
          classId={activeClass.class_id}
          timeRange={timeRange}
          selectedStudentId={selectedStudentId}
          onSelectStudent={handleSelectStudent}
          profileFocus={profileFocus}
          profileHighlight={profileHighlight}
        />
      ) : activeTab === "assignments" ? (
        <Suspense
          fallback={
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 10,
                bgcolor: "#F7F9FA",
              }}
            >
              <CircularProgress sx={{ color: "#23B8A2" }} />
            </Box>
          }
        >
          <ClassAssignmentsTab
            classId={activeClass.class_id}
            classes={classes.map((item) => ({
              class_id: item.class_id,
              label: item.class_name || item.name || String(item.class_id),
            }))}
            timeRange={timeRange}
          />
        </Suspense>
      ) : null}
    </Box>
  );
};

export default ClassDetailsView;
