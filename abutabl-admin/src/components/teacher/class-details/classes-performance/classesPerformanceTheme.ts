/** Design tokens — shell aligned with Overview PerformanceLineCard. */
export const CLASSES_PERFORMANCE_COLORS = {
  /** Yellow — Class (Students design legend; Overview uses teal for Class) */
  classLine: "#D4A843",
  /** Teal — All Classes */
  allClassesLine: "#0F766E",
  title: "#111827",
  subtitle: "#0F766E",
  legendLabel: "#374151",
  axisTick: "#9CA3AF",
  grid: "#E5E7EB",
  cardShadow: "0 4px 6px rgba(0,0,0,0.05)",
} as const;

/** Same shell as Overview `chartCardClass` / PerformanceLineCard. */
export const CLASSES_PERFORMANCE_CARD_CLASS =
  "flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]";
