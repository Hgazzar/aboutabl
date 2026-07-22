import AudiotrackOutlinedIcon from "@mui/icons-material/AudiotrackOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { useTranslation } from "react-i18next";
import { RuntimeReviewQuestionView } from "@/types/quizRuntime";
import {
  collectSnapshotMedia,
  formatRichContent,
  formatSnapshotStem,
} from "@/utils/quizRuntimeDisplay";
import {
  ManualDraft,
  ReviewGradingManualGradeForm,
} from "./ReviewGradingManualGradeForm";
import {
  ReviewGradingCorrectAnswer,
  ReviewGradingStudentAnswer,
} from "./ReviewGradingStudentAnswer";
import {
  REVIEW_ACTIVE_SHADOW,
  REVIEW_CARD_SHADOW,
  STATUS_COLORS,
} from "./reviewGradingConstants";
import {
  formatQuestionTypeLabel,
  formatScoreFraction,
  REVIEW_NA,
  resolveQuestionStatus,
} from "./reviewGradingHelpers";

export type ReviewGradingQuestionPanelProps = {
  row: RuntimeReviewQuestionView;
  index: number;
  totalQuestions: number;
  draft: ManualDraft;
  saving: boolean;
  isActive?: boolean;
  canSaveGrade: boolean;
  onDraftChange: (field: keyof ManualDraft, value: string) => void;
  onSaveGrade: () => void;
};

const resultLabelKey = (row: RuntimeReviewQuestionView): string => {
  if (!row.answer) {
    return "ASSIGNMENTS_S9_RUNTIME_RESULT_UNANSWERED";
  }
  if (row.isManual && row.answer.needs_manual) {
    return "ASSIGNMENTS_S9_RUNTIME_RESULT_PENDING";
  }
  if (row.isCorrect === true) {
    return "ASSIGNMENTS_S9_RUNTIME_RESULT_CORRECT";
  }
  if (row.isCorrect === false) {
    return "ASSIGNMENTS_S9_RUNTIME_RESULT_INCORRECT";
  }
  return "ASSIGNMENTS_S9_RUNTIME_RESULT_PENDING";
};

const statusBadgeColors = (row: RuntimeReviewQuestionView) => {
  const kind = resolveQuestionStatus(row);
  return STATUS_COLORS[kind];
};

export const ReviewGradingQuestionPanel = ({
  row,
  index,
  totalQuestions,
  draft,
  saving,
  isActive = false,
  canSaveGrade,
  onDraftChange,
  onSaveGrade,
}: ReviewGradingQuestionPanelProps) => {
  const { t } = useTranslation();
  const badge = statusBadgeColors(row);
  const media = collectSnapshotMedia(row.snapshotQuestion);
  const description = row.snapshotQuestion.question_des;
  const typeKey = (row.questionType ?? "").trim().toLowerCase();
  const isSubmittedWork =
    row.isManual || typeKey === "essay" || typeKey === "upload" || typeKey === "shn";
  const showCorrectAnswer = !row.isManual && Boolean(row.correctAnswerText);

  return (
    <article
      id={`review-question-${index}`}
      className={`scroll-mt-4 rounded-[16px] border bg-white p-4 md:p-5 ${
        isActive ? "border-[#23B8A2]" : "border-[#EEF0F2]"
      }`}
      style={{
        boxShadow: isActive ? REVIEW_ACTIVE_SHADOW : REVIEW_CARD_SHADOW,
      }}
    >
      {/* Single Question Card — essay grading is part of this question, not a new one */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF0F2] pb-3">
        <div>
          <p className="text-[13px] font-extrabold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_QUESTION_PROGRESS", {
              current: index + 1,
              total: totalQuestions,
            })}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[#6B7280]">
            {formatQuestionTypeLabel(row.questionType)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[10px] bg-[#F3F4F6] px-3 py-1.5 text-[12px] font-semibold text-[#374151]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_MARKS", {
              count: row.maxScore == null ? REVIEW_NA : String(row.maxScore),
            })}
          </span>
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-bold"
            style={{
              backgroundColor: badge.bg,
              color: badge.text,
              borderColor: badge.border,
            }}
          >
            {t(`TEACHER_CLASS_DETAILS.${resultLabelKey(row)}`)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_QUESTION_BODY")}
        </p>
        <p className="mt-2 text-[16px] font-semibold leading-relaxed text-[#111827]">
          {formatSnapshotStem(row.snapshotQuestion)}
        </p>
        {description != null && formatRichContent(description) !== "—" ? (
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            {formatRichContent(description)}
          </p>
        ) : null}
        {media.length > 0 ? (
          <div className="mt-3 space-y-2">
            {media.map((item) => (
              <div
                key={`${item.kind}-${item.url}`}
                className="overflow-hidden rounded-[12px] border border-[#EEF0F2] bg-[#F9FAFB]"
              >
                <div className="flex items-center gap-2 border-b border-[#EEF0F2] px-3 py-2 text-[12px] font-semibold text-[#6B7280]">
                  {item.kind === "image" ? (
                    <ImageOutlinedIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <AudiotrackOutlinedIcon sx={{ fontSize: 16 }} />
                  )}
                  {item.label}
                </div>
                {item.kind === "image" ? (
                  <img
                    src={item.url}
                    alt=""
                    className="max-h-64 w-full object-contain bg-white p-2"
                  />
                ) : (
                  <audio controls className="w-full px-3 py-3">
                    <source src={item.url} />
                  </audio>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Student Answer — compact height (aligned with Result bar) */}
      <div
        className={`mt-4 rounded-[12px] border px-4 py-3 ${
          isSubmittedWork
            ? "border-[#99F6E4] bg-[#F8FFFD]"
            : "border-[#EEF0F2] bg-[#F9FAFB]"
        }`}
      >
        <p className="text-[12px] font-semibold text-[#9CA3AF]">
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_STUDENT_ANSWER")}
        </p>
        <div className="mt-1">
          <ReviewGradingStudentAnswer row={row} />
        </div>
      </div>

      {/* Correct Answer — only when available */}
      {showCorrectAnswer ? (
        <div className="mt-4 rounded-[12px] border border-[#A7F3D0] bg-[#ECFDF5] p-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#047857]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_CORRECT_ANSWER")}
          </p>
          <div className="mt-2">
            <ReviewGradingCorrectAnswer row={row} />
          </div>
        </div>
      ) : null}

      {/* Result + score */}
      <div className="mt-4 flex flex-wrap items-center gap-6 rounded-[12px] border border-[#EEF0F2] bg-[#F9FAFB] px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold text-[#9CA3AF]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_RESULT")}
          </p>
          <p className="mt-1 text-sm font-bold text-[#111827]">
            {t(`TEACHER_CLASS_DETAILS.${resultLabelKey(row)}`)}
          </p>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-[#9CA3AF]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_QUESTION_SCORE")}
          </p>
          <p className="mt-1 text-sm font-bold text-[#111827]">
            {formatScoreFraction(row.scoreAwarded, row.maxScore)}
          </p>
        </div>
      </div>

      {/* Teacher Grade + Teacher Feedback + Save — same question card */}
      {row.isManual ? (
        <div className="mt-5 border-t border-[#EEF0F2] pt-5">
          <ReviewGradingManualGradeForm
            row={row}
            draft={draft}
            saving={saving}
            canSaveGrade={canSaveGrade}
            onDraftChange={onDraftChange}
            onSave={onSaveGrade}
          />
        </div>
      ) : null}
    </article>
  );
};

export default ReviewGradingQuestionPanel;
