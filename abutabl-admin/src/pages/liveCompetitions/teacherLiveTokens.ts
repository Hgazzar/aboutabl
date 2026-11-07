/** Teacher-dashboard palette for Live competitions (not admin interactive-games chrome). */
export const TD_TEAL = "#23B8A2";
export const TD_TEAL_STRONG = "#00897B";
export const TD_TEAL_HOVER = "#1AA090";
/** Dashboard accent text (Welcome name, status labels). */
export const TD_GREEN = "#038E7B";
/** Class-details / assignments subtitle green. */
export const TD_GREEN_SOFT = "#00A68A";
export const TD_INK = "#111827";
export const TD_INK_SOFT = "#1A1A1A";
export const TD_MUTED = "#6B7280";
export const TD_MUTED_SOFT = "#9CA3AF";
export const TD_BORDER = "#E5E7EB";
export const TD_PAGE_BG = "#F7F9FA";
export const TD_CARD_BG = "#FFFFFF";
export const TD_SHADOW = "0 4px 6px rgba(0, 0, 0, 0.05)";

export const tdContainedButtonSx = {
  bgcolor: TD_TEAL,
  color: "#fff",
  fontWeight: 700,
  textTransform: "none" as const,
  borderRadius: "12px",
  px: 2.5,
  py: 1.1,
  boxShadow: "none",
  "&:hover": { bgcolor: TD_TEAL_HOVER, boxShadow: "none" },
};

export const tdOutlinedButtonSx = {
  color: TD_TEAL_STRONG,
  borderColor: TD_TEAL,
  fontWeight: 700,
  textTransform: "none" as const,
  borderRadius: "12px",
  "&:hover": {
    borderColor: TD_TEAL_HOVER,
    color: TD_TEAL_HOVER,
    bgcolor: "rgba(35, 184, 162, 0.06)",
  },
};

export const tdTextButtonSx = {
  color: TD_TEAL_STRONG,
  fontWeight: 700,
  textTransform: "none" as const,
  "&:hover": { bgcolor: "rgba(35, 184, 162, 0.08)" },
};

export const tdCircularProgressSx = { color: TD_TEAL } as const;

export const tdChipOutlinedSx = {
  borderColor: `${TD_TEAL}99`,
  color: TD_TEAL_STRONG,
  fontWeight: 600,
} as const;
