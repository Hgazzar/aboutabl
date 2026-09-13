import { useEffect, useMemo, useState } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useTranslation } from "react-i18next";
import { StudentProfileActivityItem } from "@/types/studentProfile";
import { StudentProfileHighlight } from "@/utils/teacherAlertNavigation";

export type AssignmentFilterTab = "all" | "pending" | "missing" | "completed";

export type StudentAssignmentsCardProps = {
  items: StudentProfileActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  /** F-047 — open Missing tab for overdue deep-links. */
  highlight?: StudentProfileHighlight;
  canReview?: (item: StudentProfileActivityItem) => boolean;
  onReview?: (item: StudentProfileActivityItem) => void;
  onReminder?: (item: StudentProfileActivityItem) => void;
  onAssignHomework?: () => void;
};

const LIST_MAX_HEIGHT = 280;

/** Normalize API status / status_badge → design badge key. */
const resolveBadgeKey = (item: StudentProfileActivityItem): string => {
  const raw = String(item.status_badge || item.status || "pending").toLowerCase();
  if (raw === "submitted" || raw === "completed") return "submitted";
  if (raw === "missing" || raw === "late") return "missing";
  return "pending";
};

const badgeClass = (badge: string) => {
  if (badge === "submitted") return "bg-[#D1FAE5] text-[#047857]";
  if (badge === "missing") return "bg-[#FEE2E2] text-[#DC2626]";
  return "bg-[#FFEDD5] text-[#C2410C]";
};

const formatDue = (dueAt: string | null) => {
  if (!dueAt) return null;
  try {
    return new Date(dueAt).toISOString().slice(0, 10);
  } catch {
    return dueAt;
  }
};

/**
 * Presentational — tabs filter API rows by status only (no status recalculation).
 * Missing tab = status === late; Completed = status === completed.
 * Header stays fixed; list body scrolls internally.
 */
export const StudentAssignmentsCard = ({
  items,
  isLoading = false,
  isError = false,
  errorMessage = null,
  highlight = null,
  canReview,
  onReview,
  onReminder,
  onAssignHomework,
}: StudentAssignmentsCardProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AssignmentFilterTab>(() =>
    highlight === "overdue" || highlight === "missing" ? "missing" : "all"
  );

  useEffect(() => {
    if (highlight === "overdue" || highlight === "missing") {
      setTab("missing");
    }
  }, [highlight]);

  const filtered = useMemo(() => {
    if (tab === "completed") {
      return items.filter((item) => item.status === "completed");
    }
    if (tab === "missing") {
      return items.filter((item) => item.status === "late");
    }
    if (tab === "pending") {
      return items.filter((item) => item.status === "pending");
    }
    return items;
  }, [items, tab]);

  if (isLoading) {
    return null;
  }

  return (
    <article className="flex h-full max-h-[420px] min-h-[320px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#111827]">
          {t("TEACHER_STUDENT_PROFILE.ASSIGNMENTS")}
        </h2>

        <div
          className="inline-flex rounded-[10px] bg-[#F3F4F6] p-1"
          role="tablist"
          aria-label={t("TEACHER_STUDENT_PROFILE.ASSIGNMENTS")}
        >
          {(
            [
              ["all", "FILTER_ALL"],
              ["pending", "FILTER_PENDING"],
              ["missing", "FILTER_MISSING"],
              ["completed", "FILTER_COMPLETED"],
            ] as const
          ).map(([value, key]) => {
            const selected = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(value)}
                className={`rounded-lg px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors ${
                  selected
                    ? "bg-white text-[#111827] shadow-sm"
                    : "bg-transparent text-[#6B7280]"
                }`}
              >
                {t(`TEACHER_STUDENT_PROFILE.${key}`)}
              </button>
            );
          })}
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-8 text-center text-sm text-[#B91C1C]">
          {errorMessage || t("TEACHER_STUDENT_PROFILE.ASSIGNMENTS_LOAD_ERROR")}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#9CA3AF]">
          {t("TEACHER_STUDENT_PROFILE.EMPTY_ASSIGNMENTS")}
        </p>
      ) : (
        <ul
          className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
          style={{ maxHeight: LIST_MAX_HEIGHT }}
        >
          {filtered.map((item) => {
            const badge = resolveBadgeKey(item);
            const due = formatDue(item.due_at);
            const isMissing = badge === "missing";
            const reviewEnabled = canReview ? canReview(item) : !isMissing;

            return (
              <li
                key={item.id}
                className={`rounded-xl border bg-white px-4 py-3 ${
                  isMissing &&
                  (highlight === "overdue" || highlight === "missing")
                    ? "border-[#FCA5A5] bg-[#FEF2F2] ring-1 ring-[#FECACA]"
                    : "border-[#E5E7EB]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#111827]">
                      {item.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {due ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
                          <AccessTimeIcon sx={{ fontSize: 14 }} />
                          {t("TEACHER_STUDENT_PROFILE.DUE")}: {due}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass(
                          badge
                        )}`}
                      >
                        {t(
                          `TEACHER_STUDENT_PROFILE.BADGE_${badge.toUpperCase()}`
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {isMissing ? (
                      <button
                        type="button"
                        onClick={() => onReminder?.(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#F5E6C8] px-3 py-1.5 text-xs font-semibold text-[#92400E] transition hover:bg-[#F0D9A8]"
                      >
                        <NotificationsNoneIcon sx={{ fontSize: 16 }} />
                        {t("TEACHER_STUDENT_PROFILE.REMINDER")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={!reviewEnabled}
                      title={
                        reviewEnabled
                          ? undefined
                          : t(
                              "TEACHER_STUDENT_PROFILE.NO_SUBMISSION_TO_REVIEW"
                            )
                      }
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!reviewEnabled) {
                          return;
                        }
                        onReview?.(item);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] transition hover:border-[#D1D5DB] hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#E5E7EB] disabled:hover:bg-white"
                    >
                      <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                      {t("TEACHER_STUDENT_PROFILE.REVIEW")}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onAssignHomework?.()}
        className="mt-4 w-full shrink-0 rounded-xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0D9488]"
      >
        {t("TEACHER_STUDENT_PROFILE.ASSIGN_HOMEWORK")}
      </button>
    </article>
  );
};

export default StudentAssignmentsCard;
