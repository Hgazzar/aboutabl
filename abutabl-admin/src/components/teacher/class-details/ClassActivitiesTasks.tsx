import { useCallback, useEffect, useMemo, useState } from "react";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HistoryIcon from "@mui/icons-material/History";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getRequest } from "@/utils/fetchMethods";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import {
  ACTIVITIES_TASKS_FILTERS,
  ActivitiesTasksFilter,
  ActivitiesTasksItem,
  ClassActivitiesTasksResponse,
} from "@/types/classActivitiesTasks";

export type ClassActivitiesTasksProps = {
  classId: number;
  headerTimeRange: ClassDetailsTimeRange;
};

const TAB_I18N_KEY: Record<ActivitiesTasksFilter, string> = {
  all: "TEACHER_CLASS_DETAILS.ACTIVITIES_TAB_ALL",
  pending: "TEACHER_CLASS_DETAILS.ACTIVITIES_TAB_PENDING",
  late: "TEACHER_CLASS_DETAILS.ACTIVITIES_TAB_LATE",
  completed: "TEACHER_CLASS_DETAILS.ACTIVITIES_TAB_COMPLETED",
};

const resolveEffectiveRange = (
  historyMode: boolean,
  headerTimeRange: ClassDetailsTimeRange
): ClassDetailsTimeRange => {
  if (!historyMode) {
    return "week";
  }

  return headerTimeRange === "week" ? "month" : headerTimeRange;
};

const formatDueDateLabel = (value: string, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatDueTimeLabel = (value: string, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatFullDateTime = (value: string, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const resolveTimeMeta = (
  item: ActivitiesTasksItem,
  historyMode: boolean,
  locale: string
): { primaryLabel: string; secondaryTime: string | null; tooltip: string } | null => {
  if (historyMode) {
    if (!item.due_at) {
      return null;
    }

    return {
      primaryLabel: formatDueDateLabel(item.due_at, locale),
      secondaryTime: formatDueTimeLabel(item.due_at, locale),
      tooltip: formatFullDateTime(item.due_at, locale),
    };
  }

  if (!item.relative_time) {
    return null;
  }

  const tooltipSource = item.assigned_at ?? item.opened_at ?? item.due_at;

  return {
    primaryLabel: item.relative_time,
    secondaryTime: item.due_at ? formatDueTimeLabel(item.due_at, locale) : null,
    tooltip: tooltipSource
      ? formatFullDateTime(tooltipSource, locale)
      : item.relative_time,
  };
};

export const ClassActivitiesTasks = ({
  classId,
  headerTimeRange,
}: ClassActivitiesTasksProps) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClassActivitiesTasksResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActivitiesTasksFilter>("all");
  const [historyMode, setHistoryMode] = useState(false);

  const effectiveRange = useMemo(
    () => resolveEffectiveRange(historyMode, headerTimeRange),
    [historyMode, headerTimeRange]
  );

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = (await getRequest(
        { filter: activeFilter, range: effectiveRange },
        `/api/dashboard/teacher/classes/${classId}/activities-tasks`
      )) as ClassActivitiesTasksResponse;

      if (!response?.status) {
        setData(null);
        return;
      }

      setData(response);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("TEACHER_CLASS_DETAILS.ACTIVITIES_LOAD_ERROR");
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, classId, effectiveRange, t]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const tabCounts = data?.tab_counts ?? {
    all: 0,
    pending: 0,
    late: 0,
    completed: 0,
  };

  const items = data?.items ?? [];

  const formatTabLabel = (filter: ActivitiesTasksFilter) => {
    const label = t(TAB_I18N_KEY[filter]);
    const count = tabCounts[filter];

    if (count > 0) {
      return `${label} (${count})`;
    }

    return label;
  };

  const handleHistoryToggle = () => {
    setHistoryMode((prev) => !prev);
  };

  return (
    <section className="bg-[#F7F9FA] px-6 pb-5 pt-0 md:px-8">
      <article className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-[#111827] md:text-[1.0625rem]">
            {t("TEACHER_CLASS_DETAILS.ACTIVITIES_TITLE")}
          </h2>

          <button
            type="button"
            onClick={handleHistoryToggle}
            aria-pressed={historyMode}
            aria-label={
              historyMode
                ? t("TEACHER_CLASS_DETAILS.ACTIVITIES_HISTORY_ACTIVE")
                : t("TEACHER_CLASS_DETAILS.ACTIVITIES_HISTORY")
            }
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
              historyMode
                ? "bg-[#E0F2F1] text-[#00796B] shadow-[inset_0_0_0_1px_rgba(0,121,107,0.18)]"
                : "bg-transparent text-[#9CA3AF] hover:bg-[#F9FAFB] hover:text-[#6B7280]"
            }`}
          >
            {historyMode ? (
              <HistoryIcon sx={{ fontSize: 18 }} />
            ) : (
              <HistoryOutlinedIcon sx={{ fontSize: 18 }} />
            )}
            {t("TEACHER_CLASS_DETAILS.ACTIVITIES_HISTORY")}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 rounded-xl bg-[#F3F4F6] p-1">
          <div className="flex flex-wrap gap-1">
            {ACTIVITIES_TASKS_FILTERS.map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all sm:flex-none sm:px-4 ${
                    isActive
                      ? "border border-[#E5E7EB] bg-white text-[#111827] shadow-sm"
                      : "border border-transparent bg-transparent text-[#6B7280] hover:text-[#374151]"
                  }`}
                >
                  {formatTabLabel(filter)}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="relative min-h-[220px] max-h-[320px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <CircularProgress size={28} sx={{ color: "#00A78E" }} />
            </div>
          ) : error ? (
            <div className="flex min-h-[220px] items-center justify-center px-4">
              <p className="text-center text-sm text-[#B91C1C]">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center px-4">
              <p className="text-center text-sm text-[#6B7280]">
                {historyMode
                  ? t("TEACHER_CLASS_DETAILS.EMPTY_ACTIVITIES_HISTORY")
                  : t("TEACHER_CLASS_DETAILS.EMPTY_ACTIVITIES")}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F3F4F6]">
              {items.map((item) => {
                const timeMeta = resolveTimeMeta(item, historyMode, i18n.language);

                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-3.5 first:pt-1 last:pb-1"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F9FAFB] text-[#9CA3AF]">
                        <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[0.9375rem] font-semibold text-[#111827]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#6B7280]">{item.context}</p>
                      </div>
                    </div>

                    {timeMeta ? (
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1 text-xs font-medium text-[#6B7280]">
                          <AccessTimeOutlinedIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
                          <span
                            className="cursor-default whitespace-nowrap"
                            title={timeMeta.tooltip}
                          >
                            {timeMeta.primaryLabel}
                          </span>
                        </div>

                        {timeMeta.secondaryTime ? (
                          <span
                            className="cursor-default whitespace-nowrap text-[11px] text-[#9CA3AF]"
                            title={timeMeta.tooltip}
                          >
                            {timeMeta.secondaryTime}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </article>
    </section>
  );
};

export default ClassActivitiesTasks;
