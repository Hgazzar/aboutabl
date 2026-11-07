import { getRequest, postRequest } from "@/utils/fetchMethods";

/** Backend RuntimeException message when lobby endpoints are hit after Begin. */
export const LIVE_COMPETITION_NOT_IN_LOBBY_MSG = "Session is not in lobby.";

export type TeacherAvailableLiveGame = {
  id: number;
  name: string;
  time?: string;
  logo?: string | null;
  type?: string;
  level?: number | null;
  background?: string | null;
  status: number;
  is_published: boolean;
  questions_count?: number;
  entitled_school_ids?: number[];
  selectable_for_new_competition?: boolean;
};

export type TeacherAvailableLiveGamesResponse = {
  status?: boolean;
  games?: TeacherAvailableLiveGame[];
  msg?: string;
  errNum?: string;
};

export type LiveCompetitionSessionSummary = {
  id: number;
  code: string;
  status: string;
  live_game_id: number;
  class_id: number;
  school_id: number;
  host_user_id: number;
  questions_count?: number;
  duration_minutes?: number | null;
  started_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
  joined_player_count?: number;
  invited_total?: number;
  game_name?: string | null;
  game_type?: string | null;
  class_name?: string | null;
  grade_name?: string | null;
};

export type LiveCompetitionInviteStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired"
  | string;

export type LiveCompetitionEligibleStudent = {
  id: number;
  name: string | null;
  name_ar?: string | null;
  photo?: string | null;
  class_id: number;
  school_id?: number | null;
  /** Invite row for this session only; null when no invite exists. */
  invite_status?: LiveCompetitionInviteStatus | null;
  /** True only when a player row exists for this session + student. */
  joined?: boolean;
  accepted_at?: string | null;
};

export type LiveCompetitionLobbyPayload = {
  session: LiveCompetitionSessionSummary;
  eligible_students: LiveCompetitionEligibleStudent[];
  invited_total?: number;
  joined_total?: number;
  pending_total?: number;
};

export type LiveCompetitionLobbyResponse = {
  status?: boolean;
  lobby?: LiveCompetitionLobbyPayload;
  msg?: string;
  errNum?: string;
};

export type LiveCompetitionSessionResponse = {
  status?: boolean;
  session?: LiveCompetitionSessionSummary;
  msg?: string;
  errNum?: string;
};

export type LiveCompetitionSessionsResponse = {
  status?: boolean;
  sessions?: LiveCompetitionSessionSummary[];
  msg?: string;
  errNum?: string;
};

export type LiveCompetitionStudentsResponse = {
  status?: boolean;
  students?: LiveCompetitionEligibleStudent[];
  msg?: string;
  errNum?: string;
};

export type CreateLiveCompetitionSessionBody = {
  live_game_id: number;
  class_id: number;
  /** Teacher override; 1–60. Omit to use catalog game.time. */
  duration_minutes?: number;
};

/** Match backend LiveCompetitionEngine::parseMinutes for UI defaults. */
export function parseLiveGameDurationMinutes(time?: string | null): number {
  if (!time) {
    return 10;
  }
  const match = /^(\d+):(\d+)$/.exec(time);
  if (!match) {
    return 10;
  }
  return Math.max(1, Number(match[1]) || 1);
}

/**
 * True when the backend rejected a lobby-only call because the session already
 * left lobby (HTTP 409). fetchMethods surfaces only the message string.
 */
export function isLiveCompetitionLobbyConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const message = String((error as { message?: unknown }).message || "");
  return message === LIVE_COMPETITION_NOT_IN_LOBBY_MSG;
}

/**
 * Slice C.1 — teacher catalog read. Does not start a competition.
 * Uses the existing admin-api session (checkUserToken).
 */
export function fetchAvailableLiveCompetitions(): Promise<TeacherAvailableLiveGamesResponse> {
  return getRequest({}, "/api/live-competitions/available") as Promise<TeacherAvailableLiveGamesResponse>;
}

/**
 * Hosted lobby + playing sessions for the authenticated teacher (recovery list).
 * Backend filters by host_user_id + current class access.
 */
export function fetchLiveCompetitionLobbySessions(): Promise<LiveCompetitionSessionsResponse> {
  return getRequest({}, "/api/live-competitions/sessions") as Promise<LiveCompetitionSessionsResponse>;
}

/**
 * Create a lobby session. Client may send live_game_id and class_id only.
 * school_id is resolved server-side and must not be sent.
 */
export function createLiveCompetitionSession(
  body: CreateLiveCompetitionSessionBody
): Promise<LiveCompetitionSessionResponse> {
  const payload: Record<string, number> = {
    live_game_id: body.live_game_id,
    class_id: body.class_id,
  };
  if (
    typeof body.duration_minutes === "number" &&
    Number.isFinite(body.duration_minutes)
  ) {
    payload.duration_minutes = body.duration_minutes;
  }
  return postRequest(
    payload,
    "/api/live-competitions/sessions"
  ) as Promise<LiveCompetitionSessionResponse>;
}

/** Lobby detail — 409 when session is no longer in lobby. */
export function fetchLiveCompetitionLobby(
  sessionId: number
): Promise<LiveCompetitionLobbyResponse> {
  return getRequest(
    {},
    `/api/live-competitions/sessions/${sessionId}`
  ) as Promise<LiveCompetitionLobbyResponse>;
}

/** Eligible active class students for a lobby session. */
export function fetchLiveCompetitionSessionStudents(
  sessionId: number
): Promise<LiveCompetitionStudentsResponse> {
  return getRequest(
    {},
    `/api/live-competitions/sessions/${sessionId}/students`
  ) as Promise<LiveCompetitionStudentsResponse>;
}

/** Begin a lobby session — transitions status to playing. */
export function beginLiveCompetitionSession(
  sessionId: number
): Promise<LiveCompetitionSessionResponse> {
  return postRequest(
    {},
    `/api/live-competitions/sessions/${sessionId}/begin`
  ) as Promise<LiveCompetitionSessionResponse>;
}

/** Backend message when End is called while the session is still lobby / not playing. */
export const LIVE_COMPETITION_NOT_IN_PLAY_MSG = "Session is not in play.";

export type LiveCompetitionHostStatus = "lobby" | "playing" | "ended" | string;

export type LiveCompetitionThemeType = "classic" | "gold_quest" | "hacking" | string;

/** Ranked player row from LiveCompetitionEngine::payload (teacher host). */
export type LiveCompetitionHostPlayer = {
  id: number;
  player_id: number;
  rank: number;
  name: string;
  score: number;
  coins: number;
  streak: number;
  progress: number;
  avatar?: string | null;
  power?: string | null;
  power_used: boolean;
  shield: boolean;
  frozen: boolean;
  team?: string | null;
  team_color?: string | null;
  /** Teacher-only first character of hack password; never the full password. */
  password_hint?: string | null;
  reinforce: boolean;
  retry_queued: number;
  answers_since_retry: number;
};

export type LiveCompetitionHostTeam = {
  id: number;
  name: string;
  color?: string | null;
  score: number;
  coins: number;
};

/** Hardest-question entry from buildReport (snapshot-keyed). */
export type LiveCompetitionHardestQuestion = {
  id: number;
  question?: string | null;
  wrong: number;
  correct: number;
  total: number;
  miss_rate: number;
};

/**
 * Theme / event indicators returned on the host payload.
 * Consumers should branch on `type` plus these flags — do not invent values.
 */
export type LiveCompetitionHostThemeIndicators = {
  firewood: number;
  firewood_needed: number;
  fire_lit: boolean;
  active_event?: string | null;
  event_title?: string | null;
  event_body?: string | null;
  firewall_active: boolean;
  bridge_broken: boolean;
  bridge_progress: number;
};

/** Final report fields embedded in the host payload (playing + ended). */
export type LiveCompetitionHostReportFields = {
  hardest: LiveCompetitionHardestQuestion[];
  fastest_name?: string | null;
  fastest_ms?: number | null;
  fastest_id?: number | null;
  answers_total: number;
  answers_correct: number;
  class_accuracy: number;
};

/**
 * Exact host board payload from GET/POST host|end (`host` response key).
 * Matches LiveCompetitionEngine::payload field names.
 */
export type LiveCompetitionHostPayload = LiveCompetitionHostThemeIndicators &
  LiveCompetitionHostReportFields & {
    code: string;
    status: LiveCompetitionHostStatus;
    type: LiveCompetitionThemeType;
    goal: string;
    goal_label: string;
    goal_hint: string;
    version: number;
    question_total: number;
    question_seconds: number;
    team_mode: boolean;
    invited_total: number;
    joined_total: number;
    players: LiveCompetitionHostPlayer[];
    teams: LiveCompetitionHostTeam[];
    seconds_left?: number | null;
    started_at?: string | null;
    ends_at?: string | null;
    /** True when lobby was cancelled before Begin. */
    cancelled?: boolean;
  };

export type LiveCompetitionHostResponse = {
  status?: boolean;
  host?: LiveCompetitionHostPayload;
  msg?: string;
  errNum?: string;
};

export function isLiveCompetitionNotInPlayConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const message = String((error as { message?: unknown }).message || "");
  return message === LIVE_COMPETITION_NOT_IN_PLAY_MSG;
}

/**
 * Read-only teacher host board (lobby, playing, or ended).
 * Owning teacher only. Does not mutate session state.
 */
export function fetchLiveCompetitionHost(
  sessionId: number
): Promise<LiveCompetitionHostResponse> {
  return getRequest(
    {},
    `/api/live-competitions/sessions/${sessionId}/host`
  ) as Promise<LiveCompetitionHostResponse>;
}

/**
 * End a playing session. Idempotent when already ended.
 * Request body must be empty `{}` (backend accepts no client fields).
 */
export function endLiveCompetitionSession(
  sessionId: number
): Promise<LiveCompetitionHostResponse> {
  return postRequest(
    {},
    `/api/live-competitions/sessions/${sessionId}/end`
  ) as Promise<LiveCompetitionHostResponse>;
}

/**
 * Cancel a lobby before Begin. Idempotent when already ended/cancelled.
 * Request body must be empty `{}`.
 */
export function cancelLiveCompetitionLobby(
  sessionId: number
): Promise<LiveCompetitionHostResponse> {
  return postRequest(
    {},
    `/api/live-competitions/sessions/${sessionId}/cancel`
  ) as Promise<LiveCompetitionHostResponse>;
}

/** One attempt row from GET …/players/{studentId}/answers. */
export type LiveCompetitionPlayerAnswerAttempt = {
  id: number;
  answer: string;
  correct: boolean;
  timed_out: boolean;
  is_retry: boolean;
  is_reinforce: boolean;
  attempt: number;
  elapsed_ms?: number | null;
  coins_delta: number;
  created_at?: string | null;
};

/** Per-question review block for teacher answer drawer. */
export type LiveCompetitionPlayerAnswerQuestion = {
  id: number;
  sort_order: number;
  question?: string | null;
  image?: string | null;
  voice_url?: string | null;
  answer_type?: string | null;
  choices: string[];
  correct_answer: string;
  explanation?: string | null;
  answered: boolean;
  ever_correct: boolean;
  attempts: LiveCompetitionPlayerAnswerAttempt[];
};

/**
 * Exact review payload from GET sessions/{id}/players/{studentId}/answers
 * (`review` response key). Additive — does not change host payload.
 */
export type LiveCompetitionPlayerAnswersReview = {
  session: {
    id: number;
    code: string;
    status: string;
    live_game_id: number;
    class_id: number;
  };
  student: {
    id: number;
    name?: string | null;
    name_ar?: string | null;
    photo?: string | null;
  };
  player: {
    player_id: number;
    score: number;
    coins: number;
    streak: number;
    rank?: number | null;
  };
  questions: LiveCompetitionPlayerAnswerQuestion[];
};

export type LiveCompetitionPlayerAnswersResponse = {
  status?: boolean;
  review?: LiveCompetitionPlayerAnswersReview;
  msg?: string;
  errNum?: string;
};

/**
 * Read-only teacher review of one player's answers.
 * Owning teacher only. Does not mutate session state.
 */
export function fetchLiveCompetitionPlayerAnswers(
  sessionId: number,
  studentId: number
): Promise<LiveCompetitionPlayerAnswersResponse> {
  return getRequest(
    {},
    `/api/live-competitions/sessions/${sessionId}/players/${studentId}/answers`
  ) as Promise<LiveCompetitionPlayerAnswersResponse>;
}
