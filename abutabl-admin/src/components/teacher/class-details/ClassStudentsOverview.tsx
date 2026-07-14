import { useCallback, useEffect, useMemo, useState } from "react";
import RemoveIcon from "@mui/icons-material/Remove";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useTranslation } from "react-i18next";
import { getRequest } from "@/utils/fetchMethods";
import { ClassDetailsTimeRange } from "@/types/classDetails";
import {
  ClassStudentsOverviewResponse,
  StudentsOverviewItem,
  StudentsOverviewOrder,
  StudentsOverviewPerformanceLabel,
  StudentsOverviewSortField,
  StudentsOverviewStatus,
} from "@/types/classStudentsOverview";

export type ClassStudentsOverviewProps = {
  classId: number;
  headerTimeRange: ClassDetailsTimeRange;
  onOpenStudentProfile?: (studentId: number) => void;
};

type SortableColumn = {
  field: Exclude<StudentsOverviewSortField, "name">;
  labelKey: string;
  align?: "left" | "center" | "right";
};

const SORTABLE_COLUMNS: SortableColumn[] = [
  { field: "performance", labelKey: "TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_COL_PERFORMANCE", align: "left" },
  { field: "score", labelKey: "TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_COL_SCORE", align: "center" },
  { field: "status", labelKey: "TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_COL_STATUS", align: "center" },
  { field: "rank", labelKey: "TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_COL_RANK", align: "center" },
];

const headerAlignClass = (align: SortableColumn["align"] = "left") => {
  if (align === "center") {
    return "text-center";
  }

  if (align === "right") {
    return "text-right";
  }

  return "text-left";
};

const DualSortArrows = ({
  active,
  order,
}: {
  active: boolean;
  order: StudentsOverviewOrder;
}) => (
  <span
    className={`ml-1 inline-flex shrink-0 select-none items-center gap-0 text-[11px] leading-none ${
      active ? "text-[#6B7280]" : "text-[#C4C9D1]"
    }`}
    aria-hidden
  >
    <span className={active && order === "asc" ? "text-[#374151]" : ""}>↑</span>
    <span className={active && order === "desc" ? "text-[#374151]" : ""}>↓</span>
  </span>
);

const AVATAR_COLORS = [
  "#E0F2F1",
  "#E8EAF6",
  "#FFF3E0",
  "#FCE4EC",
  "#E3F2FD",
  "#F3E5F5",
];

const AVATAR_TEXT_COLORS = [
  "#00796B",
  "#3949AB",
  "#EF6C00",
  "#C2185B",
  "#1565C0",
  "#7B1FA2",
];

const avatarPalette = (studentId: number) => {
  const index = Math.abs(studentId) % AVATAR_COLORS.length;

  return {
    bg: AVATAR_COLORS[index],
    color: AVATAR_TEXT_COLORS[index],
  };
};

const performanceBarColor = (percent: number) => {
  if (percent >= 85) {
    return "#00897B";
  }

  if (percent >= 70) {
    return "#00A78E";
  }

  if (percent >= 50) {
    return "#F59E0B";
  }

  return "#EF4444";
};

const statusBadgeClass = (status: StudentsOverviewStatus) => {
  switch (status) {
    case "good":
      return "border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]";
    case "average":
      return "border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]";
    case "needs_attention":
      return "border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]";
    default:
      return "border border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]";
  }
};

const performanceLabelClass = (label: StudentsOverviewPerformanceLabel) => {
  if (label === "very_good" || label === "good") {
    return "text-[#059669]";
  }

  if (label === "average") {
    return "text-[#D97706]";
  }

  return "text-[#DC2626]";
};

const TrendIcon = ({ trend }: { trend: StudentsOverviewItem["performance"]["trend"] }) => {
  if (trend === "up") {
    return <TrendingUpIcon sx={{ fontSize: 14 }} />;
  }

  if (trend === "down") {
    return <TrendingDownIcon sx={{ fontSize: 14 }} />;
  }

  return <RemoveIcon sx={{ fontSize: 14 }} />;
};

const TableSkeleton = () => (
  <div className="space-y-3 px-1 py-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex animate-pulse items-center gap-4 border-b border-[#F3F4F6] pb-4">
        <div className="h-10 w-10 rounded-full bg-[#E5E7EB]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-[#E5E7EB]" />
          <div className="h-2 w-20 rounded bg-[#F3F4F6]" />
        </div>
        <div className="hidden h-3 w-24 rounded bg-[#E5E7EB] sm:block" />
        <div className="hidden h-3 w-12 rounded bg-[#E5E7EB] md:block" />
        <div className="hidden h-6 w-16 rounded-full bg-[#E5E7EB] md:block" />
        <div className="hidden h-3 w-8 rounded bg-[#E5E7EB] lg:block" />
      </div>
    ))}
  </div>
);

export const ClassStudentsOverview = ({
  classId,
  headerTimeRange,
  onOpenStudentProfile,
}: ClassStudentsOverviewProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClassStudentsOverviewResponse | null>(null);
  const [sort, setSort] = useState<StudentsOverviewSortField>("rank");
  const [order, setOrder] = useState<StudentsOverviewOrder>("asc");

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = (await getRequest(
        { range: headerTimeRange, sort, order },
        `/api/dashboard/teacher/classes/${classId}/students-overview`
      )) as ClassStudentsOverviewResponse;

      if (!response?.status) {
        setData(null);
        return;
      }

      setData(response);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_LOAD_ERROR");
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [classId, headerTimeRange, order, sort, t]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const items = data?.items ?? [];
  const totalStudents = data?.meta?.total_students ?? items.length;

  const handleSort = (field: StudentsOverviewSortField) => {
    if (sort === field) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSort(field);
    setOrder(field === "name" || field === "rank" ? "asc" : "desc");
  };

  const handleProfileClick = (studentId: number) => {
    onOpenStudentProfile?.(studentId);
  };

  const subtitle = useMemo(
    () => t("TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_COUNT", { count: totalStudents }),
    [t, totalStudents]
  );

  return (
    <section className="bg-[#F7F9FA] px-6 pb-5 pt-0 md:px-8">
      <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="border-b border-[#F3F4F6] px-6 py-5">
          <h2 className="text-[1.125rem] font-bold uppercase leading-tight tracking-[0.06em] text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_TITLE")}
          </h2>
          <p className="mt-1.5 text-xs font-normal text-[#9CA3AF]">{subtitle}</p>
        </div>

        {loading ? (
          <div className="px-6 py-4">
            <TableSkeleton />
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] items-center justify-center px-6 py-8">
            <p className="text-center text-sm text-[#B91C1C]">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <p className="text-sm font-medium text-[#374151]">
              {t("TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_EMPTY")}
            </p>
            <p className="mt-1 max-w-sm text-xs text-[#9CA3AF]">
              {t("TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_EMPTY_HINT")}
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>

              <thead className="sticky top-0 z-10 border-b border-[#E8ECF0] bg-[#F3F4F6]">
                <tr>
                  <th className="whitespace-nowrap px-6 py-3.5 text-left align-middle text-[12px] font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                    {t("TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_COL_STUDENT")}
                  </th>

                  {SORTABLE_COLUMNS.map((column) => {
                    const isActive = sort === column.field;
                    const align = headerAlignClass(column.align);

                    return (
                      <th
                        key={column.field}
                        className={`whitespace-nowrap px-3 py-3.5 align-middle text-[12px] font-bold uppercase tracking-[0.08em] text-[#6B7280] ${align}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(column.field)}
                          className={`inline-flex items-center whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.08em] text-[#6B7280] transition-colors hover:text-[#374151] ${
                            column.align === "center" ? "mx-auto" : ""
                          } ${column.align === "right" ? "ml-auto" : ""} ${
                            isActive ? "text-[#374151]" : ""
                          }`}
                        >
                          <span className="leading-none">{t(column.labelKey)}</span>
                          <DualSortArrows active={isActive} order={order} />
                        </button>
                      </th>
                    );
                  })}

                  <th className="whitespace-nowrap px-6 py-3.5 text-right align-middle text-[12px] font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                    {t("TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_COL_PROFILE")}
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {items.map((student) => {
                  const palette = avatarPalette(student.student_id);
                  const barColor = performanceBarColor(student.performance.percent);

                  return (
                    <tr
                      key={student.student_id}
                      className="border-b border-[#F3F4F6] last:border-b-0"
                    >
                      <td className="min-w-0 px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                              style={{ backgroundColor: palette.bg, color: palette.color }}
                            >
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#111827]">
                              {student.name}
                            </p>
                            <p className="truncate text-xs text-[#9CA3AF]">{student.class_label}</p>
                          </div>
                        </div>
                      </td>

                      <td className="min-w-0 px-3 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-9 text-sm font-semibold text-[#111827]">
                              {Math.round(student.performance.percent)}%
                            </span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(0, student.performance.percent))}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                          </div>

                          <div
                            className={`flex items-center gap-1 text-xs font-medium ${performanceLabelClass(
                              student.performance.label
                            )}`}
                          >
                            <TrendIcon trend={student.performance.trend} />
                            <span>
                              {t(
                                `TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_PERF_${student.performance.label.toUpperCase()}`
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-center">
                        <span className="text-sm font-bold text-[#111827]">
                          {student.score.has_data
                            ? `${Math.round(student.score.percent)}%`
                            : "—"}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide ${statusBadgeClass(
                            student.status
                          )}`}
                        >
                          {t(
                            `TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_STATUS_${student.status.toUpperCase()}`
                          )}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-center">
                        <span className="text-sm font-bold text-[#111827]">#{student.rank}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleProfileClick(student.student_id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F9FAFB] hover:text-[#374151]"
                          aria-label={t("TEACHER_CLASS_DETAILS.STUDENTS_OVERVIEW_VIEW_PROFILE")}
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
};

export default ClassStudentsOverview;
