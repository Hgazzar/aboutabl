import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { useTranslation } from "react-i18next";

/**
 * Placeholder only — final card shell for future Smart Insight.
 * No API, no mock insight text, no recommendations.
 */
export const SmartInsightPlaceholder = () => {
  const { t } = useTranslation();

  return (
    <article className="flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AutoAwesomeIcon sx={{ fontSize: 20, color: "#0F766E" }} />
          <h2 className="text-base font-bold text-[#111827] md:text-[1.0625rem]">
            {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT")}
          </h2>
        </div>
        <FormatQuoteIcon sx={{ fontSize: 28, color: "#99F6E4" }} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-10 text-center">
        <p className="text-sm font-medium text-[#6B7280]">
          {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_PLACEHOLDER")}
        </p>
        <p className="mt-2 text-xs text-[#9CA3AF]">
          {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_PLACEHOLDER_HINT")}
        </p>
      </div>
    </article>
  );
};

export default SmartInsightPlaceholder;
