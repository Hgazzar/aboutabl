import { useTranslation } from "react-i18next";
import {
  StudentProfileCompletion,
  StudentProfileLearningProgress,
  StudentProfileStandards,
  StudentProfileSummary,
} from "@/types/studentProfile";

export type LearningSnapshotCardProps = {
  student: StudentProfileSummary;
  learningProgress: StudentProfileLearningProgress;
  completion: StudentProfileCompletion;
  standards: StudentProfileStandards;
  quizAveragePercent?: number | null;
};

const TEAL = "#24B8A2";

const formatPercent = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(0)}%`;
};

/** Display-only: first available standards percent from existing profile fields. */
const resolveStandardsPercent = (
  standards: StudentProfileStandards
): number | null => {
  if (!standards.available) {
    return null;
  }
  const selected = standards.selected;
  if (selected) {
    return Number(selected.percent ?? selected.percentage ?? 0);
  }
  const first = standards.items?.[0];
  if (!first) {
    return null;
  }
  return Number(first.percent ?? first.percentage ?? 0);
};

/** Display-only risk label from existing student.status / needs_attention. */
const resolveRiskKey = (student: StudentProfileSummary): string => {
  if (student.needs_attention) {
    return "SNAPSHOT_RISK_HIGH";
  }
  const status = String(student.status || "no_data").toLowerCase();
  if (status === "good") {
    return "SNAPSHOT_RISK_LOW";
  }
  if (status === "average") {
    return "SNAPSHOT_RISK_MEDIUM";
  }
  if (status === "needs_attention") {
    return "SNAPSHOT_RISK_HIGH";
  }
  return "SNAPSHOT_RISK_UNKNOWN";
};

const SnapshotRow = ({
  label,
  value,
  barPercent,
}: {
  label: string;
  value: string;
  barPercent?: number | null;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] font-medium leading-4 text-[#6B7280]">
        {label}
      </span>
      <span className="text-[14px] font-semibold leading-4 text-[#111827]">
        {value}
      </span>
    </div>
    {barPercent != null && !Number.isNaN(barPercent) ? (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, barPercent))}%`,
            backgroundColor: TEAL,
          }}
        />
      </div>
    ) : null}
  </div>
);

/**
 * Compact visual summary of existing Student Profile fields.
 * Not Smart Insight — display only, no new API or calculations.
 */
export const LearningSnapshotCard = ({
  student,
  learningProgress,
  completion,
  standards,
  quizAveragePercent = null,
}: LearningSnapshotCardProps) => {
  const { t } = useTranslation();

  const progressPercent = Number(
    learningProgress?.activity?.percent ?? completion?.percent ?? 0
  );
  const performancePercent = Number(student.performance_percent ?? 0);
  const standardsPercent = resolveStandardsPercent(standards);
  const quizPercent =
    quizAveragePercent != null && !Number.isNaN(Number(quizAveragePercent))
      ? Number(quizAveragePercent)
      : Number(student.accuracy_percent ?? 0);
  const riskLabel = t(`TEACHER_STUDENT_PROFILE.${resolveRiskKey(student)}`);

  return (
    <article className="flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-5 shadow-[0_4px_6px_rgba(0,0,0,0.05)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-[1.0625rem] font-bold leading-tight text-[#111827]">
          {t("TEACHER_STUDENT_PROFILE.LEARNING_SNAPSHOT")}
        </h2>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5">
        <SnapshotRow
          label={t("TEACHER_STUDENT_PROFILE.SNAPSHOT_PROGRESS")}
          value={formatPercent(progressPercent)}
          barPercent={progressPercent}
        />
        <SnapshotRow
          label={t("TEACHER_STUDENT_PROFILE.SNAPSHOT_PERFORMANCE")}
          value={formatPercent(performancePercent)}
        />
        <SnapshotRow
          label={t("TEACHER_STUDENT_PROFILE.SNAPSHOT_STANDARDS")}
          value={formatPercent(standardsPercent)}
        />
        <SnapshotRow
          label={t("TEACHER_STUDENT_PROFILE.SNAPSHOT_QUIZ_ACCURACY")}
          value={formatPercent(quizPercent)}
        />
        <SnapshotRow
          label={t("TEACHER_STUDENT_PROFILE.SNAPSHOT_RISK")}
          value={riskLabel}
        />
      </div>
    </article>
  );
};

export default LearningSnapshotCard;
