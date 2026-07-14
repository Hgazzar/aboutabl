import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { CircularProgress, IconButton, Popover } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getRequest } from "@/utils/fetchMethods";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import {
  ClassStandardsResponse,
  getVisibleAuditDetails,
  StandardsChartItem,
  StandardsSubjectSlug,
  StandardsTab,
} from "@/types/classStandards";

export type StandardsAnalyticsProps = {
  classId: number;
  range: ClassDetailsTimeRange;
};

const CHART_BAR_MAX_HEIGHT = 132;
const CHART_BAR_WIDTH = 48;

const DEFAULT_TABS: StandardsTab[] = [
  { subject_id: 0, slug: "letters-explorer", label: "Letter Explorer", active: true },
  { subject_id: 0, slug: "math-explorer", label: "MATH EXPLORER", active: false },
];

const formatLinkedAt = (value: string | null, locale: string) => {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const AuditInfoButton = ({
  details,
}: {
  details: ReturnType<typeof getVisibleAuditDetails>;
}) => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  if (details.length === 0) {
    return null;
  }

  const latest = details[0];

  return (
    <>
      <button
        type="button"
        aria-label={t("TEACHER_CLASS_DETAILS.STANDARDS_AUDIT_TITLE")}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#00897B] transition-colors hover:bg-[#E0F2F1]"
      >
        <InfoOutlinedIcon sx={{ fontSize: 18 }} />
      </button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 2,
            maxWidth: 320,
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
          },
        }}
      >
        <p className="mb-2 text-sm font-semibold text-[#111827]">
          {t("TEACHER_CLASS_DETAILS.STANDARDS_AUDIT_TITLE")}
        </p>
        <dl className="space-y-2 text-sm text-[#374151]">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
              {t("TEACHER_CLASS_DETAILS.STANDARDS_AUDIT_LINKED_AT")}
            </dt>
            <dd>{formatLinkedAt(latest.linked_at, i18n.language)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
              {t("TEACHER_CLASS_DETAILS.STANDARDS_AUDIT_LINK_TYPE")}
            </dt>
            <dd>
              {latest.link_type === "automatic"
                ? t("TEACHER_CLASS_DETAILS.STANDARDS_AUDIT_AUTOMATIC")
                : t("TEACHER_CLASS_DETAILS.STANDARDS_AUDIT_MANUAL")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
              {t("TEACHER_CLASS_DETAILS.STANDARDS_AUDIT_REASON")}
            </dt>
            <dd className="leading-relaxed">{latest.reason}</dd>
          </div>
          {latest.confidence_score !== null && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
                {t("TEACHER_CLASS_DETAILS.STANDARDS_AUDIT_CONFIDENCE")}
              </dt>
              <dd>{Math.round(latest.confidence_score * 100)}%</dd>
            </div>
          )}
        </dl>
      </Popover>
    </>
  );
};

const resolveBarColor = (percent: number): string => {
  if (percent >= 90) {
    return "#00897B";
  }

  if (percent >= 80) {
    return "#26A69A";
  }

  return "#FBC02D";
};

const StandardBar = ({
  item,
  onSelect,
}: {
  item: StandardsChartItem;
  onSelect: (item: StandardsChartItem) => void;
}) => {
  const barHeight = Math.max(28, Math.round((item.percent / 100) * CHART_BAR_MAX_HEIGHT));

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex shrink-0 flex-col items-center"
      style={{ width: CHART_BAR_WIDTH }}
      aria-label={`${item.label} ${item.percent}%`}
    >
      <div
        className="flex w-full items-end justify-center"
        style={{ height: CHART_BAR_MAX_HEIGHT }}
      >
        <div
          className="relative flex w-full items-end justify-center rounded-t-[10px]"
          style={{
            height: `${barHeight}px`,
            backgroundColor: resolveBarColor(item.percent),
          }}
        >
          <span className="pb-2 text-[11px] font-bold leading-none text-white">
            {item.percent}%
          </span>
        </div>
      </div>
      <span
        className="mt-2 w-full truncate text-center text-[11px] font-semibold text-[#00897B]"
        title={item.label}
      >
        {item.label}
      </span>
    </button>
  );
};

export const StandardsAnalytics = ({ classId, range }: StandardsAnalyticsProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClassStandardsResponse | null>(null);
  const [activeSubject, setActiveSubject] = useState<StandardsSubjectSlug>("letters-explorer");
  const [selectedItem, setSelectedItem] = useState<StandardsChartItem | null>(null);

  const loadStandards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = (await getRequest(
        { subject: activeSubject, range },
        `/api/dashboard/teacher/classes/${classId}/standards`
      )) as ClassStandardsResponse;

      if (!response?.status) {
        setData(null);
        setSelectedItem(null);
        return;
      }

      setData(response);

      const defaultItem =
        response.items.find((item) => item.standard_id === response.selected?.standard_id) ??
        response.items[0] ??
        null;

      setSelectedItem(defaultItem);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("TEACHER_CLASS_DETAILS.STANDARDS_LOAD_ERROR");
      setError(message);
      setData(null);
      setSelectedItem(null);
    } finally {
      setLoading(false);
    }
  }, [activeSubject, classId, range, t]);

  useEffect(() => {
    loadStandards();
  }, [loadStandards]);

  const tabs = data?.tabs?.length ? data.tabs : DEFAULT_TABS;
  const items = data?.items ?? [];

  const visibleAuditDetails = useMemo(
    () => getVisibleAuditDetails(selectedItem?.audit_details),
    [selectedItem]
  );

  const handleTabChange = (slug: StandardsSubjectSlug) => {
    if (slug === activeSubject) {
      return;
    }

    setActiveSubject(slug);
  };

  const scrollChart = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const amount = direction === "left" ? -220 : 220;
    container.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="bg-[#F7F9FA] px-6 pb-5 pt-5 md:px-8">
      <article className="rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.0625rem] font-bold leading-tight text-[#111827]">
              {t("TEACHER_CLASS_DETAILS.STANDARDS_TITLE")}
            </h2>
            <p className="mt-1 text-sm font-normal text-[#6B7280]">
              • {t("TEACHER_CLASS_DETAILS.STANDARDS_SOURCE")}
            </p>
          </div>
          <OpenInFullIcon sx={{ fontSize: 22, color: "#9CA3AF", mt: 0.25 }} />
        </div>

        {/* Subject tabs */}
        <div className="mb-4 flex flex-wrap gap-3">
          {tabs.map((tab) => {
            const isActive = tab.slug === activeSubject;

            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => handleTabChange(tab.slug)}
                className={`rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#00897B] text-white shadow-sm"
                    : "border border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#FAFAFA]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <CircularProgress size={32} sx={{ color: "#00897B" }} />
          </div>
        ) : error ? (
          <div className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-6 text-sm text-[#B91C1C]">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-4 py-10 text-center text-sm text-[#6B7280]">
            {t("TEACHER_CLASS_DETAILS.STANDARDS_EMPTY")}
          </div>
        ) : (
          <>
            {/* Selected standard detail bar */}
            {selectedItem && (
              <div className="mb-5 flex items-center rounded-[10px] bg-[#FFF5EE] px-4 py-3">
                <p className="flex-1 text-[0.9375rem] leading-relaxed text-[#111827]">
                  <span className="font-bold text-[#00897B]">
                    {selectedItem.code} - {selectedItem.percent}%
                  </span>{" "}
                  <span className="font-normal">{selectedItem.definition}</span>
                </p>
                <AuditInfoButton details={visibleAuditDetails} />
              </div>
            )}

            {/* Bar chart */}
            <div
              ref={scrollRef}
              className="standards-chart-scroll overflow-x-auto pb-1"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="flex min-w-max items-end gap-4 px-1">
                {items.map((item) => (
                  <StandardBar key={item.standard_id} item={item} onSelect={setSelectedItem} />
                ))}
              </div>
            </div>

            {/* Scroll controls */}
            <div className="mt-3 flex items-center gap-2">
              <IconButton
                size="small"
                onClick={() => scrollChart("left")}
                aria-label="Scroll left"
                sx={{ color: "#9CA3AF", p: 0.5 }}
              >
                <ChevronLeftIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <div className="h-1.5 flex-1 rounded-full bg-[#E5E7EB]">
                <div className="h-full w-1/3 rounded-full bg-[#D1D5DB]" />
              </div>
              <IconButton
                size="small"
                onClick={() => scrollChart("right")}
                aria-label="Scroll right"
                sx={{ color: "#9CA3AF", p: 0.5 }}
              >
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </div>
          </>
        )}
      </article>

      <style>{`
        .standards-chart-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .standards-chart-scroll::-webkit-scrollbar-track {
          background: #E5E7EB;
          border-radius: 999px;
        }
        .standards-chart-scroll::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 999px;
        }
      `}</style>
    </section>
  );
};

export default StandardsAnalytics;
