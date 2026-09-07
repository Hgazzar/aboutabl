import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AssignmentDetailsAssignment,
  AssignmentDetailsStudentRow,
  AssignmentStudentCompletionStatus,
} from "@/types/classAssignments";
import AssignmentRuntimeReviewSection from "@/components/teacher/class-details/assignments/AssignmentRuntimeReviewSection";
import LearningActivitiesReviewSection from "@/components/teacher/class-details/assignments/LearningActivitiesReviewSection";
import TeacherEvaluationCard from "@/components/teacher/student-profile/TeacherEvaluationCard";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { StudentProfileTeacherEvaluation } from "@/types/studentProfile";
import { notify } from "@/utils/notify";

const BRAND = "#00A68A";
const SCORE_TILE = "#35EACF";
const CARD_SHADOW = "0 4px 16px rgba(15, 23, 42, 0.06)";

export type StudentAssignmentDetailsScreenProps = {
  assignment: AssignmentDetailsAssignment;
  students: AssignmentDetailsStudentRow[];
  studentId: number;
  classId: number;
  classLabel: string;
  onBack: () => void;
  onStudentChange: (studentId: number) => void;
};

const formatDueDate = (value: string | null, locale: string): string => {
  if (!value) {
    return "";
  }
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const STATUS_BADGE: Record<
  AssignmentStudentCompletionStatus,
  { labelKey: string; bg: string; text: string; border: string }
> = {
  submitted: {
    labelKey: "ASSIGNMENTS_S9_TAG_SUBMITTED",
    bg: "#FFFFFF",
    text: "#0F766E",
    border: "#99F6E4",
  },
  late: {
    labelKey: "ASSIGNMENTS_S8_STATUS_LATE",
    bg: "#FFFFFF",
    text: "#C2410C",
    border: "#FDBA74",
  },
  missing: {
    labelKey: "ASSIGNMENTS_S8_STATUS_MISSING",
    bg: "#FFFFFF",
    text: "#DC2626",
    border: "#FECACA",
  },
  graded: {
    labelKey: "ASSIGNMENTS_S9_TAG_GRADED",
    bg: "#FFFFFF",
    text: "#1D4ED8",
    border: "#BFDBFE",
  },
};

const formatPercentDisplay = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  return `${Math.round(Number(value))}%`;
};

const formatScorePercent = (value: number | null | undefined): string | null =>
  formatPercentDisplay(value);

const EMPTY_PERCENT = "N/A";

const EMPTY_TEACHER_EVALUATION: StudentProfileTeacherEvaluation = {
  available: false,
  notes: [],
  latest_feedback: null,
  recommendations: [],
  smart_insight: {
    available: false,
    text: null,
    generated_at: null,
    insights: [],
  },
};

/**
 * F-043S — Screen #9 pixel polish (UI only).
 */
export const StudentAssignmentDetailsScreen = ({
  assignment,
  students,
  studentId,
  classId,
  classLabel,
  onBack,
  onStudentChange,
}: StudentAssignmentDetailsScreenProps) => {
  const { t, i18n } = useTranslation();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [evalOpenSignal, setEvalOpenSignal] = useState(0);

  const notImplemented = () => {
    notify(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_NOT_IMPLEMENTED"), "info");
  };

  const {
    data: profile,
    refetch: refetchProfile,
  } = useStudentProfile({
    classId,
    studentId,
    enabled: classId > 0 && studentId > 0,
  });

  const index = Math.max(
    0,
    students.findIndex((row) => row.student_id === studentId)
  );
  const student = students[index] ?? students[0] ?? null;
  const dueRaw = formatDueDate(
    assignment.due_date ?? assignment.due_at,
    i18n.language
  );
  const subjectName =
    assignment.subject?.name ||
    t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_SUBJECT_FALLBACK");
  const title =
    assignment.title || t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_UNTITLED");

  const gradeLabel = classLabel
    ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_LABEL", {
        label: classLabel,
      })
    : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_FALLBACK");

  const statusBadge = STATUS_BADGE[student?.status ?? "missing"] ?? STATUS_BADGE.missing;
  const overallScoreText =
    formatScorePercent(student?.score_percent) ?? EMPTY_PERCENT;
  // Assignment Accuracy (this assign only) — not global accuracy from Student Profile SSOT.
  const accuracyText =
    formatPercentDisplay(
      student?.accuracy_percent ?? student?.score_percent
    ) ?? EMPTY_PERCENT;
  const completionText =
    formatPercentDisplay(student?.completion_percent) ?? "0%";
  const tasksCompletedDisplay = String(student?.tasks_completed ?? 0);
  // SSOT for "X/Y Assignments" — Summary Card + All Tasks sub-line (API only).
  const assignmentsCountText = t(
    "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_ASSIGNMENTS_COUNT",
    {
      done: student?.tasks_completed ?? 0,
      total: student?.tasks_total ?? 1,
    }
  );

  const isLearningActivities =
    assignment.module === "learning_activities" ||
    assignment.module_type === "learning_activities";

  const isLegacyQuiz =
    !isLearningActivities &&
    (assignment.assignment_type === "quiz" ||
      assignment.module === "quizes" ||
      assignment.module_type === "quizes");

  const goPrev = () => {
    if (students.length === 0 || index <= 0) {
      return;
    }
    onStudentChange(students[index - 1].student_id);
  };

  const goNext = () => {
    if (students.length === 0 || index >= students.length - 1) {
      return;
    }
    onStudentChange(students[index + 1].student_id);
  };

  if (!student) {
    return (
      <div className="bg-[#F7F9FA] px-8 py-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex h-[38px] items-center gap-2 rounded-full bg-[#EEF1F2] px-5 text-[13px] font-semibold text-[#6B7280]"
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14, color: "#6B7280" }} />
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_BACK")}
        </button>
        <div className="rounded-[16px] border border-dashed border-[#E5E7EB] bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#6B7280]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_TABLE_EMPTY")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9FA] px-8 pb-12 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex h-[38px] items-center gap-2 rounded-full bg-[#EEF1F2] px-5 text-[13px] font-semibold text-[#6B7280]"
      >
        <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14, color: "#6B7280" }} />
        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_BACK")}
      </button>

      <div className="mb-8">
        <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.01em] text-[#1A1A1A]">
          {title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-[14px] font-normal text-[#9CA3AF]">
          <span>{subjectName}</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
            {dueRaw
              ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_DUE", { date: dueRaw })
              : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_DUE_PENDING")}
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSelectorOpen((open) => !open)}
              className="inline-flex h-11 min-w-[260px] items-center gap-3 rounded-[12px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] font-semibold text-[#111827]"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6]">
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-left">{student.name}</span>
              <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
            </button>
            {selectorOpen ? (
              <div
                className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-60 w-full overflow-auto rounded-[12px] border border-[#E5E7EB] bg-white py-1"
                style={{ boxShadow: CARD_SHADOW }}
              >
                {students.map((row) => (
                  <button
                    key={row.student_id}
                    type="button"
                    onClick={() => {
                      onStudentChange(row.student_id);
                      setSelectorOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[14px] ${
                      row.student_id === student.student_id
                        ? "bg-[#E6F8F5] font-semibold text-[#0F766E]"
                        : "text-[#111827] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6]">
                      {row.photo_url ? (
                        <img src={row.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 16, color: "#6B7280" }} />
                      )}
                    </span>
                    {row.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={goPrev}
            disabled={index <= 0}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF1F2] disabled:opacity-40"
            aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_PREV")}
          >
            <ChevronLeftIcon sx={{ fontSize: 18, color: "#6B7280" }} />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index >= students.length - 1}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF1F2] disabled:opacity-40"
            aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_NEXT")}
          >
            <ChevronRightIcon sx={{ fontSize: 18, color: "#6B7280" }} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEvalOpenSignal((n) => n + 1)}
            className="inline-flex h-10 items-center justify-center rounded-[10px] px-5 text-[14px] font-bold text-white"
            style={{ backgroundColor: BRAND }}
          >
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_ADD_EVALUATION")}
          </button>
          <button
            type="button"
            onClick={notImplemented}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#D6D6D6] bg-white px-4 text-[14px] font-semibold text-[#111827]"
          >
            <EditOutlinedIcon sx={{ fontSize: 18, color: "#6B7280" }} />
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT")}
          </button>
          <button
            type="button"
            onClick={notImplemented}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#D6D6D6] bg-white px-4 text-[14px] font-semibold text-[#111827]"
          >
            <EditOutlinedIcon sx={{ fontSize: 18, color: "#6B7280" }} />
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND")}
          </button>
        </div>
      </div>

      <div
        className="mb-5 flex flex-col gap-5 rounded-[16px] border border-[#EEF0F2] bg-white p-6 md:flex-row md:items-center md:justify-between"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#00A68A]">{subjectName}</p>
          <p className="mt-1 line-clamp-2 text-[22px] font-bold leading-snug text-[#111827]">
            {title}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: statusBadge.bg,
                color: statusBadge.text,
                borderColor: statusBadge.border,
              }}
            >
              {t(`TEACHER_CLASS_DETAILS.${statusBadge.labelKey}`)}
            </span>
            <span className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
              {gradeLabel}
            </span>
            <span className="rounded-full border border-[#99F6E4] bg-[#E6F8F5] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">
              {isLearningActivities
                ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_TAG_LEARNING_ACTIVITIES")
                : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_TAG_QUIZ_ASSIGNMENT")}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#9CA3AF]">
            <span className="inline-flex items-center gap-1.5">
              <PersonOutlineOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
              {student.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
              {dueRaw
                ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_DUE", { date: dueRaw })
                : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_DUE_PENDING")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <DescriptionOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
              {assignmentsCountText}
            </span>
          </div>
        </div>

        <div
          className="mx-auto flex h-[152px] w-[152px] shrink-0 flex-col items-center justify-center rounded-[16px] md:mx-0"
          style={{ backgroundColor: SCORE_TILE }}
        >
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-white">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_OVERALL_SCORE")}
          </p>
          <p className="mt-2 text-[44px] font-bold leading-none text-[#111827]">
            {overallScoreText}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div
          className="relative min-h-[118px] rounded-[16px] border border-[#EEF0F2] bg-white px-5 py-5"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-[13px] font-semibold text-[#9CA3AF]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_ALL_TASKS")}
          </p>
          <div className="mt-3">
            <p className="text-[36px] font-bold leading-none text-[#111827]">
              {tasksCompletedDisplay}
            </p>
          </div>
          <p className="mt-2 text-[12px] font-semibold text-[#16A34A]">
            {assignmentsCountText}
          </p>
          <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF5] text-[#16A34A]">
            <ShowChartOutlinedIcon sx={{ fontSize: 22 }} />
          </span>
        </div>

        <div
          className="relative min-h-[118px] rounded-[16px] border border-[#EEF0F2] bg-white px-5 py-5"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-[13px] font-semibold text-[#9CA3AF]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_ACCURACY")}
          </p>
          <div className="mt-3">
            <p className="text-[36px] font-bold leading-none text-[#111827]">
              {accuracyText}
            </p>
          </div>
          <p className="mt-2 text-[12px] text-[#9CA3AF]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_ACCURACY_HINT")}
          </p>
          <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F8F5] text-[#23B8A2]">
            <CheckCircleOutlineIcon sx={{ fontSize: 22 }} />
          </span>
        </div>

        <div
          className="relative min-h-[118px] rounded-[16px] border border-[#EEF0F2] bg-white px-5 py-5"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-[13px] font-semibold text-[#9CA3AF]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_COMPLETION")}
          </p>
          <div className="mt-3">
            <p className="text-[36px] font-bold leading-none text-[#111827]">
              {completionText}
            </p>
          </div>
          <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#16A34A]">
            {t("TEACHER_CLASS_DETAILS.ACTIVE")}
          </p>
          <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2] text-[#F87171]">
            <GroupsOutlinedIcon sx={{ fontSize: 22 }} />
          </span>
        </div>
      </div>

      {isLearningActivities ? (
        <LearningActivitiesReviewSection
          assignId={assignment.id}
          studentId={student.student_id}
          studentName={student.name}
          studentPhotoUrl={student.photo_url}
          assignmentTitle={title}
        />
      ) : (
        <>
          {/* Quiz & Assignment */}
          <div className="mb-4">
            <h3 className="mb-2 text-[16px] font-extrabold text-[#111827]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_SECTION_QUIZ")}
            </h3>
            <div
              className="flex flex-col gap-3 rounded-[16px] border border-[#EEF0F2] bg-white p-4 sm:flex-row sm:items-center"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#E6F8F5] text-[#23B8A2]">
                <MenuBookOutlinedIcon sx={{ fontSize: 26 }} />
              </span>
              <div className="min-w-0 flex-1 rounded-[12px] bg-[#E6F8F5] px-4 py-3">
                <p className="truncate text-[13px] font-bold text-[#0F766E]">
                  {subjectName}
                </p>
                <p className="truncate text-[12px] font-extrabold uppercase tracking-wide text-[#115E59]">
                  {title}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-center sm:pl-3">
                <span className="inline-flex rounded-full bg-[#E6F8F5] px-2.5 py-1 text-[11px] font-bold uppercase text-[#0F766E]">
                  {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_COMPLETE")}
                </span>
                <div className="mt-2 flex w-full justify-center">
                  <span className="text-[18px] font-bold leading-none text-[#111827]">
                    {overallScoreText}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <AssignmentRuntimeReviewSection
            assignId={assignment.id}
            studentId={student.student_id}
            isQuiz={isLegacyQuiz}
            studentName={student.name}
            studentPhotoUrl={student.photo_url}
            assignmentTitle={title}
            quizTitle={title}
            duration={student.duration}
          />
        </>
      )}

      {/* Same evaluation API + UI as Students tab */}
      <div className="mt-4">
        <TeacherEvaluationCard
          key={student.student_id}
          classId={classId}
          studentId={student.student_id}
          openCreateSignal={evalOpenSignal}
          evaluation={
            profile?.student?.student_id === student.student_id
              ? profile.teacher_evaluation
              : EMPTY_TEACHER_EVALUATION
          }
          onMutated={() => refetchProfile()}
        />
      </div>
    </div>
  );
};

export default StudentAssignmentDetailsScreen;
