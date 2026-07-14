import { useCallback, useEffect, useRef, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import {
  StudentProfileRankingItem,
  StudentProfileRankings,
  StudentProfileRankingsScope,
} from "@/types/studentProfile";

export type StudentRankingsCardProps = {
  rankings: StudentProfileRankings;
  scope: StudentProfileRankingsScope;
  search: string;
  onScopeChange: (scope: StudentProfileRankingsScope) => void;
  onSearchChange: (value: string) => void;
};

const CARD_WIDTH = 236;
const CARD_GAP = 20;

const ordinalFromApiRank = (rank: number) => {
  const n = Number(rank) || 0;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

const rankBadgeStyle = (rank: number): { background: string; color: string } => {
  if (rank === 1) return { background: "#F1B513", color: "#FFFFFF" };
  if (rank === 2) return { background: "#0D7377", color: "#FFFFFF" };
  if (rank === 3) return { background: "#2BBBAD", color: "#FFFFFF" };
  return { background: "#E8EAED", color: "#4B5563" };
};

const performanceBadgeClass = (label: string) => {
  const key = (label || "").toLowerCase();
  if (key === "good") return "bg-[#D1FAE5] text-[#047857]";
  if (key === "very_good") return "bg-[#CCFBF1] text-[#0F766E]";
  if (key === "average") return "bg-[#E0F2FE] text-[#0369A1]";
  return "bg-[#F3F4F6] text-[#6B7280]";
};

const RankingStudentCard = ({
  item,
  showClassLabel,
}: {
  item: StudentProfileRankingItem;
  showClassLabel: boolean;
}) => {
  const { t } = useTranslation();
  const performanceKey = (item.performance_label || "").toUpperCase();
  const performanceText = performanceKey
    ? t(`TEACHER_STUDENT_PROFILE.PERFORMANCE_${performanceKey}`, {
        defaultValue: item.performance_label || "",
      })
    : "";
  const statusKey = (item.status || "").toUpperCase();
  const statusText =
    !performanceText && statusKey
      ? t(`TEACHER_STUDENT_PROFILE.STATUS_${statusKey}`, { defaultValue: "" })
      : "";
  const badgeLabel = performanceText || statusText;
  const badgeClass = performanceText
    ? performanceBadgeClass(item.performance_label || "")
    : "bg-[#F3F4F6] text-[#6B7280]";
  const badgeStyle = rankBadgeStyle(Number(item.rank) || 0);
  const score = Number(item.score_percent ?? 0);

  return (
    <article
      className={`flex shrink-0 flex-col items-center rounded-[22px] bg-white px-5 pb-5 pt-6 ${
        item.is_current
          ? "border-[3px] border-[#0F766E] shadow-[0_10px_24px_rgba(15,118,110,0.16)]"
          : "border border-[#E8D48B] shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
      }`}
      style={{ width: CARD_WIDTH, minHeight: 312 }}
    >
      <div className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full bg-[#EEF2F6] text-[28px] font-bold text-[#6B7280] ring-4 ring-[#F8FAFC]">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          (item.name || "?").slice(0, 1).toUpperCase()
        )}
      </div>

      <p
        className="mt-3.5 w-full truncate text-center text-[15px] font-bold leading-5 text-[#111827]"
        title={item.name}
      >
        {item.name}
      </p>

      <div className="mt-2 flex min-h-[22px] w-full items-center justify-center gap-2">
        {showClassLabel && item.class_label ? (
          <span className="max-w-[90px] truncate text-[12px] font-medium text-[#9CA3AF]">
            {item.class_label}
          </span>
        ) : null}
        {badgeLabel ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-4 ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-[40px] font-bold leading-none tracking-tight text-[#111827]">
        {Number.isFinite(score) ? `${Math.round(score)}%` : "—"}
      </p>

      <div
        className="mt-auto flex h-11 w-full items-center justify-center rounded-[12px] text-[15px] font-bold"
        style={badgeStyle}
      >
        {ordinalFromApiRank(Number(item.rank) || 0)}
      </div>
    </article>
  );
};

/**
 * Presentational Rankings card — API data only (no FE rank/score/filter math).
 */
export const StudentRankingsCard = ({
  rankings,
  scope,
  search,
  onScopeChange,
  onSearchChange,
}: StudentRankingsCardProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const items = rankings.items ?? [];
  const showClassLabel = scope === "all_classes";

  const allClassesRank =
    rankings.all_classes_rank ?? rankings.school_rank ?? null;
  const allClassesAvailable =
    rankings.all_classes_available ?? rankings.school_available ?? false;

  const subtitle =
    allClassesAvailable && allClassesRank != null
      ? t("TEACHER_STUDENT_PROFILE.RANK_CLASS_AND_ALL", {
          classRank: rankings.class_rank ?? "—",
          allClassesRank,
        })
      : t("TEACHER_STUDENT_PROFILE.RANK_CLASS_ONLY", {
          classRank: rankings.class_rank ?? "—",
        });

  const updateScrollProgress = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setScrollProgress(max <= 0 ? 1 : Math.min(1, node.scrollLeft / max));
  }, []);

  useEffect(() => {
    updateScrollProgress();
  }, [items.length, updateScrollProgress]);

  const scrollByCards = (direction: -1 | 1) => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction * (CARD_WIDTH + CARD_GAP),
      behavior: "smooth",
    });
  };

  return (
    <article className="overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] md:p-7">
      {/* Header: title | search | toggle — single row on lg+ */}
      <div className="mb-6 grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(200px,auto)_minmax(220px,1fr)_auto] lg:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <WorkspacePremiumIcon sx={{ fontSize: 26, color: "#F1B513" }} />
            <h2 className="text-[18px] font-bold leading-6 text-[#111827]">
              {t("TEACHER_STUDENT_PROFILE.RANKINGS")}
            </h2>
          </div>
          <p className="mt-1.5 pl-[34px] text-[13px] font-medium leading-4 text-[#9CA3AF]">
            {subtitle}
          </p>
        </div>

        <div className="relative w-full justify-self-stretch lg:max-w-[420px] lg:justify-self-center">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
            sx={{ fontSize: 20, color: "#9CA3AF" }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("TEACHER_STUDENT_PROFILE.RANKINGS_SEARCH_PLACEHOLDER")}
            className="h-12 w-full rounded-full border border-[#E5E7EB] bg-white py-2.5 pl-11 pr-5 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#24B8A2] focus:ring-2 focus:ring-[#24B8A2]/15"
          />
        </div>

        <div className="inline-flex h-11 w-fit shrink-0 items-center rounded-full bg-[#ECEFF3] p-1 lg:justify-self-end">
          <button
            type="button"
            onClick={() => onScopeChange("class")}
            className={`h-9 rounded-full px-5 text-[13px] font-semibold transition ${
              scope === "class"
                ? "bg-[#1F2937] text-white shadow-sm"
                : "bg-transparent text-[#6B7280]"
            }`}
          >
            {t("TEACHER_STUDENT_PROFILE.RANKINGS_SCOPE_CLASS")}
          </button>
          <button
            type="button"
            onClick={() => onScopeChange("all_classes")}
            className={`h-9 rounded-full px-5 text-[13px] font-semibold transition ${
              scope === "all_classes"
                ? "bg-[#1F2937] text-white shadow-sm"
                : "bg-transparent text-[#6B7280]"
            }`}
          >
            {t("TEACHER_STUDENT_PROFILE.RANKINGS_SCOPE_ALL_CLASSES")}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-14 text-center text-sm text-[#9CA3AF]">
          {t("TEACHER_STUDENT_PROFILE.EMPTY_RANKINGS")}
        </p>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            className="absolute -left-1 top-[42%] z-[2] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] shadow-[0_2px_8px_rgba(15,23,42,0.08)] md:flex"
            aria-label={t("TEACHER_STUDENT_PROFILE.PREV_STUDENT")}
          >
            <ChevronLeftIcon fontSize="small" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            className="absolute -right-1 top-[42%] z-[2] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] shadow-[0_2px_8px_rgba(15,23,42,0.08)] md:flex"
            aria-label={t("TEACHER_STUDENT_PROFILE.NEXT_STUDENT")}
          >
            <ChevronRightIcon fontSize="small" />
          </button>

          <div
            ref={scrollRef}
            onScroll={updateScrollProgress}
            className="flex gap-5 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden"
            style={{ gap: CARD_GAP }}
          >
            {items.map((item) => (
              <RankingStudentCard
                key={item.student_id}
                item={item}
                showClassLabel={showClassLabel}
              />
            ))}
          </div>

          {/* Design scroll progress bar */}
          <div className="mx-auto mt-5 h-[6px] w-full max-w-[280px] overflow-hidden rounded-full bg-[#E5E7EB]">
            <div
              className="h-full rounded-full bg-[#0F766E] transition-[width] duration-150"
              style={{
                width: `${Math.max(18, scrollProgress * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </article>
  );
};

export default StudentRankingsCard;
