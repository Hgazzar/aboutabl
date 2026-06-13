/** Brand accent for teacher/admin interactive games (avoid theme `primary` blue). */
export const IG_GREEN = "#1EBBA3";
export const IG_GREEN_HOVER = "#179e88";

export const igContainedButtonSx = {
  bgcolor: IG_GREEN,
  color: "#fff",
  "&:hover": { bgcolor: IG_GREEN_HOVER },
} as const;

export const igOutlinedButtonSx = {
  color: IG_GREEN,
  borderColor: IG_GREEN,
  "&:hover": {
    borderColor: IG_GREEN_HOVER,
    color: IG_GREEN_HOVER,
    bgcolor: "rgba(30, 187, 163, 0.06)",
  },
} as const;

export const igTextButtonSx = {
  color: IG_GREEN,
  "&:hover": { bgcolor: "rgba(30, 187, 163, 0.08)" },
} as const;

export const igCircularProgressSx = { color: IG_GREEN } as const;

export const igChipOutlinedSx = {
  borderColor: `${IG_GREEN}99`,
  color: IG_GREEN,
} as const;
