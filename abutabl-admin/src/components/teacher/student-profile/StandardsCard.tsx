import { useEffect, useMemo, useRef, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { IconButton, Popover } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  getVisibleAuditDetails,
  StandardsAuditDetail,
} from "@/types/classStandards";
import {
  StudentProfileStandardItem,
  StudentProfileStandards,
} from "@/types/studentProfile";

export type StandardsCardProps = {
  standards: StudentProfileStandards;
  onSubjectChange: (slug: string) => void;
};

const CHART_BAR_MAX_HEIGHT = 132;
const CHART_BAR_WIDTH = 48;

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
  details: StandardsAuditDetail[];
}) => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const visible = getVisibleAuditDetails(details);

  if (visible.length === 0) {
    return null;
  }

  const latest = visible[0];

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

const StandardBar = ({
  item,
  onSelect,
}: {
  item: StudentProfileStandardItem;
  onSelect: (item: StudentProfileStandardItem) => void;
}) => {
  const percent = Number(item.percent ?? item.percentage ?? 0);
  // UI layout only — bar height from API percent (not a new metric).
  const barHeight = Math.max(28, Math.round((percent / 100) * CHART_BAR_MAX_HEIGHT));
  const fill = item.color || "#D4A843";

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex shrink-0 flex-col items-center"
      style={{ width: CHART_BAR_WIDTH }}
      aria-label={`${item.code} ${percent}%`}
    >
      <div
        className="flex w-full items-end justify-center"
        style={{ height: CHART_BAR_MAX_HEIGHT }}
      >
        <div
          className="relative flex w-full items-end justify-center rounded-t-[10px]"
          style={{
            height: `${barHeight}px`,
            backgroundColor: fill,
          }}
        >
          <span className="pb-2 text-[11px] font-bold leading-none text-white">
            {percent}%
          </span>
        </div>
      </div>
      <span
        className="mt-2 w-full truncate text-center text-[11px] font-semibold text-[#00897B]"
        title={item.code}
      >
        {item.code || item.label}
      </span>
    </button>
  );
};

/**
 * Presentational Standards card — displays profile.standards as-is.
 * Colors/percents come from API; subject tabs notify parent to refetch.
 */
export const StandardsCard = ({ standards, onSubjectChange }: StandardsCardProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = standards.items ?? [];

  const initialSelected = useMemo(() => {
    if (standards.selected) {
      return (
        items.find((item) => item.standard_id === standards.selected?.standard_id) ??
        standards.selected
      );
    }
    return items[0] ?? null;
  }, [items, standards.selected]);

  const [selectedItem, setSelectedItem] = useState<StudentProfileStandardItem | null>(
    initialSelected
  );

  useEffect(() => {
    setSelectedItem(initialSelected);
  }, [initialSelected]);

  const scrollChart = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    container.scrollBy({ left: direction === "left" ? -220 : 220, behavior: "smooth" });
  };

  const selectedPercent = Number(
    selectedItem?.percent ?? selectedItem?.percentage ?? 0
  );
  const visibleAuditDetails = getVisibleAuditDetails(selectedItem?.audit_details);

  return (
    <article className="flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.0625rem] font-bold leading-tight text-[#111827]">
            {t("TEACHER_STUDENT_PROFILE.STANDARDS_TITLE")}
          </h2>
          <p className="mt-1 text-sm font-normal text-[#6B7280]">
            • {t("TEACHER_STUDENT_PROFILE.STANDARDS_SOURCE")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
          <span>{t("TEACHER_STUDENT_PROFILE.EXPAND")}</span>
          <OpenInFullIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {(standards.tabs ?? []).map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => onSubjectChange(tab.slug)}
            className={`rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab.active
                ? "bg-[#00897B] text-white shadow-sm"
                : "border border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#FAFAFA]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!standards.available || items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center text-sm text-[#9CA3AF]">
          {t("TEACHER_STUDENT_PROFILE.EMPTY_STANDARDS")}
        </p>
      ) : (
        <>
          {selectedItem ? (
            <div className="mb-5 flex items-center rounded-[10px] bg-[#FFF5EE] px-4 py-3">
              <p className="flex-1 text-[0.9375rem] leading-relaxed text-[#111827]">
                <span className="font-bold text-[#00897B]">
                  {selectedItem.code} - {selectedPercent}%
                </span>{" "}
                <span className="font-normal">
                  {selectedItem.definition || selectedItem.label}
                </span>
              </p>
              <AuditInfoButton details={visibleAuditDetails} />
            </div>
          ) : null}

          <div
            ref={scrollRef}
            className="student-standards-chart-scroll overflow-x-auto pb-1"
            style={{ scrollbarWidth: "thin" }}
          >
            <div className="flex min-w-max items-end gap-4 px-1">
              {items.map((item) => (
                <StandardBar
                  key={item.standard_id}
                  item={item}
                  onSelect={setSelectedItem}
                />
              ))}
            </div>
          </div>

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

          <style>{`
            .student-standards-chart-scroll::-webkit-scrollbar {
              height: 6px;
            }
            .student-standards-chart-scroll::-webkit-scrollbar-track {
              background: #E5E7EB;
              border-radius: 999px;
            }
            .student-standards-chart-scroll::-webkit-scrollbar-thumb {
              background: #D1D5DB;
              border-radius: 999px;
            }
          `}</style>
        </>
      )}
    </article>
  );
};

export default StandardsCard;
