import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { useTranslation } from "react-i18next";
import {
  QuizRuntimeAttemptMeta,
  QuizRuntimeResultRow,
} from "@/types/quizRuntime";
import {
  REVIEW_BRAND,
  REVIEW_CARD_SHADOW,
  REVIEW_STAT_SHADOW,
  STATUS_COLORS,
} from "./reviewGradingConstants";
import {
  formatDateTime,
  isZeroSecondDurationLabel,
  REVIEW_NA,
  resolveAttemptStatus,
} from "./reviewGradingHelpers";

export type ReviewGradingAttemptHeaderProps = {
  studentName: string;
  studentPhotoUrl?: string | null;
  assignmentTitle: string;
  quizTitle: string;
  attempt: QuizRuntimeAttemptMeta;
  result: QuizRuntimeResultRow | null;
  /** F-046E — Assignment Details API `duration` (already formatted). */
  duration?: string | null;
  onRegrade?: () => void;
  regrading?: boolean;
};

const ATTEMPT_STATUS_KEYS: Record<
  ReturnType<typeof resolveAttemptStatus>,
  string
> = {
  pending_manual: "ASSIGNMENTS_S9_RUNTIME_STATUS_PENDING_MANUAL",
  passed: "ASSIGNMENTS_S9_RUNTIME_STATUS_PASSED",
  failed: "ASSIGNMENTS_S9_RUNTIME_STATUS_FAILED",
  completed: "ASSIGNMENTS_S9_RUNTIME_STATUS_COMPLETED",
};

export const ReviewGradingAttemptHeader = ({
  studentName,
  studentPhotoUrl,
  assignmentTitle,
  quizTitle,
  attempt,
  result,
  duration = null,
  onRegrade,
  regrading = false,
}: ReviewGradingAttemptHeaderProps) => {
  const { t, i18n } = useTranslation();
  const attemptStatus = resolveAttemptStatus(attempt, result);
  const statusColors =
    attemptStatus === "passed"
      ? STATUS_COLORS.correct
      : attemptStatus === "failed"
        ? STATUS_COLORS.incorrect
        : attemptStatus === "pending_manual"
          ? STATUS_COLORS.pending
          : STATUS_COLORS.unanswered;

  const durationRaw =
    duration != null && String(duration).trim() !== ""
      ? String(duration).trim()
      : null;
  const durationLabel = durationRaw
    ? isZeroSecondDurationLabel(durationRaw)
      ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_DURATION_LT_1_SEC")
      : durationRaw
    : REVIEW_NA;
  const overallScore = result
    ? `${Math.round(result.percentage)}% (${result.score}/${result.max_score})`
    : REVIEW_NA;

  return (
    <div
      className="rounded-[16px] border border-[#EEF0F2] bg-white p-5 md:p-6"
      style={{ boxShadow: REVIEW_CARD_SHADOW }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6]">
            {studentPhotoUrl ? (
              <img
                src={studentPhotoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <PersonOutlineOutlinedIcon sx={{ fontSize: 28, color: REVIEW_BRAND }} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-bold text-[#111827]">{studentName}</p>
            <p className="mt-1 text-sm text-[#6B7280]">{assignmentTitle}</p>
            <p className="text-sm font-semibold text-[#374151]">{quizTitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              borderColor: statusColors.border,
            }}
          >
            {t(`TEACHER_CLASS_DETAILS.${ATTEMPT_STATUS_KEYS[attemptStatus]}`)}
          </span>
          {onRegrade ? (
            <button
              type="button"
              onClick={onRegrade}
              disabled={regrading}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#D6D6D6] bg-white px-4 text-sm font-semibold text-[#111827] disabled:opacity-60"
            >
              {regrading
                ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_REGRADING")
                : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_REGRADE")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <HeaderStat
          label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_ATTEMPT_NUMBER")}
          value={
            attempt.attempt_no != null
              ? String(attempt.attempt_no)
              : String(attempt.attempt_id)
          }
        />
        <HeaderStat
          label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SUBMITTED_AT")}
          value={formatDateTime(attempt.submitted_at, i18n.language)}
        />
        <HeaderStat
          label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_DURATION")}
          value={durationLabel}
        />
        <HeaderStat
          label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_OVERALL_SCORE")}
          value={overallScore}
        />
        <HeaderStat
          label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_ATTEMPT_STATUS")}
          value={attempt.status?.trim() ? attempt.status : REVIEW_NA}
        />
      </div>
    </div>
  );
};

const HeaderStat = ({ label, value }: { label: string; value: string }) => (
  <div
    className="rounded-[14px] border border-[#EEF0F2] bg-[#F9FAFB] px-4 py-3.5"
    style={{ boxShadow: REVIEW_STAT_SHADOW }}
  >
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
      {label}
    </p>
    <p className="mt-2 text-[15px] font-bold leading-snug text-[#111827]">
      {value}
    </p>
  </div>
);

export default ReviewGradingAttemptHeader;
