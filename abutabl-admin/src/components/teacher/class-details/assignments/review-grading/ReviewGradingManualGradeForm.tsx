import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useTranslation } from "react-i18next";
import { RuntimeReviewQuestionView } from "@/types/quizRuntime";
import { REVIEW_BRAND } from "./reviewGradingConstants";

export type ManualDraft = {
  score: string;
  notes: string;
};

export type ReviewGradingManualGradeFormProps = {
  row: RuntimeReviewQuestionView;
  draft: ManualDraft;
  saving: boolean;
  /** False when attempt is finalized — mirrors Backend gate (UI only). */
  canSaveGrade: boolean;
  onDraftChange: (field: keyof ManualDraft, value: string) => void;
  onSave: () => void;
};

export const ReviewGradingManualGradeForm = ({
  row,
  draft,
  saving,
  canSaveGrade,
  onDraftChange,
  onSave,
}: ReviewGradingManualGradeFormProps) => {
  const { t } = useTranslation();
  const fieldsLocked = !row.answer || !canSaveGrade;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={`manual-grade-${row.key}`}
          className="mb-2 block text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]"
        >
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_MANUAL_GRADE")}
        </label>
        <input
          id={`manual-grade-${row.key}`}
          type="number"
          min={0}
          step="0.01"
          value={draft.score}
          readOnly={fieldsLocked}
          disabled={fieldsLocked}
          onChange={(event) => {
            if (fieldsLocked) {
              return;
            }
            onDraftChange("score", event.target.value);
          }}
          placeholder={t(
            "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_MANUAL_GRADE_PLACEHOLDER"
          )}
          className="h-12 w-full max-w-[220px] rounded-[14px] border border-[#E5E7EB] bg-[#F3F4F6] px-4 text-[16px] font-bold text-[#111827] outline-none focus:border-[#23B8A2] focus:bg-white disabled:cursor-default disabled:opacity-80"
        />
      </div>

      <div>
        <label
          htmlFor={`teacher-notes-${row.key}`}
          className="mb-2 block text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]"
        >
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_TEACHER_NOTES")}
        </label>
        <textarea
          id={`teacher-notes-${row.key}`}
          rows={4}
          value={draft.notes}
          readOnly={fieldsLocked}
          disabled={fieldsLocked}
          onChange={(event) => {
            if (fieldsLocked) {
              return;
            }
            onDraftChange("notes", event.target.value);
          }}
          placeholder={t(
            "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_TEACHER_NOTES_PLACEHOLDER"
          )}
          className="w-full resize-none rounded-[14px] border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm leading-relaxed text-[#111827] outline-none focus:border-[#23B8A2] focus:bg-white disabled:cursor-default disabled:opacity-80"
        />
      </div>

      <div className="flex justify-end pt-1">
        {canSaveGrade ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !row.answer}
            className="h-11 min-w-[140px] rounded-[10px] px-6 text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: REVIEW_BRAND }}
          >
            {saving
              ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SAVING")
              : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SAVE_GRADE")}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 text-[12px] font-bold text-[#047857]">
            <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_GRADE_SAVED")}
          </span>
        )}
      </div>
    </div>
  );
};

export default ReviewGradingManualGradeForm;
