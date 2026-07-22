import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { useTranslation } from "react-i18next";
import {
  ClassDetailsLearningProgress,
  EMPTY_CLASS_LEARNING_PROGRESS,
} from "@/types/classDetailsOverview";

export type LearningProgressCardProps = {
  data?: ClassDetailsLearningProgress | null;
  /** When false, renders card only (Students Tab). Overview keeps outer section. */
  withSection?: boolean;
  /** Stretch to match sibling card height (Standards | Learning Progress grid). */
  fillHeight?: boolean;
};

/**
 * Shared presentational Learning Progress card.
 * Displays API fields as-is — no FE percent recalculation.
 * Used by Class Overview (class scope) and Student Profile (student scope).
 */
export const LearningProgressCard = ({
  data,
  withSection = false,
  fillHeight = false,
}: LearningProgressCardProps) => {
  const { t } = useTranslation();
  const progress = data ?? EMPTY_CLASS_LEARNING_PROGRESS;

  const activityCompleted = progress.activity?.completed ?? 0;
  const activityTotal = progress.activity?.total ?? 0;
  // Same field Overview always used — activity.percent (API has no progress_percent).
  const activityPercent = Math.min(
    100,
    Math.max(0, Number(progress.activity?.percent ?? 0))
  );
  const missingCount = progress.submissions?.missing ?? 0;
  const completedCount = progress.submissions?.completed ?? 0;
  const scorePercent = Math.round(Number(progress.score_percent ?? 0));

  const card = (
    <article
      className={
        fillHeight
          ? "flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]"
          : "rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]"
      }
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-[#111827] md:text-[1.0625rem]">
          {t("TEACHER_CLASS_DETAILS.LEARNING_PROGRESS_TITLE")}
        </h2>
        <span className="shrink-0 text-xs font-medium text-[#6B7280] md:text-sm">
          • {t("TEACHER_CLASS_DETAILS.LEARNING_PROGRESS_SOURCE")}
        </span>
      </div>

      <div
        className={
          fillHeight
            ? "flex flex-1 flex-col justify-center"
            : undefined
        }
      >
        <div className="mb-6">
          <div className="mb-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MenuBookOutlinedIcon sx={{ fontSize: 18, color: "#059669" }} />
              <span className="text-sm text-[#6B7280]">
                {t("TEACHER_CLASS_DETAILS.LEARNING_PROGRESS_ACTIVITY")}
              </span>
            </div>
            <span className="text-sm font-medium text-[#374151]">
              {activityCompleted} / {activityTotal}
            </span>
          </div>

          {/* Explicit height + inline fill color (Overview-parity). Avoids h-full
              collapsing to 0px when parent height isn’t resolved. */}
          <div
            className="w-full overflow-hidden rounded-full"
            style={{ height: 20, backgroundColor: "#E5E7EB" }}
          >
            <div
              className="rounded-full transition-all duration-300"
              style={{
                height: 20,
                width: `${activityPercent}%`,
                backgroundColor: "#059669",
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="flex min-w-[140px] items-center justify-between gap-6 rounded-xl bg-[#fef2f2] px-4 py-3">
              <span className="text-sm text-[#6B7280]">
                {t("TEACHER_CLASS_DETAILS.LEARNING_PROGRESS_MISSING")}
              </span>
              <span className="text-sm font-semibold text-[#EA580C]">
                {missingCount}
              </span>
            </div>

            <div className="flex min-w-[140px] items-center justify-between gap-6 rounded-xl bg-emerald-50/50 px-4 py-3">
              <span className="text-sm text-[#6B7280]">
                {t("TEACHER_CLASS_DETAILS.COMPLETED")}
              </span>
              <span className="text-sm font-semibold text-[#059669]">
                {completedCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <span className="text-sm text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.LEARNING_PROGRESS_SCORE")}
            </span>
            <span className="text-xl font-bold text-[#059669]">
              {scorePercent}%
            </span>
          </div>
        </div>
      </div>
    </article>
  );

  if (!withSection) {
    return card;
  }

  return (
    <section className="bg-[#F7F9FA] px-6 pb-5 pt-5 md:px-8">{card}</section>
  );
};

export default LearningProgressCard;
