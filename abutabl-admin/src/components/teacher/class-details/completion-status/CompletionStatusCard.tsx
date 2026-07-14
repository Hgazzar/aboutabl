import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  COMPLETION_STATUS_SCOPES,
  CompletionStatusByScope,
} from "@/types/completionStatus";
import { CompletionScope } from "@/types/teacherAnalytics";
import CompletionStatusDonut from "./CompletionStatusDonut";
import CompletionStatusSkeleton from "./CompletionStatusSkeleton";
import {
  COMPLETION_STATUS_CARD_CLASS,
  COMPLETION_STATUS_COLORS,
} from "./completionStatusTheme";

export type CompletionStatusCardProps = {
  byScope: CompletionStatusByScope | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
};

const scopeLabelKey = (scope: CompletionScope) => {
  if (scope === "assignments") {
    return "TEACHER_CLASS_DETAILS.FILTER_ASSIGNMENTS";
  }
  if (scope === "quizzes") {
    return "TEACHER_CLASS_DETAILS.FILTER_QUIZZES";
  }
  return "TEACHER_CLASS_DETAILS.FILTER_ALL";
};

/**
 * Presentational card — shell/tabs/spacing matched to Overview Completion card.
 */
export const CompletionStatusCard = ({
  byScope,
  isLoading = false,
  isError = false,
  errorMessage = null,
}: CompletionStatusCardProps) => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<CompletionScope>("all");

  if (isLoading) {
    return <CompletionStatusSkeleton />;
  }

  if (isError) {
    return (
      <article className={COMPLETION_STATUS_CARD_CLASS}>
        <h2 className="mb-4 text-base font-bold text-[#111827]">
          {t("TEACHER_CLASS_DETAILS.COMPLETION_CHART")}
        </h2>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-10 text-center text-sm text-[#B91C1C]">
          {errorMessage || t("TEACHER_CLASS_DETAILS.COMPLETION_LOAD_ERROR")}
        </div>
      </article>
    );
  }

  if (!byScope || !byScope[scope]) {
    return (
      <article className={COMPLETION_STATUS_CARD_CLASS}>
        <h2 className="mb-4 text-base font-bold text-[#111827]">
          {t("TEACHER_CLASS_DETAILS.COMPLETION_CHART")}
        </h2>
        <p className="py-16 text-center text-sm text-[#6B7280]">
          {t("TEACHER_CLASS_DETAILS.EMPTY_COMPLETION")}
        </p>
      </article>
    );
  }

  const breakdown = byScope[scope];

  return (
    <article className={COMPLETION_STATUS_CARD_CLASS}>
      <h2 className="text-base font-bold text-[#111827]">
        {t("TEACHER_CLASS_DETAILS.COMPLETION_CHART")}
      </h2>

      <div
        className="mb-4 mt-4 inline-flex flex-wrap gap-0.5 self-start rounded-[10px] p-0.5"
        style={{ backgroundColor: COMPLETION_STATUS_COLORS.tabIdleBg }}
        role="tablist"
        aria-label={t("TEACHER_CLASS_DETAILS.COMPLETION_CHART")}
      >
        {COMPLETION_STATUS_SCOPES.map((item) => {
          const selected = scope === item;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setScope(item)}
              className="rounded-lg px-3 py-1 text-[0.8125rem] font-semibold transition-colors"
              style={{
                backgroundColor: selected
                  ? COMPLETION_STATUS_COLORS.tabActiveBg
                  : "transparent",
                color: selected
                  ? COMPLETION_STATUS_COLORS.tabActiveText
                  : COMPLETION_STATUS_COLORS.tabIdleText,
              }}
            >
              {t(scopeLabelKey(item))}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        <CompletionStatusDonut breakdown={breakdown} />
      </div>
    </article>
  );
};

export default CompletionStatusCard;
