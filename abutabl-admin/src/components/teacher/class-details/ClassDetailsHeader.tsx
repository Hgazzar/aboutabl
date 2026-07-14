import { Avatar, Stack } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useTranslation } from "react-i18next";
import { AccountPopover } from "@/layout/AccountPopover";
import NotificationDropdown from "@/layout/NotificationDropdown";
import { usePopover } from "@/hooks/usePopover";
import {
  CLASS_DETAILS_TABS,
  CLASS_DETAILS_TIME_RANGES,
  ClassDetailsTab,
  ClassDetailsTimeRange,
} from "@/types/classDetails";
import { TeacherClassOverviewItem } from "@/types/teacherClasses";
import { ReactComponent as NoteIcon } from "@/assets/note.svg";

export type ClassDetailsHeaderProps = {
  subjectLabel: string;
  studentCount: number;
  classes: TeacherClassOverviewItem[];
  activeClassId: number;
  activeTab: ClassDetailsTab;
  timeRange: ClassDetailsTimeRange;
  onClassChange: (classId: number) => void;
  onTabChange: (tab: ClassDetailsTab) => void;
  onTimeRangeChange: (range: ClassDetailsTimeRange) => void;
};

const getClassPillLabel = (classItem: TeacherClassOverviewItem) =>
  classItem.class_name || classItem.name;

export const ClassDetailsHeader = ({
  subjectLabel,
  studentCount,
  classes,
  activeClassId,
  activeTab,
  timeRange,
  onClassChange,
  onTabChange,
  onTimeRangeChange,
}: ClassDetailsHeaderProps) => {
  const { t } = useTranslation();
  const accountPopover = usePopover();

  const notificationIcon = (
    <NoteIcon aria-hidden style={{ width: 24, height: 29, display: "block" }} />
  );

  return (
    <header className="bg-[#F7F9FA] px-6 pb-0 pt-7 md:px-8 md:pt-8">
      {/* Title + icons */}
      <div className="mb-2.5 flex items-center justify-between gap-4">
        <h1 className="text-[2.25rem] font-extrabold leading-none tracking-tight text-[#111827] md:text-4xl">
          {t("TEACHER_CLASS_DETAILS.PAGE_TITLE")}
        </h1>

        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flexShrink: 0 }}>
          <NotificationDropdown
            icon={notificationIcon}
            badgeVariant="dot"
            iconButtonSx={{ p: 0.75 }}
          />

          <Avatar
            onClick={accountPopover.handleOpen}
            ref={accountPopover.anchorRef}
            sx={{
              width: 44,
              height: 44,
              cursor: "pointer",
              bgcolor: "#038E7B",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)",
            }}
          >
            <PersonOutlineIcon sx={{ color: "#FFFFFF" }} />
          </Avatar>

          <AccountPopover
            anchorEl={accountPopover.anchorRef.current}
            onClose={accountPopover.handleClose}
            open={accountPopover.open}
          />
        </Stack>
      </div>

      {/* Subtitle */}
      <p className="mb-7 text-[0.9375rem] font-semibold leading-snug text-[#065F46] md:text-base">
        {subjectLabel}
        <span className="mx-2">•</span>
        {t("TEACHER_CLASS_DETAILS.STUDENT_COUNT", { count: studentCount })}
      </p>

      {/* Class pills + time filters */}
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {classes.map((classItem) => {
            const isActive = classItem.class_id === activeClassId;
            const label = getClassPillLabel(classItem);

            return (
              <button
                key={classItem.class_id}
                type="button"
                onClick={() => onClassChange(classItem.class_id)}
                className={[
                  "rounded-full px-6 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-[#059669] text-white shadow-none"
                    : "border border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280] hover:bg-[#ECEFF3]",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="inline-flex self-start rounded-[10px] border border-[#E5E7EB] bg-[#F3F4F6] p-1 lg:self-auto">
          {CLASS_DETAILS_TIME_RANGES.map((range) => {
            const isActive = timeRange === range;

            return (
              <button
                key={range}
                type="button"
                onClick={() => onTimeRangeChange(range)}
                className={[
                  "rounded-lg px-4 py-2 text-sm transition-all",
                  isActive
                    ? "bg-white font-bold text-[#111827] shadow-sm"
                    : "bg-transparent font-medium text-[#6B7280] hover:text-[#374151]",
                ].join(" ")}
              >
                {t(`TEACHER_CLASS_DETAILS.TIME_${range.toUpperCase()}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex gap-8 border-b border-[#E5E7EB] md:gap-10">
        {CLASS_DETAILS_TABS.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className="bg-transparent pb-0"
            >
              <span
                className={[
                  "inline-block pb-3 text-[0.9375rem] font-semibold transition-colors",
                  isActive
                    ? "-mb-px border-b-4 border-[#059669] text-[#059669]"
                    : "border-b-4 border-transparent text-[#6B7280] hover:text-[#374151]",
                ].join(" ")}
              >
                {t(`TEACHER_CLASS_DETAILS.TAB_${tab.toUpperCase()}`)}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default ClassDetailsHeader;
