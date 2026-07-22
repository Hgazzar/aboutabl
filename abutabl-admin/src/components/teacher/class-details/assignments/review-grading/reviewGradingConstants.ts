export const REVIEW_BRAND = "#00A68A";
export const REVIEW_CARD_SHADOW = "0 4px 16px rgba(15, 23, 42, 0.06)";
export const REVIEW_ACTIVE_SHADOW = "0 8px 28px rgba(0, 166, 138, 0.14)";
export const REVIEW_STAT_SHADOW = "0 2px 10px rgba(15, 23, 42, 0.04)";

export const STATUS_COLORS = {
  correct: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  incorrect: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  pending: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  unanswered: { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
} as const;
