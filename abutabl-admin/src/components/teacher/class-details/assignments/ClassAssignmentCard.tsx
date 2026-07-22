import { useTranslation } from "react-i18next";
import { ClassAssignmentListItem } from "@/types/classAssignments";

export type ClassAssignmentCardProps = {
  item: ClassAssignmentListItem;
  listMode?: boolean;
  onViewDetails?: (assignmentId: number) => void;
};

const BRAND = "#23B8A2";

const STATUS_STYLES: Record<
  ClassAssignmentListItem["status"],
  { bg: string; color: string; key: string }
> = {
  active: { bg: "#E6F8F5", color: "#0F766E", key: "ASSIGNMENTS_STATUS_ACTIVE" },
  done: { bg: "#E6F8F5", color: "#23B8A2", key: "ASSIGNMENTS_STATUS_DONE" },
  overdue: { bg: "#FFEDD5", color: "#C2410C", key: "ASSIGNMENTS_STATUS_OVERDUE" },
};

const formatDueDate = (value: string | null, locale: string): string => {
  if (!value) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const ClassAssignmentCard = ({
  item,
  listMode = false,
  onViewDetails,
}: ClassAssignmentCardProps) => {
  const { t, i18n } = useTranslation();
  const statusStyle = STATUS_STYLES[item.status];
  const total = item.target_students;
  const completed = item.completed_students;
  const percent =
    typeof item.completion_percentage === "number"
      ? Math.round(item.completion_percentage)
      : total > 0
        ? Math.round((completed / total) * 100)
        : 0;
  const missingCount = Math.max(
    0,
    item.pending_students + item.overdue_students
  );
  const subtitle =
    item.subtitle ||
    (item.assignment_type === "quiz"
      ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_SUBTITLE_QUIZ", { id: item.id })
      : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_SUBTITLE_ASSIGNMENT", {
          id: item.id,
        }));

  const bannerCompleted =
    item.status === "done" || !item.has_missing_students || missingCount === 0;

  return (
    <article
      className={`flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)] ${
        listMode ? "md:flex-row md:items-stretch md:gap-6" : ""
      }`}
    >
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          listMode ? "md:justify-between" : ""
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[1.125rem] font-bold leading-tight text-[#111827]">
              {item.title || t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_UNTITLED")}
            </h3>
            <p className="mt-1 truncate text-sm text-[#6B7280]">{subtitle}</p>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {t(`TEACHER_CLASS_DETAILS.${statusStyle.key}`)}
          </span>
        </div>

        <div className="mb-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DUE_DATE")}
            </span>
            <span className="font-semibold text-[#111827]">
              {formatDueDate(item.due_at, i18n.language)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_SUBMISSIONS")}
            </span>
            <span className="font-semibold text-[#111827]">
              {completed}/{total}
            </span>
          </div>
        </div>

        <div
          className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${percent}%`, backgroundColor: BRAND }}
          />
        </div>

        <div
          className={`mb-4 rounded-[10px] px-3 py-2.5 text-sm font-semibold ${
            bannerCompleted
              ? "bg-[#E6F8F5] text-[#23B8A2]"
              : "bg-[#FEF2F2] text-[#B91C1C]"
          }`}
        >
          {bannerCompleted
            ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_BANNER_COMPLETED")
            : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_BANNER_MISSING", {
                count: missingCount,
              })}
        </div>

        <button
          type="button"
          onClick={() => onViewDetails?.(item.id)}
          disabled={!onViewDetails}
          className={`mt-auto w-full rounded-[10px] px-4 py-2.5 text-sm font-bold text-white ${
            onViewDetails
              ? "hover:opacity-95"
              : "cursor-not-allowed opacity-80"
          }`}
          style={{ backgroundColor: BRAND }}
        >
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_VIEW_DETAILS")}
        </button>
      </div>
    </article>
  );
};

export default ClassAssignmentCard;
