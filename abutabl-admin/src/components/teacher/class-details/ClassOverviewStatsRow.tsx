import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTranslation } from "react-i18next";
import { ClassDetailsOverviewStats } from "@/types/classDetailsOverview";

type OverviewStatCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  footer?: React.ReactNode;
};

const OverviewStatCard = ({ title, value, icon, iconBg, footer }: OverviewStatCardProps) => (
  <div className="rounded-2xl bg-white p-5 shadow-[0_4px_6px_rgba(0,0,0,0.05)] md:p-6">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-[#6B7280]">{title}</p>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>
    </div>
    <p className="mt-4 text-[2rem] font-bold leading-none text-[#111827] md:text-[2.125rem]">
      {value}
    </p>
    {footer && <div className="mt-2">{footer}</div>}
  </div>
);

export type ClassOverviewStatsRowProps = {
  stats: ClassDetailsOverviewStats;
};

export const ClassOverviewStatsRow = ({ stats }: ClassOverviewStatsRowProps) => {
  const { t } = useTranslation();

  return (
    <section className="bg-[#F7F9FA] px-6 pb-6 pt-5 md:px-8 md:pt-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        <OverviewStatCard
          title={t("TEACHER_CLASS_DETAILS.STAT_PERFORMANCE")}
          value={`${stats.performance_percent}%`}
          iconBg="bg-[#E6F7F4]"
          icon={<ShowChartOutlinedIcon sx={{ fontSize: 20, color: "#00A78E" }} />}
          footer={
            stats.performance_trend.direction === "up" ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#00A78E]">
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                {stats.performance_trend.delta_percent > 0
                  ? `+ ${stats.performance_trend.delta_percent}%`
                  : t("TEACHER_CLASS_DETAILS.TREND_POSITIVE")}
              </span>
            ) : null
          }
        />
        <OverviewStatCard
          title={t("TEACHER_CLASS_DETAILS.STAT_COMPLETION")}
          value={`${stats.completion_rate_percent}%`}
          iconBg="bg-[#E6F7F4]"
          icon={<CheckCircleOutlineIcon sx={{ fontSize: 20, color: "#00A78E" }} />}
          footer={
            <p className="text-sm text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.STAT_COMPLETION_SUB")}
            </p>
          }
        />
        <OverviewStatCard
          title={t("TEACHER_CLASS_DETAILS.STAT_ATTENTION")}
          value={String(stats.students_need_attention)}
          iconBg="bg-[#FEECEC]"
          icon={<GroupsOutlinedIcon sx={{ fontSize: 20, color: "#EF4444" }} />}
          footer={
            stats.students_need_attention > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#00A78E]">
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                {t("TEACHER_CLASS_DETAILS.ACTIVE")}
              </span>
            ) : null
          }
        />
      </div>
    </section>
  );
};

export default ClassOverviewStatsRow;
