import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTranslation } from "react-i18next";
import { StudentProfileActivityItem } from "@/types/studentProfile";

export type StudentQuizzesCardProps = {
  items: StudentProfileActivityItem[];
  averagePercent: number | null;
  averageAvailable: boolean;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
};

type QuizScoreTone = "excellent" | "good" | "average" | "below";

const LIST_MAX_HEIGHT = 280;

const formatDate = (value: string | null) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const formatScore = (score: number) => {
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

/** Display-only bands aligned with Quizzes mockup (not SSOT grading). */
const resolveScoreTone = (score: number): QuizScoreTone => {
  if (score >= 90) return "excellent";
  if (score >= 80) return "good";
  if (score >= 70) return "average";
  return "below";
};

const scoreToneClasses: Record<
  QuizScoreTone,
  { score: string; label: string }
> = {
  excellent: { score: "text-[#0F766E]", label: "text-[#14B8A6]" },
  good: { score: "text-[#2563EB]", label: "text-[#60A5FA]" },
  average: { score: "text-[#D97706]", label: "text-[#F59E0B]" },
  below: { score: "text-[#DC2626]", label: "text-[#F87171]" },
};

const scoreToneLabelKey: Record<QuizScoreTone, string> = {
  excellent: "QUIZ_SCORE_EXCELLENT",
  good: "QUIZ_SCORE_GOOD",
  average: "QUIZ_SCORE_AVERAGE",
  below: "QUIZ_SCORE_BELOW",
};

/**
 * Presentational — average_percent from API only (no FE average math).
 * Score colors / qualitative labels are UI-only from score bands.
 */
export const StudentQuizzesCard = ({
  items,
  averagePercent,
  averageAvailable,
  isLoading = false,
  isError = false,
  errorMessage = null,
}: StudentQuizzesCardProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return null;
  }

  return (
    <article className="flex h-full max-h-[420px] min-h-[320px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#111827]">
          {t("TEACHER_STUDENT_PROFILE.QUIZZES")}
        </h2>

        {averageAvailable && averagePercent != null ? (
          <span className="rounded-full bg-[#D1FAE5] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#047857]">
            {t("TEACHER_STUDENT_PROFILE.AVERAGE")} : {formatScore(averagePercent)}%
          </span>
        ) : (
          <span className="rounded-full bg-[#F3F4F6] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#6B7280]">
            {t("TEACHER_STUDENT_PROFILE.AVERAGE")}: —
          </span>
        )}
      </div>

      {isError ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-8 text-center text-sm text-[#B91C1C]">
          {errorMessage || t("TEACHER_STUDENT_PROFILE.QUIZZES_LOAD_ERROR")}
        </div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#9CA3AF]">
          {t("TEACHER_STUDENT_PROFILE.EMPTY_QUIZZES")}
        </p>
      ) : (
        <ul
          className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
          style={{ maxHeight: LIST_MAX_HEIGHT }}
        >
          {items.map((item) => {
            const dateLabel = formatDate(item.due_at || item.assigned_at);
            const hasScore = item.score != null;
            const tone = hasScore ? resolveScoreTone(Number(item.score)) : null;
            const toneClass = tone ? scoreToneClasses[tone] : null;

            return (
              <li
                key={item.id}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111827]">
                      {item.title}
                    </p>
                    {dateLabel ? (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                        {dateLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    {hasScore && tone && toneClass ? (
                      <>
                        <p className={`text-sm font-bold ${toneClass.score}`}>
                          {formatScore(Number(item.score))}%
                        </p>
                        <p className={`mt-0.5 text-xs font-medium ${toneClass.label}`}>
                          {t(
                            `TEACHER_STUDENT_PROFILE.${scoreToneLabelKey[tone]}`
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-[#9CA3AF]">—</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
};

export default StudentQuizzesCard;
