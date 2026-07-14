import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  StudentProfileAnalytics,
  StudentProfileCompletion,
  StudentProfileSummary,
} from "@/types/studentProfile";

export type SummaryCardsProps = {
  student: StudentProfileSummary;
  analytics: StudentProfileAnalytics;
  completion: StudentProfileCompletion;
};

const IconBox = ({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: ReactNode;
}) => (
  <span
    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
    style={{ backgroundColor: bg, color }}
  >
    {children}
  </span>
);

const Card = ({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  icon: ReactNode;
}) => (
  <article className="flex min-h-[118px] flex-col justify-between rounded-[16px] border border-[#EEF2F6] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
    <div className="flex items-start justify-between gap-3">
      <p className="text-[14px] font-medium leading-5 text-[#6B7280]">{label}</p>
      {icon}
    </div>
    <div>
      <p className="text-[32px] font-bold leading-none tracking-[-0.02em] text-[#111827]">{value}</p>
      {hint ? <div className="mt-2.5 text-[13px] leading-4">{hint}</div> : null}
    </div>
  </article>
);

export const SummaryCards = ({ student, analytics, completion }: SummaryCardsProps) => {
  const { t } = useTranslation();
  const delta = analytics.summary.delta_percent;
  const completionPercent = Number(completion.percent ?? student.score_percent ?? 0);
  const isActive = completion.total > 0;

  return (
    <div className="grid grid-cols-1 gap-[24px] md:grid-cols-3">
      <Card
        label={t("TEACHER_STUDENT_PROFILE.CARD_PERFORMANCE")}
        value={`${Number(student.performance_percent || 0).toFixed(0)}%`}
        icon={
          <IconBox bg="#E8FBF4" color="#12B76A">
            <ShowChartRoundedIcon sx={{ fontSize: 22 }} />
          </IconBox>
        }
        hint={
          delta != null ? (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                delta >= 0 ? "text-[#12B76A]" : "text-[#F04438]"
              }`}
            >
              {delta >= 0 ? `+ ${Number(delta).toFixed(1)}%` : `${Number(delta).toFixed(1)}%`}
            </span>
          ) : (
            <span className="font-medium text-[#9CA3AF]">—</span>
          )
        }
      />
      <Card
        label={t("TEACHER_STUDENT_PROFILE.CARD_ACCURACY")}
        value={`${Number(student.score_percent || 0).toFixed(0)}%`}
        icon={
          <IconBox bg="#E6F8F5" color="#24B8A2">
            <CheckRoundedIcon sx={{ fontSize: 22 }} />
          </IconBox>
        }
        hint={
          <span className="font-medium text-[#9CA3AF]">
            {t("TEACHER_STUDENT_PROFILE.CARD_ACCURACY_HINT")}
          </span>
        }
      />
      <Card
        label={t("TEACHER_STUDENT_PROFILE.CARD_COMPLETION")}
        value={`${completionPercent.toFixed(0)}%`}
        icon={
          <IconBox bg="#FDECEC" color="#F04438">
            <GroupsRoundedIcon sx={{ fontSize: 22 }} />
          </IconBox>
        }
        hint={
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              isActive ? "text-[#24B8A2]" : "text-[#9CA3AF]"
            }`}
          >
            {isActive ? <NorthEastIcon sx={{ fontSize: 14 }} /> : null}
            {isActive
              ? t("TEACHER_STUDENT_PROFILE.CARD_COMPLETION_ACTIVE")
              : t("TEACHER_STUDENT_PROFILE.CARD_COMPLETION_INACTIVE")}
          </span>
        }
      />
    </div>
  );
};

export default SummaryCards;
