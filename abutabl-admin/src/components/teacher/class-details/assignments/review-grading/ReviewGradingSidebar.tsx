import { RuntimeReviewQuestionView } from "@/types/quizRuntime";
import { REVIEW_BRAND, REVIEW_CARD_SHADOW } from "./reviewGradingConstants";
import {
  formatScoreFraction,
  questionStatusIcon,
  resolveQuestionStatus,
} from "./reviewGradingHelpers";

export type ReviewGradingSidebarProps = {
  rows: RuntimeReviewQuestionView[];
  activeIndex: number;
  onSelect: (index: number) => void;
  title: string;
};

export const ReviewGradingSidebar = ({
  rows,
  activeIndex,
  onSelect,
  title,
}: ReviewGradingSidebarProps) => {
  return (
    <aside
      className="sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto rounded-[16px] border border-[#EEF0F2] bg-white p-3"
      style={{ boxShadow: REVIEW_CARD_SHADOW }}
    >
      <p className="mb-2.5 px-2 text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">
        {title}
      </p>
      <nav className="space-y-1.5">
        {rows.map((row, index) => {
          const status = resolveQuestionStatus(row);
          const isActive = index === activeIndex;
          return (
            <button
              key={row.key}
              type="button"
              onClick={() => onSelect(index)}
              className={`flex w-full items-center gap-2.5 rounded-[12px] px-3 py-3 text-left transition-all ${
                isActive
                  ? "border border-[#23B8A2] bg-[#E6F8F5] shadow-sm"
                  : "border border-transparent hover:bg-[#F9FAFB]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                  isActive
                    ? "bg-white text-[#0F766E]"
                    : "bg-[#F3F4F6] text-[#111827]"
                }`}
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`text-[13px] font-extrabold ${
                      isActive ? "text-[#0F766E]" : "text-[#111827]"
                    }`}
                  >
                    Q{index + 1}
                  </span>
                  <span aria-hidden className="text-[12px]" title={status}>
                    {questionStatusIcon(status)}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#6B7280]">
                  {formatScoreFraction(row.scoreAwarded, row.maxScore)}
                </span>
              </span>
              {isActive ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: REVIEW_BRAND }}
                />
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default ReviewGradingSidebar;
