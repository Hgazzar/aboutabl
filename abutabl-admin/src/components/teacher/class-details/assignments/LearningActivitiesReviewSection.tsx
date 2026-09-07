import CircularProgress from "@mui/material/CircularProgress";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchLearningActivitiesReview,
  finalizeParentAssignment,
  LearningActivityReviewRow,
  LearningActivitiesReviewPayload,
  submitLearningActivityManualGrade,
} from "@/api/classAssignmentsApi";
import AssignmentRuntimeReviewSection from "@/components/teacher/class-details/assignments/AssignmentRuntimeReviewSection";
import { notify } from "@/utils/notify";

const CARD_SHADOW = "0 4px 16px rgba(15, 23, 42, 0.06)";
const BRAND = "#00A68A";

export type LearningActivitiesReviewSectionProps = {
  assignId: number;
  studentId: number;
  studentName: string;
  studentPhotoUrl?: string | null;
  assignmentTitle: string;
};

const TYPE_ICON: Record<string, typeof MenuBookOutlinedIcon> = {
  ebook: MenuBookOutlinedIcon,
  game: SportsEsportsOutlinedIcon,
  worksheet: DescriptionOutlinedIcon,
  quiz: QuizOutlinedIcon,
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Math.round(Number(value))}%`;
};

const isTerminalStatus = (status: string | undefined): boolean => {
  if (!status) {
    return false;
  }
  return ["completed", "graded", "submitted"].includes(status);
};

const canManualGrade = (row: LearningActivityReviewRow): boolean => {
  if (row.activity_type !== "worksheet") {
    return false;
  }
  if (row.grading_mode !== "manual") {
    return false;
  }
  const status = row.submission?.status ?? "";
  return status === "submitted" || status === "graded";
};

/**
 * Screen #9 Multi-Activity review — data from
 * GET /api/assigns/{assignId}/learning_activities/review.
 * Activity identity always comes from assign_activity_id.
 */
export const LearningActivitiesReviewSection = ({
  assignId,
  studentId,
  studentName,
  studentPhotoUrl,
  assignmentTitle,
}: LearningActivitiesReviewSectionProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<LearningActivitiesReviewPayload | null>(
    null
  );
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<
    Record<number, { score: string; feedback: string }>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const load = useCallback(async () => {
    if (!assignId) {
      setPayload(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLearningActivitiesReview(assignId);
      if (!data) {
        setError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_LOAD_ERROR"));
        setPayload(null);
        return;
      }
      setPayload(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_LOAD_ERROR")
      );
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [assignId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const activities = useMemo(() => {
    if (!payload) {
      return [] as LearningActivityReviewRow[];
    }
    const studentRow = payload.students.find(
      (row) => row.student_id === studentId
    );
    const rows = studentRow?.activities ?? payload.activities ?? [];
    return [...rows].sort((a, b) => a.sort_order - b.sort_order);
  }, [payload, studentId]);

  const parentStudentRow = useMemo(() => {
    if (!payload) {
      return null;
    }
    return (
      payload.students.find((row) => row.student_id === studentId) ?? null
    );
  }, [payload, studentId]);

  const parentSubmissionStatus = String(
    parentStudentRow?.submission_status ?? "active"
  ).toLowerCase();
  const canFinalizeParent = parentSubmissionStatus === "submitted";
  const parentAlreadyGraded = parentSubmissionStatus === "graded";

  useEffect(() => {
    const firstQuiz = activities.find((row) => row.activity_type === "quiz");
    setExpandedQuizId(firstQuiz?.assign_activity_id ?? null);
  }, [activities, studentId]);

  useEffect(() => {
    const next: Record<number, { score: string; feedback: string }> = {};
    activities.forEach((row) => {
      if (!canManualGrade(row)) {
        return;
      }
      next[row.assign_activity_id] = {
        score:
          row.submission?.score != null ? String(row.submission.score) : "",
        feedback: row.submission?.teacher_feedback ?? "",
      };
    });
    setGradeDrafts(next);
  }, [activities]);

  const statusLabel = (status: string | undefined): string => {
    if (!status) {
      return t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_STATUS_PENDING");
    }
    const key = `ASSIGNMENTS_S9_LA_STATUS_${status.toUpperCase()}`;
    const translated = t(`TEACHER_CLASS_DETAILS.${key}`);
    if (translated === `TEACHER_CLASS_DETAILS.${key}`) {
      return status.replace(/_/g, " ");
    }
    return translated;
  };

  const typeLabel = (type: string): string => {
    const key = `ASSIGNMENTS_S9_LA_TYPE_${type.toUpperCase()}`;
    const translated = t(`TEACHER_CLASS_DETAILS.${key}`);
    if (translated === `TEACHER_CLASS_DETAILS.${key}`) {
      return type;
    }
    return translated;
  };

  const resultText = (row: LearningActivityReviewRow): string => {
    const sub = row.submission;
    if (!sub) {
      return t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_NO_SUBMISSION");
    }
    if (row.activity_type === "ebook") {
      const completeness =
        sub.completeness != null ? sub.completeness : sub.percent;
      return t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_COMPLETENESS", {
        value: formatPercent(completeness),
      });
    }
    if (row.activity_type === "game" || row.activity_type === "quiz") {
      if (sub.percent != null) {
        return t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_ACCURACY", {
          value: formatPercent(sub.percent),
        });
      }
      if (sub.score != null) {
        const max =
          sub.max_score != null && Number(sub.max_score) > 0
            ? String(sub.max_score)
            : "100";
        return t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_SCORE", {
          score: sub.score,
          max,
        });
      }
    }
    if (row.activity_type === "worksheet") {
      if (sub.percent != null) {
        return t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_SCORE_PERCENT", {
          value: formatPercent(sub.percent),
        });
      }
      return statusLabel(sub.status);
    }
    return statusLabel(sub.status);
  };

  const handleSaveManualGrade = async (row: LearningActivityReviewRow) => {
    const draft = gradeDrafts[row.assign_activity_id] ?? {
      score: "",
      feedback: "",
    };
    const score = Number(draft.score);
    if (!Number.isFinite(score) || score < 0) {
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_GRADE_INVALID"),
        "error"
      );
      return;
    }

    setSavingId(row.assign_activity_id);
    try {
      const response = await submitLearningActivityManualGrade(
        row.assign_activity_id,
        {
          student_id: studentId,
          score,
          max_score: 100,
          percent: Math.min(100, Math.round(score)),
          feedback: draft.feedback.trim() || undefined,
        }
      );
      if (response?.status === false) {
        throw new Error(
          response.msg ||
            t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_GRADE_ERROR")
        );
      }
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_GRADE_SUCCESS"),
        "success"
      );
      await load();
    } catch (err: unknown) {
      notify(
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_GRADE_ERROR"),
        "error"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleFinalizeParent = async () => {
    if (!canFinalizeParent || finalizing) {
      return;
    }
    setFinalizing(true);
    try {
      const response = await finalizeParentAssignment(assignId, studentId);
      if (response?.status === false) {
        throw new Error(
          response.msg ||
            t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_FINALIZE_ERROR")
        );
      }
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_FINALIZE_SUCCESS"),
        "success"
      );
      await load();
    } catch (err: unknown) {
      notify(
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_FINALIZE_ERROR"),
        "error"
      );
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div
        className="mb-4 flex min-h-[120px] items-center justify-center rounded-[16px] border border-[#EEF0F2] bg-white"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <CircularProgress size={28} sx={{ color: BRAND }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mb-4 rounded-[16px] border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm font-medium text-[#B91C1C]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div
        className="mb-4 rounded-[16px] border border-dashed border-[#E5E7EB] bg-white px-5 py-8 text-center text-sm font-semibold text-[#6B7280]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_EMPTY")}
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[16px] font-extrabold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_SECTION_TITLE")}
          </h3>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {parentAlreadyGraded
              ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_PARENT_STATUS_GRADED")
              : canFinalizeParent
                ? t(
                    "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_PARENT_STATUS_SUBMITTED"
                  )
                : t(
                    "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_PARENT_STATUS_ACTIVE"
                  )}
          </p>
        </div>
        {canFinalizeParent ? (
          <button
            type="button"
            disabled={finalizing}
            onClick={() => void handleFinalizeParent()}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] px-4 text-[14px] font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            {finalizing
              ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SAVING")
              : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_RETURN_ASSIGNMENT")}
          </button>
        ) : null}
      </div>

      {activities.map((row) => {
        const Icon = TYPE_ICON[row.activity_type] ?? DescriptionOutlinedIcon;
        const status = row.submission?.status;
        const done = isTerminalStatus(status);
        const showManual = canManualGrade(row);
        const draft = gradeDrafts[row.assign_activity_id] ?? {
          score: "",
          feedback: "",
        };
        const isQuiz = row.activity_type === "quiz";
        const quizExpanded = expandedQuizId === row.assign_activity_id;

        return (
          <div key={row.assign_activity_id} className="space-y-2">
            <div
              className="rounded-[16px] border border-[#EEF0F2] bg-white p-4"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#E6F8F5] text-[#23B8A2]">
                  <Icon sx={{ fontSize: 26 }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">
                    {typeLabel(String(row.activity_type))}
                    {" · "}
                    {String(row.grading_mode || "").replace(/_/g, " ")}
                  </p>
                  <p className="truncate text-[15px] font-bold text-[#111827]">
                    {row.title}
                  </p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">
                    {resultText(row)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                      done
                        ? "bg-[#E6F8F5] text-[#0F766E]"
                        : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {statusLabel(status)}
                  </span>
                  {isQuiz ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedQuizId((current) =>
                          current === row.assign_activity_id
                            ? null
                            : row.assign_activity_id
                        )
                      }
                      className="text-[13px] font-semibold text-[#00A68A] hover:underline"
                    >
                      {quizExpanded
                        ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_HIDE_QUIZ")
                        : t(
                            "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_OPEN_QUIZ_REVIEW"
                          )}
                    </button>
                  ) : null}
                </div>
              </div>

              {showManual ? (
                <div className="mt-4 grid gap-3 border-t border-[#F3F4F6] pt-4 md:grid-cols-[140px_1fr_auto]">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">
                      {t(
                        "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_SCORE"
                      )}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.score}
                      onChange={(event) =>
                        setGradeDrafts((current) => ({
                          ...current,
                          [row.assign_activity_id]: {
                            ...draft,
                            score: event.target.value,
                          },
                        }))
                      }
                      className="h-10 w-full rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] text-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#6B7280]">
                      {t(
                        "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_FEEDBACK"
                      )}
                    </label>
                    <input
                      type="text"
                      value={draft.feedback}
                      onChange={(event) =>
                        setGradeDrafts((current) => ({
                          ...current,
                          [row.assign_activity_id]: {
                            ...draft,
                            feedback: event.target.value,
                          },
                        }))
                      }
                      className="h-10 w-full rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] text-[#111827]"
                      placeholder={t(
                        "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_FEEDBACK_PLACEHOLDER"
                      )}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={savingId === row.assign_activity_id}
                      onClick={() => void handleSaveManualGrade(row)}
                      className="inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-[14px] font-bold text-white disabled:opacity-60"
                      style={{ backgroundColor: BRAND }}
                    >
                      {savingId === row.assign_activity_id
                        ? t(
                            "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SAVING"
                          )
                        : t(
                            "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_SAVE_GRADE"
                          )}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {isQuiz && quizExpanded ? (
              <AssignmentRuntimeReviewSection
                assignId={assignId}
                studentId={studentId}
                isQuiz
                quizId={row.activity_id}
                studentName={studentName}
                studentPhotoUrl={studentPhotoUrl}
                assignmentTitle={assignmentTitle}
                quizTitle={row.title}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default LearningActivitiesReviewSection;
