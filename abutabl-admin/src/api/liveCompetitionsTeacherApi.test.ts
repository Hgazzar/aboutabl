import {
  beginLiveCompetitionSession,
  createLiveCompetitionSession,
  endLiveCompetitionSession,
  fetchAvailableLiveCompetitions,
  fetchLiveCompetitionHost,
  fetchLiveCompetitionLobby,
  fetchLiveCompetitionLobbySessions,
  fetchLiveCompetitionPlayerAnswers,
  fetchLiveCompetitionSessionStudents,
  isLiveCompetitionLobbyConflict,
  isLiveCompetitionNotInPlayConflict,
  LIVE_COMPETITION_NOT_IN_LOBBY_MSG,
  LIVE_COMPETITION_NOT_IN_PLAY_MSG,
  type LiveCompetitionHostPayload,
} from "./liveCompetitionsTeacherApi";
import { getRequest, postRequest } from "@/utils/fetchMethods";

jest.mock("@/utils/fetchMethods", () => ({
  getRequest: jest.fn(),
  postRequest: jest.fn(),
}));

const getRequestMock = getRequest as jest.MockedFunction<typeof getRequest>;
const postRequestMock = postRequest as jest.MockedFunction<typeof postRequest>;

const sampleHost: LiveCompetitionHostPayload = {
  code: "HOST01",
  status: "playing",
  type: "classic",
  goal: "comprehension",
  goal_label: "Comprehension",
  goal_hint: "hint",
  version: 3,
  question_total: 6,
  question_seconds: 20,
  team_mode: false,
  firewood: 1,
  firewood_needed: 2,
  fire_lit: false,
  active_event: null,
  event_title: null,
  event_body: null,
  firewall_active: false,
  bridge_broken: false,
  bridge_progress: 0,
  invited_total: 2,
  joined_total: 2,
  players: [
    {
      id: 21,
      player_id: 9,
      rank: 1,
      name: "Sara",
      score: 2,
      coins: 10,
      streak: 1,
      progress: 33.3,
      avatar: null,
      power: null,
      power_used: false,
      shield: false,
      frozen: false,
      team: null,
      team_color: null,
      password_hint: "S",
      reinforce: false,
      retry_queued: 0,
      answers_since_retry: 0,
    },
  ],
  teams: [],
  hardest: [
    {
      id: 1,
      question: "What fuel?",
      wrong: 1,
      correct: 1,
      total: 2,
      miss_rate: 50,
    },
  ],
  fastest_name: "Sara",
  fastest_ms: 1200,
  fastest_id: 21,
  answers_total: 2,
  answers_correct: 1,
  class_accuracy: 50,
  seconds_left: 400,
  started_at: "2026-11-03 10:00:00",
  ends_at: "2026-11-03 10:10:00",
};

describe("liveCompetitionsTeacherApi", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    postRequestMock.mockReset();
  });

  it("calls the teacher available catalog endpoint, not admin management paths", async () => {
    getRequestMock.mockResolvedValue({ status: true, games: [] });

    const result = await fetchAvailableLiveCompetitions();

    expect(getRequestMock).toHaveBeenCalledWith({}, "/api/live-competitions/available");
    expect(getRequestMock).not.toHaveBeenCalledWith(
      expect.anything(),
      "/api/live-competitions/import/preview"
    );
    expect(result.games).toEqual([]);
  });

  it("lists lobby sessions", async () => {
    getRequestMock.mockResolvedValue({ status: true, sessions: [] });
    await fetchLiveCompetitionLobbySessions();
    expect(getRequestMock).toHaveBeenCalledWith({}, "/api/live-competitions/sessions");
  });

  it("creates a session with only live_game_id and class_id", async () => {
    postRequestMock.mockResolvedValue({
      status: true,
      session: { id: 9, status: "lobby", code: "ABC123" },
    });

    await createLiveCompetitionSession({ live_game_id: 3, class_id: 12 });

    expect(postRequestMock).toHaveBeenCalledWith(
      { live_game_id: 3, class_id: 12 },
      "/api/live-competitions/sessions"
    );
  });

  it("loads lobby and students by session id", async () => {
    getRequestMock.mockResolvedValue({ status: true });
    await fetchLiveCompetitionLobby(44);
    await fetchLiveCompetitionSessionStudents(44);
    expect(getRequestMock).toHaveBeenCalledWith(
      {},
      "/api/live-competitions/sessions/44"
    );
    expect(getRequestMock).toHaveBeenCalledWith(
      {},
      "/api/live-competitions/sessions/44/students"
    );
  });

  it("begins a session", async () => {
    postRequestMock.mockResolvedValue({
      status: true,
      session: { id: 44, status: "playing" },
    });
    await beginLiveCompetitionSession(44);
    expect(postRequestMock).toHaveBeenCalledWith(
      {},
      "/api/live-competitions/sessions/44/begin"
    );
  });

  it("detects lobby 409 conflict from fetchMethods error message", () => {
    expect(
      isLiveCompetitionLobbyConflict(new Error(LIVE_COMPETITION_NOT_IN_LOBBY_MSG))
    ).toBe(true);
    expect(isLiveCompetitionLobbyConflict(new Error("Unauthorized"))).toBe(false);
  });

  it("fetches host board from the exact host URI without transforming the payload", async () => {
    const apiBody = { status: true, host: sampleHost };
    getRequestMock.mockResolvedValue(apiBody);

    const result = await fetchLiveCompetitionHost(55);

    expect(getRequestMock).toHaveBeenCalledWith(
      {},
      "/api/live-competitions/sessions/55/host"
    );
    expect(result).toBe(apiBody);
    expect(result.host).toEqual(sampleHost);
    expect(result.host?.players[0].password_hint).toBe("S");
  });

  it("ends a session with an empty body on the exact end URI", async () => {
    const apiBody = {
      status: true,
      host: { ...sampleHost, status: "ended", seconds_left: 0 },
    };
    postRequestMock.mockResolvedValue(apiBody);

    const result = await endLiveCompetitionSession(55);

    expect(postRequestMock).toHaveBeenCalledWith(
      {},
      "/api/live-competitions/sessions/55/end"
    );
    expect(result).toBe(apiBody);
    expect(result.host?.status).toBe("ended");
  });

  it("detects not-in-play End conflict from fetchMethods error message", () => {
    expect(
      isLiveCompetitionNotInPlayConflict(new Error(LIVE_COMPETITION_NOT_IN_PLAY_MSG))
    ).toBe(true);
    expect(isLiveCompetitionNotInPlayConflict(new Error(LIVE_COMPETITION_NOT_IN_LOBBY_MSG))).toBe(
      false
    );
  });

  it("fetches player answers from the exact review URI without transforming the payload", async () => {
    const apiBody = {
      status: true,
      review: {
        session: {
          id: 55,
          code: "HOST01",
          status: "playing",
          live_game_id: 9,
          class_id: 1,
        },
        student: { id: 21, name: "Sara", name_ar: null, photo: null },
        player: {
          player_id: 9,
          score: 2,
          coins: 10,
          streak: 1,
          rank: 1,
        },
        questions: [],
      },
    };
    getRequestMock.mockResolvedValue(apiBody);

    const result = await fetchLiveCompetitionPlayerAnswers(55, 21);

    expect(getRequestMock).toHaveBeenCalledWith(
      {},
      "/api/live-competitions/sessions/55/players/21/answers"
    );
    expect(result).toBe(apiBody);
    expect(result.review?.student.id).toBe(21);
  });
});
