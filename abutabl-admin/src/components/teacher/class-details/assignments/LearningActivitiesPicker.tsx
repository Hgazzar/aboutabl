import { useEffect, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircularProgress from "@mui/material/CircularProgress";
import { useTranslation } from "react-i18next";
import {
  fetchLearningActivityBooks,
  fetchLearningActivityItems,
  fetchLearningActivitySections,
  LearningActivityBook,
  LearningActivityItem,
  LearningActivitySection,
  LearningActivitySelection,
  MAX_LEARNING_ACTIVITIES,
} from "@/api/classAssignmentsApi";

type BrowserLevel = "books" | "sections" | "activities";

export type LearningActivitiesPickerProps = {
  schoolId: number;
  selected: LearningActivitySelection[];
  onChange: (next: LearningActivitySelection[]) => void;
  disabled?: boolean;
};

const activityKey = (type: string, id: number) => `${type}:${id}`;

/**
 * Book (Subject) → Section → Activities browser.
 * Unified selection model; max 10 activities.
 */
export const LearningActivitiesPicker = ({
  schoolId,
  selected,
  onChange,
  disabled = false,
}: LearningActivitiesPickerProps) => {
  const { t } = useTranslation();
  const [level, setLevel] = useState<BrowserLevel>("books");
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<LearningActivityBook[]>([]);
  const [sections, setSections] = useState<LearningActivitySection[]>([]);
  const [items, setItems] = useState<LearningActivityItem[]>([]);
  const [book, setBook] = useState<LearningActivityBook | null>(null);
  const [section, setSection] = useState<LearningActivitySection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedKeys = useMemo(
    () => new Set(selected.map((row) => activityKey(row.activity_type, row.activity_id))),
    [selected]
  );

  useEffect(() => {
    if (schoolId <= 0) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchLearningActivityBooks(schoolId);
        if (!cancelled) {
          setBooks(rows);
        }
      } catch {
        if (!cancelled) {
          setError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_LOAD_ERROR"));
          setBooks([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [schoolId, t]);

  const openBook = async (nextBook: LearningActivityBook) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchLearningActivitySections(schoolId, nextBook.id);
      setBook(nextBook);
      setSections(rows);
      setSection(null);
      setItems([]);
      setLevel("sections");
    } catch {
      setError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_LOAD_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  const openSection = async (nextSection: LearningActivitySection) => {
    if (!book) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchLearningActivityItems(
        schoolId,
        book.id,
        nextSection.key
      );
      setSection(nextSection);
      setItems(rows);
      setLevel("activities");
    } catch {
      setError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_LOAD_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (level === "activities") {
      setLevel("sections");
      setItems([]);
      setSection(null);
      return;
    }
    if (level === "sections") {
      setLevel("books");
      setSections([]);
      setBook(null);
    }
  };

  const toggleActivity = (item: LearningActivityItem) => {
    if (disabled) {
      return;
    }
    const key = activityKey(item.activity_type, item.activity_id);
    const exists = selectedKeys.has(key);
    if (exists) {
      onChange(
        selected.filter(
          (row) =>
            !(
              row.activity_type === item.activity_type &&
              row.activity_id === item.activity_id
            )
        )
      );
      return;
    }
    if (selected.length >= MAX_LEARNING_ACTIVITIES) {
      return;
    }
    if (selected.length > 0 && selected[0].subject_id && selected[0].subject_id !== item.subject_id) {
      setError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_SAME_BOOK_ONLY"));
      return;
    }
    onChange([
      ...selected,
      {
        activity_type: item.activity_type,
        activity_id: item.activity_id,
        title: item.title,
        grading_mode: item.grading_mode,
        subject_id: item.subject_id,
      },
    ]);
    setError(null);
  };

  const atMax = selected.length >= MAX_LEARNING_ACTIVITIES;

  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_BROWSER_TITLE")}
          </p>
          <p className="text-xs text-[#6B7280]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_SELECTED_COUNT", {
              count: selected.length,
              max: MAX_LEARNING_ACTIVITIES,
            })}
          </p>
        </div>
        {level !== "books" ? (
          <button
            type="button"
            onClick={goBack}
            disabled={disabled || loading}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#374151]"
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_BACK")}
          </button>
        ) : null}
      </div>

      {book || section ? (
        <p className="mb-2 truncate text-xs font-medium text-[#0F766E]">
          {[book?.name, section?.label].filter(Boolean).join(" / ")}
        </p>
      ) : null}

      {error ? (
        <p className="mb-2 text-xs text-[#B91C1C]">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <CircularProgress size={28} sx={{ color: "#23B8A2" }} />
        </div>
      ) : (
        <ul className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
          {level === "books" &&
            books.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void openBook(row)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#111827] hover:border-[#23B8A2]"
                >
                  <span className="truncate">{row.name}</span>
                  <span className="text-xs text-[#9CA3AF]">
                    {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_BOOK")}
                  </span>
                </button>
              </li>
            ))}

          {level === "sections" &&
            sections.map((row) => (
              <li key={row.key}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void openSection(row)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#111827] hover:border-[#23B8A2]"
                >
                  <span>{row.label}</span>
                  <span className="text-xs text-[#6B7280]">{row.count}</span>
                </button>
              </li>
            ))}

          {level === "activities" &&
            items.map((row) => {
              const key = activityKey(row.activity_type, row.activity_id);
              const isSelected = selectedKeys.has(key);
              const blocked = !isSelected && atMax;
              return (
                <li key={key}>
                  <button
                    type="button"
                    disabled={disabled || blocked}
                    onClick={() => toggleActivity(row)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm ${
                      isSelected
                        ? "border-[#23B8A2] bg-[#ECFDF5] text-[#047857]"
                        : "border-[#E5E7EB] bg-white text-[#111827]"
                    } ${blocked ? "opacity-45" : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {row.title}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                        {row.activity_type} · {row.grading_mode.replace(/_/g, " ")}
                      </span>
                    </span>
                    {isSelected ? (
                      <CheckCircleIcon sx={{ fontSize: 20, color: "#047857" }} />
                    ) : null}
                  </button>
                </li>
              );
            })}

          {!loading &&
          ((level === "books" && books.length === 0) ||
            (level === "sections" && sections.length === 0) ||
            (level === "activities" && items.length === 0)) ? (
            <li className="py-6 text-center text-sm text-[#9CA3AF]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_EMPTY")}
            </li>
          ) : null}
        </ul>
      )}

      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-3">
          {selected.map((row) => (
            <button
              key={activityKey(row.activity_type, row.activity_id)}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange(
                  selected.filter(
                    (item) =>
                      !(
                        item.activity_type === row.activity_type &&
                        item.activity_id === row.activity_id
                      )
                  )
                )
              }
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[11px] font-semibold text-[#0F766E]"
              title={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_REMOVE")}
            >
              <span className="truncate">{row.title}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default LearningActivitiesPicker;
