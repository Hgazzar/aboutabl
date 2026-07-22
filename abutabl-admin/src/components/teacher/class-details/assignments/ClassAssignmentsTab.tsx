import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRequest } from "@/utils/fetchMethods";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import {
  ClassAssignmentListItem,
  ClassAssignmentsListResponse,
  ClassAssignmentsSort,
  ClassAssignmentStatusFilter,
  ClassAssignmentsViewMode,
  WizardClassOption,
  normalizeClassAssignmentCard,
} from "@/types/classAssignments";
import { ClassAssignmentCard } from "@/components/teacher/class-details/assignments/ClassAssignmentCard";
import { ClassAssignmentsSkeleton } from "@/components/teacher/class-details/assignments/ClassAssignmentsSkeleton";

/** Lazy-loaded to avoid HMR circular init with materials panel / API chunk. */
const CreateAssignmentWizardModal = lazy(() =>
  import(
    "@/components/teacher/class-details/assignments/CreateAssignmentWizardModal"
  ).then((module) => ({ default: module.CreateAssignmentWizardModal }))
);

export type ClassAssignmentsTabProps = {
  classId: number;
  classes: WizardClassOption[];
  timeRange: ClassDetailsTimeRange;
};

const BRAND = "#23B8A2";
const BRAND_FOCUS = "rgba(35, 184, 162, 0.18)";
const PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const STATUS_FILTERS: ClassAssignmentStatusFilter[] = [
  "all",
  "active",
  "done",
  "overdue",
];

const SORT_OPTIONS: ClassAssignmentsSort[] = [
  "newest",
  "oldest",
  "due_date",
  "completion",
];

/**
 * Teacher Class Details → Assignments tab.
 * SSOT: GET /api/dashboard/teacher/classes/{classId}/assignments
 */
export const ClassAssignmentsTab = ({
  classId,
  classes,
  timeRange,
}: ClassAssignmentsTabProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ClassAssignmentListItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ClassAssignmentStatusFilter>("all");
  const [sort, setSort] = useState<ClassAssignmentsSort>("newest");
  const [viewMode, setViewMode] = useState<ClassAssignmentsViewMode>("grid");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [classId, timeRange, debouncedSearch, statusFilter, sort]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string | number> = {
          range: timeRange,
          status: statusFilter,
          sort,
          page,
          per_page: PER_PAGE,
        };

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        const response = (await getRequest(
          params,
          `/api/dashboard/teacher/classes/${classId}/assignments`
        )) as ClassAssignmentsListResponse;

        if (cancelled) {
          return;
        }

        const rows = Array.isArray(response?.data) ? response.data : [];
        const normalized = rows
          .map((row) => normalizeClassAssignmentCard(row))
          .filter((row): row is ClassAssignmentListItem => row !== null);

        setItems(normalized);
        setLastPage(Math.max(1, Number(response?.last_page ?? 1)));
        setTotal(Math.max(0, Number(response?.total ?? 0)));
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LOAD_ERROR");
          setError(message || t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LOAD_ERROR"));
          setItems([]);
          setLastPage(1);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    classId,
    timeRange,
    debouncedSearch,
    statusFilter,
    sort,
    page,
    listVersion,
    t,
  ]);

  const statusLabel = useMemo(() => {
    if (statusFilter === "all") {
      return t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_FILTER_ALL_STATUSES");
    }
    return t(
      `TEACHER_CLASS_DETAILS.ASSIGNMENTS_STATUS_${statusFilter.toUpperCase()}`
    );
  }, [statusFilter, t]);

  const selectClassName =
    "appearance-none rounded-[10px] border border-[#E5E7EB] bg-[#F3F4F6] py-2.5 pl-4 pr-10 text-sm font-semibold text-[#374151] outline-none focus:border-[#23B8A2] focus:bg-white";

  return (
    <section className="bg-[#F7F9FA] px-6 pb-8 pt-6 md:px-8">
      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className="mb-5 inline-flex items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: BRAND }}
      >
        <AddIcon sx={{ fontSize: 20 }} />
        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_CREATE")}
      </button>

      {wizardOpen ? (
        <Suspense fallback={null}>
          <CreateAssignmentWizardModal
            open={wizardOpen}
            classId={classId}
            classes={classes}
            onClose={() => setWizardOpen(false)}
            onCreated={() => {
              setPage(1);
              setListVersion((current) => current + 1);
            }}
          />
        </Suspense>
      ) : null}

      <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.04)] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex min-w-0 flex-1 items-center">
            <SearchRoundedIcon
              sx={{
                fontSize: 22,
                color: "#9CA3AF",
                position: "absolute",
                left: 12,
              }}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                "TEACHER_CLASS_DETAILS.ASSIGNMENTS_SEARCH_PLACEHOLDER"
              )}
              className="w-full rounded-[10px] border border-[#E5E7EB] bg-[#F3F4F6] py-2.5 pl-11 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#23B8A2] focus:bg-white"
              style={{ boxShadow: "none" }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND_FOCUS}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </label>

          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ClassAssignmentStatusFilter)
              }
              className={selectClassName}
              aria-label={statusLabel}
            >
              {STATUS_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {value === "all"
                    ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_FILTER_ALL_STATUSES")
                    : t(
                        `TEACHER_CLASS_DETAILS.ASSIGNMENTS_STATUS_${value.toUpperCase()}`
                      )}
                </option>
              ))}
            </select>
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 20,
                color: "#9CA3AF",
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as ClassAssignmentsSort)
              }
              className={selectClassName}
              aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_SORT_LABEL")}
            >
              {SORT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(
                    `TEACHER_CLASS_DETAILS.ASSIGNMENTS_SORT_${value.toUpperCase()}`
                  )}
                </option>
              ))}
            </select>
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 20,
                color: "#9CA3AF",
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>

          <div className="inline-flex shrink-0 rounded-[10px] border border-[#E5E7EB] bg-[#F3F4F6] p-1">
            <button
              type="button"
              aria-label={t("TEACHER_CLASSES.GRID_VIEW")}
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-[#23B8A2] shadow-sm"
                  : "text-[#9CA3AF] hover:text-[#6B7280]"
              }`}
            >
              <GridViewOutlinedIcon sx={{ fontSize: 20 }} />
            </button>
            <button
              type="button"
              aria-label={t("TEACHER_CLASSES.LIST_VIEW")}
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-white text-[#23B8A2] shadow-sm"
                  : "text-[#9CA3AF] hover:text-[#6B7280]"
              }`}
            >
              <ViewListOutlinedIcon sx={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <ClassAssignmentsSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-10 text-center text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F3F4F6]/70 px-6 py-16 text-center">
          <p className="text-base font-semibold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_EMPTY_TITLE")}
          </p>
          <p className="mt-2 text-sm text-[#6B7280]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_EMPTY_HINT")}
          </p>
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-5 md:grid-cols-2"
                : "flex flex-col gap-4"
            }
          >
            {items.map((item) => (
              <ClassAssignmentCard
                key={item.id}
                item={item}
                listMode={viewMode === "list"}
                onViewDetails={(id) =>
                  navigate(`/teacher/classes/${classId}/assignments/${id}`)
                }
              />
            ))}
          </div>

          {lastPage > 1 ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#6B7280]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_PAGE_OF", {
                  page,
                  last: lastPage,
                  total,
                })}
              </p>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#374151] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_PREV")}
                </button>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() =>
                    setPage((current) => Math.min(lastPage, current + 1))
                  }
                  className="rounded-[10px] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: BRAND }}
                >
                  {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_NEXT")}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default ClassAssignmentsTab;
