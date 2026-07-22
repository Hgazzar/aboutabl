import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  AssignmentDetailsAssignment,
  AssignmentDetailsStatistics,
  AssignmentDetailsStudentRow,
  AssignmentStudentCompletionStatus,
} from "@/types/classAssignments";
import { teacherEvaluationsApi } from "@/api/teacherEvaluationsApi";
import { EvaluationFormModal } from "@/components/teacher/student-profile/evaluation/EvaluationFormModal";
import { notify } from "@/utils/notify";

/**
 * Screen #8 — Assignment Details
 * Architecture: Task completion (opened_at) ≠ Quiz grading (quiz_results).
 */

const BRAND = "#23B8A2";
const SHADOW = "0 4px 16px rgba(15, 23, 42, 0.05)";

export type AssignmentDetailsScreenProps = {
  classId: number;
  assignment: AssignmentDetailsAssignment;
  statistics: AssignmentDetailsStatistics;
  students: AssignmentDetailsStudentRow[];
  classLabel: string;
  onBack: () => void;
  onReview: (studentId: number) => void;
};

type SortKey = "name" | "status" | "score" | "date";

const STATUS_BADGE: Record<
  AssignmentStudentCompletionStatus,
  { bg: string; color: string; border: string; labelKey: string }
> = {
  submitted: {
    bg: "#E6F8F5",
    color: "#0F766E",
    border: "#99F6E4",
    labelKey: "ASSIGNMENTS_S8_STATUS_SUBMITTED",
  },
  late: {
    bg: "#FFF7ED",
    color: "#C2410C",
    border: "#FDBA74",
    labelKey: "ASSIGNMENTS_S8_STATUS_LATE",
  },
  missing: {
    bg: "#FEF2F2",
    color: "#DC2626",
    border: "#FECACA",
    labelKey: "ASSIGNMENTS_S8_STATUS_MISSING",
  },
};

const formatDate = (value: string | null, locale: string): string => {
  if (!value) return "";
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

const IconBox = ({
  color,
  bg,
  children,
}: {
  color: string;
  bg: string;
  children: React.ReactNode;
}) => (
  <span
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
    style={{ backgroundColor: bg, color }}
  >
    {children}
  </span>
);

export const AssignmentDetailsScreen = ({
  classId,
  assignment,
  statistics,
  students,
  onBack,
  onReview,
}: AssignmentDetailsScreenProps) => {
  const { t, i18n } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalStudentId, setEvalStudentId] = useState<number | null>(null);
  const [evalSaving, setEvalSaving] = useState(false);

  const isQuiz =
    assignment.assignment_type === "quiz" ||
    assignment.module === "quizes" ||
    assignment.module_type === "quizes";
  const studentsCount = Number(statistics.target_students ?? 0);
  const submittedCount = Number(statistics.completed_students ?? 0);
  const missingCount = Math.max(
    0,
    Number(statistics.pending_students ?? 0) +
      Number(statistics.overdue_students ?? 0)
  );
  const completionRate = `${Math.round(
    Number(statistics.completion_percentage ?? 0)
  )}%`;
  const averageScoreLabel =
    statistics.average_score !== null &&
    statistics.average_score !== undefined &&
    !Number.isNaN(Number(statistics.average_score))
      ? `${Math.round(Number(statistics.average_score))}%`
      : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_SCORE_NA");

  const dueRaw = formatDate(
    assignment.due_date ?? assignment.due_at,
    i18n.language
  );
  const subjectName =
    assignment.subject?.name ||
    t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_SUBJECT_FALLBACK");

  const sortedStudents = useMemo(() => {
    const rows = [...students];
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortKey === "date") {
        const da = a.opened_at ? new Date(a.opened_at).getTime() : 0;
        const db = b.opened_at ? new Date(b.opened_at).getTime() : 0;
        cmp = da - db;
      } else if (sortKey === "score" && isQuiz) {
        const sa = a.score_percent ?? -1;
        const sb = b.score_percent ?? -1;
        cmp = sa - sb;
      } else {
        cmp = a.name.localeCompare(b.name);
      }
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [students, sortAsc, sortKey, isQuiz]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
      return;
    }
    setSortKey(key);
    setSortAsc(true);
  };

  const allSelected =
    sortedStudents.length > 0 &&
    sortedStudents.every((r) => selectedIds.includes(r.student_id));

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? [] : sortedStudents.map((r) => r.student_id)
    );
  };

  const toggleOne = (id: number) => {
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  };

  const notImplemented = () => {
    notify(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_NOT_IMPLEMENTED"), "info");
  };

  const openAddEvaluation = () => {
    const targetId =
      selectedIds.length === 1
        ? selectedIds[0]
        : selectedIds.length === 0 && students.length === 1
          ? students[0].student_id
          : null;
    if (targetId == null) {
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EVAL_SELECT_STUDENT"),
        "info"
      );
      return;
    }
    setEvalStudentId(targetId);
    setEvalOpen(true);
  };

  const handleSaveEvaluation = async (noteText: string) => {
    if (evalStudentId == null) {
      return;
    }
    setEvalSaving(true);
    try {
      await teacherEvaluationsApi.create(classId, evalStudentId, noteText);
      toast.success(t("TEACHER_STUDENT_PROFILE.EVALUATION_CREATED"));
      setEvalOpen(false);
      setEvalStudentId(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { msg?: string } }; message?: string })
          ?.response?.data?.msg ||
        (err as Error)?.message ||
        t("TEACHER_STUDENT_PROFILE.EVALUATION_SAVE_ERROR");
      toast.error(message);
    } finally {
      setEvalSaving(false);
    }
  };

  const headerBtnTeal =
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#23B8A2] bg-white px-4 text-[14px] font-semibold text-[#23B8A2] transition hover:bg-[#F0FDFA]";
  const headerBtnGrey =
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-[14px] font-semibold text-[#111827] transition hover:bg-[#F9FAFB]";

  /** 4th card: Average Score (quiz) XOR Completion Rate (task). */
  const fourthStatCard = isQuiz
    ? {
        key: "average",
        label: t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_STAT_QUIZ_AVERAGE"),
        value: averageScoreLabel,
        color: BRAND,
        bg: "#E6F8F5",
        Icon: GroupsOutlinedIcon,
      }
    : {
        key: "completion",
        label: t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_STAT_AVERAGE"),
        value: completionRate,
        color: BRAND,
        bg: "#E6F8F5",
        Icon: GroupsOutlinedIcon,
      };

  const statCards = [
    {
      key: "students",
      label: t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_STAT_STUDENTS"),
      value: String(studentsCount),
      color: BRAND,
      bg: "#E6F8F5",
      Icon: GroupsOutlinedIcon,
    },
    {
      key: "submitted",
      label: t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_STAT_SUBMITTED"),
      value: String(submittedCount),
      color: "#3B82F6",
      bg: "#EFF6FF",
      Icon: HowToRegOutlinedIcon,
    },
    {
      key: "missing",
      label: t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_STAT_MISSING"),
      value: String(missingCount),
      color: BRAND,
      bg: "#E6F8F5",
      Icon: GroupsOutlinedIcon,
    },
    fourthStatCard,
  ];

  const colCount = isQuiz ? 6 : 5;

  return (
    <>
    <div className="px-6 pb-12 pt-6 md:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#EEF1F2] px-4 text-[13px] font-semibold text-[#6B7280] transition hover:bg-[#E5E7EB]"
      >
        <ArrowBackIosNewRoundedIcon sx={{ fontSize: 12 }} />
        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_BACK")}
      </button>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-extrabold leading-[1.2] tracking-tight text-[#111827] md:text-[30px]">
            {assignment.title ||
              t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_UNTITLED")}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] font-medium text-[#9CA3AF]">
            <span>{subjectName}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
              {dueRaw
                ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_DUE", { date: dueRaw })
                : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_DUE_PENDING")}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button type="button" className={headerBtnTeal} onClick={openAddEvaluation}>
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_ADD_EVALUATION")}
          </button>
          <button type="button" className={headerBtnGrey} onClick={notImplemented}>
            <EditOutlinedIcon sx={{ fontSize: 17 }} />
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT")}
          </button>
          <button type="button" className={headerBtnGrey} onClick={notImplemented}>
            <EventAvailableOutlinedIcon sx={{ fontSize: 17 }} />
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND")}
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="flex h-[112px] items-center justify-between gap-3 rounded-[16px] border border-[#F0F2F4] bg-white px-5 py-4"
            style={{ boxShadow: SHADOW }}
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#9CA3AF]">{card.label}</p>
              <p className="mt-2 text-[32px] font-extrabold leading-none tracking-tight text-[#111827]">
                {card.value}
              </p>
            </div>
            <IconBox color={card.color} bg={card.bg}>
              <card.Icon sx={{ fontSize: 22 }} />
            </IconBox>
          </div>
        ))}
      </div>

      {missingCount > 0 ? (
        <div className="mb-5 flex flex-col overflow-hidden rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3 border-l-[5px] border-l-[#F59E0B] px-4 py-3.5 sm:items-center">
            <WarningAmberRoundedIcon
              sx={{ color: "#F59E0B", fontSize: 24, flexShrink: 0 }}
            />
            <div className="min-w-0">
              <p className="text-[14px] font-bold leading-5 text-[#92400E]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_BANNER_TITLE", {
                  count: missingCount,
                })}
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-[#B45309]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_BANNER_HINT")}
              </p>
            </div>
          </div>
          <div className="px-4 pb-3.5 sm:pb-0 sm:pr-4">
            <button
              type="button"
              onClick={notImplemented}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] px-5 text-[14px] font-bold text-white sm:w-auto"
              style={{ backgroundColor: BRAND }}
            >
              <SendRoundedIcon sx={{ fontSize: 18 }} />
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_SEND")}
            </button>
          </div>
        </div>
      ) : null}

      <div
        className="overflow-hidden rounded-[16px] border border-[#EEF0F2] bg-white"
        style={{ boxShadow: SHADOW }}
      >
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: "48px" }} />
              {isQuiz ? (
                <>
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                </>
              ) : (
                <>
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "20%" }} />
                </>
              )}
            </colgroup>
            <thead className="sticky top-0 z-[1] bg-white">
              <tr className="border-b border-[#F3F4F6]">
                <th className="px-5 py-[18px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={sortedStudents.length === 0}
                    className="h-[18px] w-[18px] cursor-pointer rounded-[3px] border border-[#D1D5DB] accent-[#23B8A2] disabled:cursor-not-allowed"
                    aria-label={t(
                      "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_SELECT_ALL"
                    )}
                  />
                </th>
                <th className="px-2 py-[18px]">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]"
                  >
                    {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_COL_STUDENT")}
                  </button>
                </th>
                <th className="px-2 py-[18px]">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]"
                  >
                    {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_COL_STATUS")}
                    <UnfoldMoreIcon sx={{ fontSize: 15, color: "#CBD5E1" }} />
                  </button>
                </th>
                {isQuiz ? (
                  <th className="px-2 py-[18px]">
                    <button
                      type="button"
                      onClick={() => toggleSort("score")}
                      className="inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]"
                    >
                      {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_COL_SCORE")}
                      <UnfoldMoreIcon sx={{ fontSize: 15, color: "#CBD5E1" }} />
                    </button>
                  </th>
                ) : null}
                <th className="px-2 py-[18px]">
                  <button
                    type="button"
                    onClick={() => toggleSort("date")}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]"
                  >
                    {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_COL_DATE")}
                    <UnfoldMoreIcon sx={{ fontSize: 15, color: "#CBD5E1" }} />
                  </button>
                </th>
                <th className="px-5 py-[18px] text-left text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_COL_ACTION")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-6 py-16">
                    <div className="mx-auto flex max-w-md flex-col items-center rounded-[16px] border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-8 py-10 text-center">
                      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F8F5] text-[#23B8A2]">
                        <GroupsOutlinedIcon sx={{ fontSize: 26 }} />
                      </span>
                      <p className="text-[15px] font-bold text-[#111827]">
                        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_TABLE_EMPTY")}
                      </p>
                      <p className="mt-1.5 text-[13px] text-[#9CA3AF]">
                        {t(
                          "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_TABLE_EMPTY_HINT"
                        )}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((row) => {
                  const checked = selectedIds.includes(row.student_id);
                  const badge = STATUS_BADGE[row.status];
                  const showReassign = row.status === "missing";
                  const openedLabel = formatDate(row.opened_at, i18n.language);

                  return (
                    <tr
                      key={row.student_id}
                      className="border-b border-[#F3F4F6] last:border-b-0 transition-colors hover:bg-[#F8FAFB]"
                    >
                      <td className="h-16 px-5 align-middle">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(row.student_id)}
                          className="h-[18px] w-[18px] cursor-pointer rounded-[3px] border border-[#D1D5DB] accent-[#23B8A2]"
                          aria-label={row.name}
                        />
                      </td>
                      <td className="h-16 px-2 align-middle">
                        <span className="text-[14px] font-medium text-[#111827]">
                          {row.name}
                        </span>
                      </td>
                      <td className="h-16 px-2 align-middle">
                        <span
                          className="inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-bold uppercase tracking-wide"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            borderColor: badge.border,
                          }}
                        >
                          {t(`TEACHER_CLASS_DETAILS.${badge.labelKey}`)}
                        </span>
                      </td>
                      {isQuiz ? (
                        <td className="h-16 px-2 align-middle">
                          {row.score_percent != null ? (
                            <span className="text-[14px] font-semibold text-[#23B8A2]">
                              {`${Math.round(row.score_percent)}%`}
                            </span>
                          ) : (
                            <span className="text-[14px] font-medium text-[#9CA3AF]">
                              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_SCORE_NA")}
                            </span>
                          )}
                        </td>
                      ) : null}
                      <td className="h-16 px-2 align-middle">
                        {openedLabel ? (
                          <span className="text-[13px] text-[#9CA3AF]">
                            {openedLabel}
                          </span>
                        ) : (
                          <span className="text-[13px] font-medium text-[#9CA3AF]">
                            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_SCORE_NA")}
                          </span>
                        )}
                      </td>
                      <td className="h-16 px-5 align-middle text-left">
                        {showReassign ? (
                          <button
                            type="button"
                            onClick={notImplemented}
                            className="inline-flex h-9 min-w-[92px] items-center justify-center rounded-[10px] border border-[#FECACA] bg-[#FFF1F2] px-4 text-[13px] font-bold text-[#E11D48] transition hover:bg-[#FFE4E6]"
                          >
                            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REASSIGN")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onReview(row.student_id)}
                            className="inline-flex h-9 min-w-[92px] items-center justify-center rounded-[10px] px-5 text-[13px] font-bold text-white transition hover:opacity-90"
                            style={{ backgroundColor: BRAND }}
                          >
                            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REVIEW")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <EvaluationFormModal
      open={evalOpen}
      mode="create"
      saving={evalSaving}
      onClose={() => {
        if (evalSaving) return;
        setEvalOpen(false);
        setEvalStudentId(null);
      }}
      onSave={handleSaveEvaluation}
    />
    </>
  );
};

export default AssignmentDetailsScreen;
