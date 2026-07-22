import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTranslation } from "react-i18next";
import { REVIEW_BRAND, REVIEW_CARD_SHADOW } from "./reviewGradingConstants";
import {
  formatQuestionTypeLabel,
  REVIEW_NA,
} from "./reviewGradingHelpers";

export type ReviewGradingNavigationProps = {
  activeIndex: number;
  total: number;
  questionType: string | null;
  maxScore: number | null;
  onPrevious: () => void;
  onNext: () => void;
};

export const ReviewGradingNavigation = ({
  activeIndex,
  total,
  questionType,
  maxScore,
  onPrevious,
  onNext,
}: ReviewGradingNavigationProps) => {
  const { t } = useTranslation();
  const progress = total > 0 ? ((activeIndex + 1) / total) * 100 : 0;

  return (
    <div
      className="rounded-[16px] border border-[#EEF0F2] bg-white px-4 py-3.5 md:px-5"
      style={{ boxShadow: REVIEW_CARD_SHADOW }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_QUESTION_PROGRESS", {
              current: activeIndex + 1,
              total,
            })}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#E6F8F5] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">
              {formatQuestionTypeLabel(questionType)}
            </span>
            <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#374151]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_MARKS", {
                count: maxScore == null ? REVIEW_NA : String(maxScore),
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={activeIndex <= 0}
            className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-[#D6D6D6] bg-white px-3 text-sm font-semibold text-[#111827] disabled:opacity-40"
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_PREVIOUS")}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={activeIndex >= total - 1}
            className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-[#D6D6D6] bg-white px-3 text-sm font-semibold text-[#111827] disabled:opacity-40"
          >
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_NEXT")}
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: REVIEW_BRAND }}
        />
      </div>
    </div>
  );
};

export default ReviewGradingNavigation;
