import { Avatar, Stack } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useTranslation } from "react-i18next";
import { AccountPopover } from "@/layout/AccountPopover";
import NotificationDropdown from "@/layout/NotificationDropdown";
import { usePopover } from "@/hooks/usePopover";
import {
  CLASS_DETAILS_METRIC_TIME_RANGES,
  CLASS_DETAILS_TABS,
  CLASS_DETAILS_TIME_RANGES,
  ClassDetailsTab,
  ClassDetailsTimeRange,
} from "@/types/classDetails";
import { TeacherClassOverviewItem } from "@/types/teacherClasses";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

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
  /** Screen #8 / #9 hide the week/month/term chips to match approved design. */
  showTimeRange?: boolean;
  /** Screen #9 hides class pills — not present in Figma frame. */
  showClassPills?: boolean;
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
  showTimeRange = true,
  showClassPills = true,
}: ClassDetailsHeaderProps) => {
  const { t } = useTranslation();
  const accountPopover = usePopover();

  const isAssignmentsTab = activeTab === "assignments";
  const pageTitle = isAssignmentsTab
    ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_TITLE")
    : t("TEACHER_CLASS_DETAILS.PAGE_TITLE");
  const pageSubtitle = isAssignmentsTab ? (
    t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_SUBTITLE")
  ) : (
    <>
      {subjectLabel}
      <span className="mx-2">•</span>
      {t("TEACHER_CLASS_DETAILS.STUDENT_COUNT", { count: studentCount })}
    </>
  );

  const notificationIcon = (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
      <NotificationsNoneIcon sx={{ fontSize: 22, color: "#1A1A1A" }} />
    </span>
  );

  return (
    <header className="bg-[#F7F9FA] px-8 pb-0 pt-8">
      <div className="mb-3 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-[#1A1A1A]">
            {pageTitle}
          </h1>
          <p
            className={[
              "mt-2 text-[15px] font-normal leading-[1.4]",
              isAssignmentsTab ? "text-[#00A68A]" : "text-[#6B7280]",
            ].join(" ")}
          >
            {pageSubtitle}
          </p>
        </div>

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0, pt: 1 }}>
          <NotificationDropdown
            icon={notificationIcon}
            badgeVariant="dot"
            badgeColor="#00A68A"
            iconButtonSx={{ p: 0 }}
          />

          <Avatar
            onClick={accountPopover.handleOpen}
            ref={accountPopover.anchorRef}
            sx={{
              width: 44,
              height: 44,
              cursor: "pointer",
              bgcolor: "#00A68A",
              border: "2px solid #FFFFFF",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
            }}
          >
            <PersonOutlineIcon sx={{ color: "#FFFFFF", fontSize: 24 }} />
          </Avatar>

          <AccountPopover
            anchorEl={accountPopover.anchorRef.current}
            onClose={accountPopover.handleClose}
            open={accountPopover.open}
          />
        </Stack>
      </div>

      {showClassPills ? (
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                      ? "bg-[#00A68A] text-white shadow-none"
                      : "border border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280] hover:bg-[#ECEFF3]",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {showTimeRange ? (
            <div className="inline-flex self-start rounded-[10px] border border-[#E5E7EB] bg-[#F3F4F6] p-1 lg:self-auto">
              {(activeTab === "assignments"
                ? CLASS_DETAILS_TIME_RANGES
                : CLASS_DETAILS_METRIC_TIME_RANGES
              ).map((range) => {
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
          ) : null}
        </div>
      ) : (
        <div className="mb-5" aria-hidden />
      )}

      <nav className="flex gap-10 border-b border-[#E5E7EB]">
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
                  "inline-block pb-4 text-[15px] transition-colors",
                  isActive
                    ? "-mb-px border-b-[3px] border-[#00A68A] font-bold text-[#1A1A1A]"
                    : "border-b-[3px] border-transparent font-medium text-[#9CA3AF]",
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
