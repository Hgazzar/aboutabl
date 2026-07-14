import { useTranslation } from "react-i18next";
import { ClassesPerformancePoint } from "@/types/classesPerformance";
import ClassesPerformanceChart from "./ClassesPerformanceChart";
import ClassesPerformanceSkeleton from "./ClassesPerformanceSkeleton";
import {
  CLASSES_PERFORMANCE_CARD_CLASS,
  CLASSES_PERFORMANCE_COLORS,
} from "./classesPerformanceTheme";

export type ClassesPerformanceCardProps = {
  points: ClassesPerformancePoint[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
};

/**
 * Presentational card — shell/spacing matched to Overview PerformanceLineCard.
 */
export const ClassesPerformanceCard = ({
  points,
  isLoading = false,
  isError = false,
  errorMessage = null,
}: ClassesPerformanceCardProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <ClassesPerformanceSkeleton />;
  }

  if (isError) {
    return (
      <article className={CLASSES_PERFORMANCE_CARD_CLASS}>
        <h2 className="mb-5 text-base font-bold text-[#111827] md:text-[1.0625rem]">
          {t("TEACHER_CLASS_DETAILS.PERFORMANCE_CHART")}
        </h2>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-10 text-center text-sm text-[#B91C1C]">
          {errorMessage || t("TEACHER_CLASS_DETAILS.PERFORMANCE_LOAD_ERROR")}
        </div>
      </article>
    );
  }

  return (
    <article className={CLASSES_PERFORMANCE_CARD_CLASS}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111827] md:text-[1.0625rem]">
            {t("TEACHER_CLASS_DETAILS.PERFORMANCE_CHART")}
          </h2>
          <p
            className="mt-1 text-sm font-medium"
            style={{ color: CLASSES_PERFORMANCE_COLORS.subtitle }}
          >
            {t("TEACHER_CLASS_DETAILS.PERFORMANCE_CHART_SUBTITLE")}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4 pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CLASSES_PERFORMANCE_COLORS.classLine }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: CLASSES_PERFORMANCE_COLORS.legendLabel }}
            >
              {t("TEACHER_CLASS_DETAILS.LEGEND_CLASS")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: CLASSES_PERFORMANCE_COLORS.allClassesLine,
              }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: CLASSES_PERFORMANCE_COLORS.legendLabel }}
            >
              {t("TEACHER_CLASS_DETAILS.LEGEND_ALL_CLASSES")}
            </span>
          </div>
        </div>
      </div>

      <ClassesPerformanceChart points={points} />
    </article>
  );
};

export default ClassesPerformanceCard;
