/** Teacher SPA routes for live competitions (isolated from legacy /games). */
export function liveCompetitionsHomePath(): string {
  return "/live-games";
}

export function liveCompetitionCreatePath(liveGameId: number | string): string {
  return `/live-games/create?liveGameId=${encodeURIComponent(String(liveGameId))}`;
}

export function liveCompetitionSessionPath(sessionId: number | string): string {
  return `/live-games/sessions/${sessionId}`;
}

/** Stable F.2 destination — placeholder in F.1 only. */
export function liveCompetitionHostPath(sessionId: number | string): string {
  return `/live-games/sessions/${sessionId}/host`;
}

/** Local UI preview of a filled host board (no API). */
export function liveCompetitionHostDemoPath(
  mode: "playing" | "ended" = "playing"
): string {
  return `/live-games/sessions/demo/host?demo=${mode}`;
}

/**
 * Resume path for a hosted session. Lobby → lobby page; playing/ended → host board.
 * Never points at Begin — recovery is navigation only.
 */
export function liveCompetitionRecoveryPath(session: {
  id: number | string;
  status: string;
}): string {
  if (String(session.status) === "lobby") {
    return liveCompetitionSessionPath(session.id);
  }
  return liveCompetitionHostPath(session.id);
}
