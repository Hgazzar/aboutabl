import { isAdminUser } from "@/utils/authSession";

/**
 * /games is the Live Competitions catalog for admins only.
 * Teachers use /live-games. Legacy Interactive Games UI is retired.
 */
export function canManageLiveCatalog(
  user: Record<string, unknown> | null | undefined
): boolean {
  return isAdminUser(user);
}

export function liveCatalogDetailPath(liveGameId: number | string): string {
  return `/games/${liveGameId}`;
}

/** Teacher live-competition home (create / lobby) — not the admin catalog. */
export function teacherLiveCompetitionsPath(): string {
  return "/live-games";
}
