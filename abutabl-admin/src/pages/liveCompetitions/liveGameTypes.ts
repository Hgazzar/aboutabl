export const LIVE_GAME_TYPES = ["classic", "hacking", "gold_quest"] as const;

export type LiveGameTypeKey = (typeof LIVE_GAME_TYPES)[number];

export function normalizeLiveGameType(
  value?: string | null
): LiveGameTypeKey | null {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (raw === "classic") return "classic";
  if (raw === "hacking" || raw === "hack") return "hacking";
  if (
    raw === "gold_quest" ||
    raw === "goldquest" ||
    raw === "gold" ||
    raw === "quest"
  ) {
    return "gold_quest";
  }
  return null;
}

export function liveGameTypeLabelKey(type: LiveGameTypeKey): string {
  return `TEACHER_LIVE_COMPETITIONS.TYPE_${type.toUpperCase()}`;
}

export function liveGameTypeBlurbKey(type: LiveGameTypeKey): string {
  return `TEACHER_LIVE_COMPETITIONS.TYPE_${type.toUpperCase()}_BLURB`;
}
