/** Align Completion Status with Overview `TeacherCompletionDonutChart` tokens. */
export const COMPLETION_STATUS_COLORS = {
  completed: "#004D34",
  inProgress: "#5EEAD4",
  notStarted: "#D1D5DB",
  title: "#111827",
  legendLabel: "#374151",
  legendValue: "#111827",
  tabIdleBg: "#F3F4F6",
  tabIdleText: "#6B7280",
  tabActiveBg: "#0F766E",
  tabActiveText: "#FFFFFF",
  cardBorder: "#E5E7EB",
  cardShadow: "0 4px 6px rgba(0,0,0,0.05)",
} as const;

/**
 * Same height/padding/radius/shadow as Classes Performance card.
 * Shared so both Students Tab chart cards stay visually equal.
 */
export const COMPLETION_STATUS_CARD_CLASS =
  "flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]";
