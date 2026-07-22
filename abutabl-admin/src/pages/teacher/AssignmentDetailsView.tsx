import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CircularProgress from "@mui/material/CircularProgress";
import { fetchAssignmentDetails } from "@/api/classAssignmentsApi";
import ClassDetailsHeader from "@/components/teacher/class-details/ClassDetailsHeader";
import AssignmentDetailsScreen from "../../components/teacher/class-details/assignments/AssignmentDetailsScreen";
import StudentAssignmentDetailsScreen from "@/components/teacher/class-details/assignments/StudentAssignmentDetailsScreen";
import { getRequest } from "@/utils/fetchMethods";
import {
  AssignmentDetailsResponse,
  AssignmentDetailsStudentRow,
  AssignmentStudentCompletionStatus,
} from "@/types/classAssignments";
import {
  ClassDetailsTab,
  ClassDetailsTimeRange,
} from "@/types/classDetails";
import {
  TeacherClassesOverviewResponse,
  TeacherClassOverviewItem,
} from "@/types/teacherClasses";

const STATUSES: AssignmentStudentCompletionStatus[] = [
  "submitted",
  "late",
  "missing",
];

const normalizeStudentRow = (
  raw: Partial<AssignmentDetailsStudentRow>
): AssignmentDetailsStudentRow | null => {
  const studentId = Number(raw.student_id ?? 0);
  if (!studentId) {
    return null;
  }
  const statusRaw = String(raw.status ?? "missing") as AssignmentStudentCompletionStatus;
  const status = STATUSES.includes(statusRaw) ? statusRaw : "missing";

  return {
    student_id: studentId,
    name: String(raw.name ?? ""),
    photo_url: raw.photo_url ?? null,
    status,
    opened_at: raw.opened_at ?? null,
    score_percent:
      raw.score_percent === null || raw.score_percent === undefined
        ? null
        : Number(raw.score_percent),
    tasks_total:
      raw.tasks_total === null || raw.tasks_total === undefined
        ? undefined
        : Number(raw.tasks_total),
    tasks_completed:
      raw.tasks_completed === null || raw.tasks_completed === undefined
        ? undefined
        : Number(raw.tasks_completed),
    completion_percent:
      raw.completion_percent === null || raw.completion_percent === undefined
        ? null
        : Number(raw.completion_percent),
    // Assignment Accuracy (this assign only) — not Student Profile global accuracy_percent.
    accuracy_percent:
      raw.accuracy_percent === null || raw.accuracy_percent === undefined
        ? null
        : Number(raw.accuracy_percent),
    // F-046E — Assignment Details API duration label (or null → N/A).
    duration:
      raw.duration === null || raw.duration === undefined || raw.duration === ""
        ? null
        : String(raw.duration),
  };
};

/**
 * F-043R — Assignment Details (Screen #8 + #9).
 * Student rows SSOT: AssignmentService::getForClass → students[] (assigns_students).
 */
const AssignmentDetailsView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classId: classIdParam, assignmentId: assignmentIdParam } = useParams<{
    classId: string;
    assignmentId: string;
  }>();

  const classId = Number(classIdParam);
  const assignmentId = Number(assignmentIdParam);

  const [classes, setClasses] = useState<TeacherClassOverviewItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<ClassDetailsTimeRange>("week");
  const [payload, setPayload] = useState<AssignmentDetailsResponse | null>(null);
  const [students, setStudents] = useState<AssignmentDetailsStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewStudentId, setReviewStudentId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      setClassesLoading(true);
      try {
        const response = (await getRequest(
          {},
          "/api/dashboard/teacher/classes"
        )) as TeacherClassesOverviewResponse;
        if (!cancelled) {
          setClasses(Array.isArray(response?.classes) ? response.classes : []);
        }
      } catch {
        if (!cancelled) {
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
    if (!classId || !assignmentId) {
      setError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_LOAD_ERROR"));
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setReviewStudentId(null);

      try {
        const details = await fetchAssignmentDetails(classId, assignmentId);

        if (cancelled) {
          return;
        }

        if (!details?.assignment) {
          setError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_LOAD_ERROR"));
          setPayload(null);
          setStudents([]);
          return;
        }

        setPayload(details);
        const rows = Array.isArray(details.students) ? details.students : [];
        setStudents(
          rows
            .map((row) => normalizeStudentRow(row))
            .filter((row): row is AssignmentDetailsStudentRow => row != null)
        );
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message ||
              t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_LOAD_ERROR")
          );
          setPayload(null);
          setStudents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [assignmentId, classId, t]);

  const activeClass = useMemo(
    () => classes.find((item) => item.class_id === classId) ?? null,
    [classId, classes]
  );

  const classLabel =
    activeClass?.class_name ||
    activeClass?.name ||
    (classId ? `Class #${classId}` : "");

  const subjectLabel =
    payload?.assignment?.subject?.name ||
    activeClass?.grade_name ||
    activeClass?.name ||
    "";

  const studentCount =
    payload?.statistics?.target_students ?? activeClass?.student_count ?? 0;

  const goBackToAssignments = () => {
    navigate(`/teacher/classes/${classId}/assignments`);
  };

  const handleClassChange = (nextClassId: number) => {
    navigate(`/teacher/classes/${nextClassId}/assignments`);
  };

  const handleTabChange = (tab: ClassDetailsTab) => {
    navigate(`/teacher/classes/${classId}/${tab}`);
  };

  if (classesLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F7F9FA]">
        <CircularProgress size={32} sx={{ color: "#23B8A2" }} />
      </div>
    );
  }

  if (error || !payload?.assignment || !payload.statistics) {
    return (
      <div className="min-h-full bg-[#F7F9FA]">
        {activeClass ? (
          <ClassDetailsHeader
            subjectLabel={subjectLabel}
            studentCount={studentCount}
            classes={classes}
            activeClassId={classId}
            activeTab="assignments"
            timeRange={timeRange}
            onClassChange={handleClassChange}
            onTabChange={handleTabChange}
            onTimeRangeChange={setTimeRange}
            showTimeRange={false}
            showClassPills={false}
          />
        ) : null}
        <div className="px-6 py-8 md:px-8">
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm font-medium text-[#B91C1C]">
            {error || t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_LOAD_ERROR")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F7F9FA]">
      <ClassDetailsHeader
        subjectLabel={subjectLabel}
        studentCount={studentCount}
        classes={classes}
        activeClassId={classId}
        activeTab="assignments"
        timeRange={timeRange}
        onClassChange={handleClassChange}
        onTabChange={handleTabChange}
        onTimeRangeChange={setTimeRange}
        showTimeRange={false}
        showClassPills={false}
      />

      {reviewStudentId != null ? (
        <StudentAssignmentDetailsScreen
          assignment={payload.assignment}
          students={students}
          studentId={reviewStudentId}
          classId={classId}
          classLabel={classLabel}
          onBack={() => setReviewStudentId(null)}
          onStudentChange={setReviewStudentId}
        />
      ) : (
        <AssignmentDetailsScreen
          classId={classId}
          assignment={payload.assignment}
          statistics={payload.statistics}
          students={students}
          classLabel={classLabel}
          onBack={goBackToAssignments}
          onReview={setReviewStudentId}
        />
      )}
    </div>
  );
};

export default AssignmentDetailsView;
