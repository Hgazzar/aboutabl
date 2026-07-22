import CircularProgress from "@mui/material/CircularProgress";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchQuizRuntimeAttempt,
  fetchQuizRuntimeAttempts,
  submitQuizManualGrade,
  submitQuizRegrade,
} from "@/api/quizRuntimeApi";
import { ReviewGradingAttemptHeader } from "@/components/teacher/class-details/assignments/review-grading/ReviewGradingAttemptHeader";
import { ReviewGradingNavigation } from "@/components/teacher/class-details/assignments/review-grading/ReviewGradingNavigation";
import { ReviewGradingQuestionPanel } from "@/components/teacher/class-details/assignments/review-grading/ReviewGradingQuestionPanel";
import { ReviewGradingSidebar } from "@/components/teacher/class-details/assignments/review-grading/ReviewGradingSidebar";
import { ManualDraft } from "@/components/teacher/class-details/assignments/review-grading/ReviewGradingManualGradeForm";
import {
  REVIEW_BRAND,
  REVIEW_CARD_SHADOW,
} from "@/components/teacher/class-details/assignments/review-grading/reviewGradingConstants";
import {
  QuizRuntimeAnswerRow,
  QuizRuntimeAttemptMeta,
  QuizRuntimeResultRow,
  QuizRuntimeSnapshotQuestion,
  RuntimeReviewQuestionView,
} from "@/types/quizRuntime";
import { notify } from "@/utils/notify";
import {
  formatCorrectAnswer,
  formatSnapshotStem,
  formatStudentAnswer,
  isManualQuestionType,
  snapshotQuestionToDisplayShape,
} from "@/utils/quizRuntimeDisplay";

export type AssignmentRuntimeReviewSectionProps = {
  assignId: number;
  studentId: number;
  isQuiz: boolean;
  studentName?: string;
  studentPhotoUrl?: string | null;
  assignmentTitle?: string;
  quizTitle?: string;
  /** F-046E — from Assignment Details API `students[].duration` (display only). */
  duration?: string | null;
  /** F-046F — notify parent when review can no longer accept Save Grade. */
  onReviewLockChange?: (locked: boolean) => void;
};

/** Latest submitted attempt wins — teachers review the most recent submission. */
const pickAttemptId = (
  attempts: Array<{
    attempt_id: number;
    status: string;
    submitted_at: string | null;
  }>
): number | null => {
  if (attempts.length === 0) {
    return null;
  }
  const sorted = [...attempts].sort((a, b) => {
    const aTime = a.submitted_at ? Date.parse(a.submitted_at) : 0;
    const bTime = b.submitted_at ? Date.parse(b.submitted_at) : 0;
    if (bTime !== aTime) {
      return bTime - aTime;
    }
    return (b.attempt_id ?? 0) - (a.attempt_id ?? 0);
  });
  return sorted[0]?.attempt_id ?? null;
};

const buildReviewRows = (
  snapshotQuestions: QuizRuntimeSnapshotQuestion[],
  answers: QuizRuntimeAnswerRow[]
): RuntimeReviewQuestionView[] => {
  const answersByKey = new Map<string, QuizRuntimeAnswerRow>();
  answers.forEach((answer) => {
    if (answer.snapshot_question_key) {
      answersByKey.set(answer.snapshot_question_key, answer);
    }
  });

  return snapshotQuestions.map((snapshotQuestion, index) => {
    const key = snapshotQuestion.snapshot_question_key;
    const answer = answersByKey.get(key) ?? null;
    const displayQuestion = snapshotQuestionToDisplayShape(snapshotQuestion);
    const questionType = snapshotQuestion.type ?? null;
    const isManual = isManualQuestionType(
      questionType,
      answer?.needs_manual ?? false
    );
    const payload = answer?.response_payload ?? null;
    const maxScore = Number(snapshotQuestion.max_score);

    return {
      key: key || `question-${index + 1}`,
      questionId: snapshotQuestion.question_id,
      questionType,
      questionText: formatSnapshotStem(snapshotQuestion),
      studentAnswerText: answer
        ? formatStudentAnswer(displayQuestion, payload)
        : "—",
      correctAnswerText: isManual ? null : formatCorrectAnswer(displayQuestion),
      isManual,
      isCorrect: answer?.is_correct ?? null,
      maxScore: Number.isFinite(maxScore) ? maxScore : null,
      scoreAwarded:
        answer?.score_awarded === null || answer?.score_awarded === undefined
          ? null
          : Number(answer.score_awarded),
      answer,
      snapshotQuestion,
    };
  });
};

const scrollToQuestion = (index: number) => {
  const el = document.getElementById(`review-question-${index}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export const AssignmentRuntimeReviewSection = ({
  assignId,
  studentId,
  isQuiz,
  studentName = "",
  studentPhotoUrl,
  assignmentTitle = "",
  quizTitle = "",
  duration = null,
  onReviewLockChange,
}: AssignmentRuntimeReviewSectionProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [attempt, setAttempt] = useState<QuizRuntimeAttemptMeta | null>(null);
  const [result, setResult] = useState<QuizRuntimeResultRow | null>(null);
  const [rows, setRows] = useState<RuntimeReviewQuestionView[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualDrafts, setManualDrafts] = useState<Record<string, ManualDraft>>(
    {}
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [regrading, setRegrading] = useState(false);

  /** UI mirror of Backend manual-grade gate — presentation only. */
  const canSaveGrade = useMemo(() => {
    if (!attempt || !result) {
      return false;
    }
    return (
      attempt.status === "pending_manual" && Boolean(result.pending_manual)
    );
  }, [attempt, result]);

  const reviewLocked = useMemo(() => {
    if (!available || !attempt) {
      return false;
    }
    return !canSaveGrade && attempt.status === "finalized";
  }, [available, attempt, canSaveGrade]);

  useEffect(() => {
    onReviewLockChange?.(reviewLocked);
  }, [onReviewLockChange, reviewLocked]);

  const loadRuntime = useCallback(async () => {
    if (!isQuiz || !assignId || !studentId) {
      setAvailable(false);
      setAttempt(null);
      setResult(null);
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const listResponse = await fetchQuizRuntimeAttempts({
        assign_id: assignId,
        student_id: studentId,
      });
      const attempts = Array.isArray(listResponse.attempts)
        ? listResponse.attempts
        : [];
      const attemptId = pickAttemptId(attempts);
      if (!attemptId) {
        setAvailable(false);
        setAttempt(null);
        setResult(null);
        setRows([]);
        return;
      }

      const detail = await fetchQuizRuntimeAttempt(attemptId);
      if (!detail?.attempt) {
        setAvailable(false);
        setAttempt(null);
        setResult(null);
        setRows([]);
        return;
      }

      const answers = Array.isArray(detail.answers) ? detail.answers : [];
      const snapshotQuestionsRaw = detail.snapshot?.questions;
      const snapshotQuestions = Array.isArray(snapshotQuestionsRaw)
        ? snapshotQuestionsRaw
        : [];
      const reviewRows = buildReviewRows(snapshotQuestions, answers);

      setAvailable(true);
      setAttempt(detail.attempt);
      setResult(detail.result ?? null);
      setRows(reviewRows);
      const firstManual = reviewRows.findIndex((row) => row.isManual);
      setActiveIndex(firstManual >= 0 ? firstManual : 0);
      const initialDrafts: Record<string, ManualDraft> = {};
      reviewRows.forEach((row) => {
        if (!row.isManual) {
          return;
        }
        initialDrafts[row.key] = {
          score:
            row.answer?.manual_score != null
              ? String(row.answer.manual_score)
              : "",
          notes: row.answer?.teacher_comment ?? "",
        };
      });
      setManualDrafts(initialDrafts);
    } catch {
      setAvailable(false);
      setAttempt(null);
      setResult(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [assignId, isQuiz, studentId]);

  useEffect(() => {
    loadRuntime();
  }, [loadRuntime]);

  const selectQuestion = (index: number) => {
    setActiveIndex(index);
    scrollToQuestion(index);
  };

  const handleManualDraftChange = (
    key: string,
    field: keyof ManualDraft,
    value: string
  ) => {
    if (!canSaveGrade) {
      return;
    }
    setManualDrafts((current) => ({
      ...current,
      [key]: {
        score: current[key]?.score ?? "",
        notes: current[key]?.notes ?? "",
        [field]: value,
      },
    }));
  };

  const handleSaveGrade = async (row: RuntimeReviewQuestionView) => {
    if (!canSaveGrade || !attempt || !row.answer) {
      return;
    }
    const draft = manualDrafts[row.key] ?? { score: "", notes: "" };
    const manualScore = Number(draft.score);
    if (!Number.isFinite(manualScore) || manualScore < 0) {
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_MANUAL_GRADE_INVALID"),
        "error"
      );
      return;
    }

    setSavingKey(row.key);
    try {
      await submitQuizManualGrade(attempt.attempt_id, {
        row_version: attempt.row_version,
        grades: [
          {
            question_id: row.answer.question_id,
            snapshot_question_key: row.answer.snapshot_question_key,
            manual_score: manualScore,
            comment: draft.notes.trim() !== "" ? draft.notes.trim() : undefined,
          },
        ],
      });
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SAVE_GRADE_SUCCESS"),
        "success"
      );
      await loadRuntime();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SAVE_GRADE_ERROR");
      notify(message, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleRegrade = async () => {
    if (!attempt) {
      return;
    }
    setRegrading(true);
    try {
      await submitQuizRegrade(attempt.attempt_id, {
        mode: "snapshot_rules",
        reason: "Teacher regrade from assignment review",
      });
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_REGRADE_SUCCESS"),
        "success"
      );
      await loadRuntime();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_REGRADE_ERROR");
      notify(message, "error");
    } finally {
      setRegrading(false);
    }
  };

  if (!isQuiz) {
    return null;
  }

  const resolvedStudentName =
    studentName.trim() !== ""
      ? studentName
      : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_STUDENT_FALLBACK");
  const resolvedAssignmentTitle =
    assignmentTitle.trim() !== ""
      ? assignmentTitle
      : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_UNTITLED");
  const resolvedQuizTitle =
    quizTitle.trim() !== "" ? quizTitle : resolvedAssignmentTitle;

  const activeRow = rows[activeIndex] ?? null;

  return (
    <section className="mt-4 space-y-3">
      <div
        className="rounded-[16px] border border-[#EEF0F2] bg-white px-5 py-3.5 md:px-6"
        style={{ boxShadow: REVIEW_CARD_SHADOW }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[16px] font-extrabold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_REVIEW_TITLE")}
          </h3>
          {reviewLocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-[12px] font-bold text-[#047857]">
              {t(
                "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_REVIEW_COMPLETED"
              )}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_REVIEW_SUBTITLE")}
        </p>
      </div>

      {loading ? (
        <div
          className="flex min-h-[160px] items-center justify-center rounded-[16px] border border-[#EEF0F2] bg-white"
          style={{ boxShadow: REVIEW_CARD_SHADOW }}
        >
          <CircularProgress size={28} sx={{ color: REVIEW_BRAND }} />
        </div>
      ) : !available || !attempt ? (
        <div
          className="rounded-[16px] border border-[#EEF0F2] bg-white p-5"
          style={{ boxShadow: REVIEW_CARD_SHADOW }}
        >
          <p className="text-sm text-[#6B7280]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_UNAVAILABLE")}
          </p>
        </div>
      ) : (
        <>
          <ReviewGradingAttemptHeader
            studentName={resolvedStudentName}
            studentPhotoUrl={studentPhotoUrl}
            assignmentTitle={resolvedAssignmentTitle}
            quizTitle={resolvedQuizTitle}
            attempt={attempt}
            result={result}
            duration={duration}
            onRegrade={handleRegrade}
            regrading={regrading}
          />

          {rows.length === 0 ? (
            <div
              className="rounded-[16px] border border-[#EEF0F2] bg-white p-5"
              style={{ boxShadow: REVIEW_CARD_SHADOW }}
            >
              <p className="text-sm text-[#6B7280]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_NO_QUESTIONS")}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,260px)_1fr] lg:items-start">
              <ReviewGradingSidebar
                rows={rows}
                activeIndex={activeIndex}
                onSelect={selectQuestion}
                title={t(
                  "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_NAV_TITLE"
                )}
              />

              <div className="min-w-0 space-y-3">
                <ReviewGradingNavigation
                  activeIndex={activeIndex}
                  total={rows.length}
                  questionType={activeRow?.questionType ?? null}
                  maxScore={activeRow?.maxScore ?? null}
                  onPrevious={() => {
                    const next = Math.max(0, activeIndex - 1);
                    selectQuestion(next);
                  }}
                  onNext={() => {
                    const next = Math.min(rows.length - 1, activeIndex + 1);
                    selectQuestion(next);
                  }}
                />

                {activeRow ? (
                  <ReviewGradingQuestionPanel
                    key={activeRow.key}
                    row={activeRow}
                    index={activeIndex}
                    totalQuestions={rows.length}
                    isActive
                    draft={
                      manualDrafts[activeRow.key] ?? { score: "", notes: "" }
                    }
                    saving={savingKey === activeRow.key}
                    canSaveGrade={canSaveGrade}
                    onDraftChange={(field, value) =>
                      handleManualDraftChange(activeRow.key, field, value)
                    }
                    onSaveGrade={() => handleSaveGrade(activeRow)}
                  />
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default AssignmentRuntimeReviewSection;
