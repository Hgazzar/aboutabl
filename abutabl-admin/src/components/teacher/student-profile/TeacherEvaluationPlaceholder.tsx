import { useTranslation } from "react-i18next";

const TEAL = "#24B8A2";

/**
 * Placeholder only — final card shell for future Teacher Note & Evaluation.
 * No API, no mock notes, no profile.teacher_evaluation.
 * Fixed min-height so later real content can drop in without layout shift.
 */
export const TeacherEvaluationPlaceholder = () => {
  const { t } = useTranslation();

  return (
    <article className="flex min-h-[220px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#111827] md:text-[1.0625rem]">
          {t("TEACHER_STUDENT_PROFILE.TEACHER_EVALUATION")}
        </h2>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="h-10 cursor-not-allowed rounded-[10px] px-5 text-[14px] font-semibold leading-5 text-white opacity-90"
          style={{ backgroundColor: TEAL }}
          title={t("TEACHER_STUDENT_PROFILE.TEACHER_EVALUATION_PLACEHOLDER_HINT")}
        >
          {t("TEACHER_STUDENT_PROFILE.ADD_EVALUATION")}
        </button>
      </div>

      <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center rounded-xl bg-[#F3F4F6] px-4 py-8 text-center">
        <p className="text-sm font-medium text-[#6B7280]">
          {t("TEACHER_STUDENT_PROFILE.TEACHER_EVALUATION_PLACEHOLDER")}
        </p>
        <p className="mt-2 text-xs text-[#9CA3AF]">
          {t("TEACHER_STUDENT_PROFILE.TEACHER_EVALUATION_PLACEHOLDER_HINT")}
        </p>
      </div>
    </article>
  );
};

export default TeacherEvaluationPlaceholder;
