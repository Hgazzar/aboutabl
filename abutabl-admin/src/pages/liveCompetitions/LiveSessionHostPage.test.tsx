import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LiveSessionHostPage, {
  formatFastestMs,
  formatSecondsLeft,
  hardestAnswerBarSegments,
  HOST_POLL_MS,
  HostBoardBody,
  HostFinalReport,
} from "./LiveSessionHostPage";
import {
  endLiveCompetitionSession,
  fetchLiveCompetitionHost,
  fetchLiveCompetitionPlayerAnswers,
  type LiveCompetitionHostPayload,
} from "@/api/liveCompetitionsTeacherApi";

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
  };
});

jest.mock("react-i18next", () => {
  const t = (key: string, params?: Record<string, unknown>) => {
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_CODE") {
      return `CODE ${params?.code}`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_STATUS") {
      return String(params?.status);
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_QUESTIONS") {
      return `${params?.total} questions`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_LOBBY_BODY") {
      return `${params?.joined} / ${params?.invited} joined`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_TEAM_LINE") {
      return `${params?.name} · ${params?.score} pts · ${params?.coins}c`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_FIREWOOD") {
      return `Firewood ${params?.current} / ${params?.needed}`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_BRIDGE_OK") {
      return `Bridge progress ${params?.progress}%`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST_META") {
      return `Missed by ${params?.wrong}/${params?.total} · ${params?.correct} correct · ${params?.miss}% miss`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_CRUMB_SESSION") {
      return `Session #${params?.id}`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_Q_INDEX") {
      return `Q${params?.n}`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_CORRECT_ANSWER") {
      return `Correct answer: ${params?.answer}`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_ATTEMPT_N") {
      return `Attempt ${params?.n}`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_ELAPSED") {
      return `${params?.s}s`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_COINS_DELTA") {
      return `${params?.n} coins`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_MARK_POWER") {
      return `Power: ${params?.power}`;
    }
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_MARK_POWER_USED") {
      return `Power used: ${params?.power}`;
    }
    const labels: Record<string, string> = {
      "TEACHER_LIVE_COMPETITIONS.HOST_TITLE": "Live host",
      "TEACHER_LIVE_COMPETITIONS.HOST_SUBTITLE": "subtitle",
      "TEACHER_LIVE_COMPETITIONS.HOST_CRUMB_HOME": "Live competitions",
      "TEACHER_LIVE_COMPETITIONS.HOST_EXIT": "Exit",
      "TEACHER_LIVE_COMPETITIONS.HOST_BACK": "Back",
      "TEACHER_LIVE_COMPETITIONS.HOST_LOBBY_TITLE": "Session is still in lobby",
      "TEACHER_LIVE_COMPETITIONS.HOST_ENDED_TITLE": "Session ended",
      "TEACHER_LIVE_COMPETITIONS.HOST_ENDED_BODY": "Live polling has stopped.",
      "TEACHER_LIVE_COMPETITIONS.HOST_END": "End",
      "TEACHER_LIVE_COMPETITIONS.HOST_ENDING": "Ending…",
      "TEACHER_LIVE_COMPETITIONS.HOST_END_CONFIRM_TITLE": "End this session?",
      "TEACHER_LIVE_COMPETITIONS.HOST_END_CONFIRM_BODY":
        "Students will stop playing.",
      "TEACHER_LIVE_COMPETITIONS.HOST_END_CONFIRM": "End session",
      "TEACHER_LIVE_COMPETITIONS.HOST_END_CANCEL": "Cancel",
      "TEACHER_LIVE_COMPETITIONS.HOST_END_ERROR": "Could not end the session.",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_ACCURACY": "Class accuracy",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_ANSWERS": "Correct answers",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FIRE": "Campfire",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FIRE_OUT": "Not lit",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FASTEST": "Fastest",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST": "Weakest questions",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST_EMPTY": "No scored answers yet.",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_QUESTION_FALLBACK": "Question",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_LEADERBOARD": "Final ranking",
      "TEACHER_LIVE_COMPETITIONS.HOST_FIRE_LIT": "Campfire lit",
      "TEACHER_LIVE_COMPETITIONS.HOST_BRIDGE_BROKEN": "Bridge cracked",
      "TEACHER_LIVE_COMPETITIONS.HOST_FIREWALL_ON": "Firewall up",
      "TEACHER_LIVE_COMPETITIONS.HOST_FIREWALL_OFF": "Firewall off",
      "TEACHER_LIVE_COMPETITIONS.HOST_FIRST_PLACE": "1st",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_RANK": "Rank",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_NAME": "Name",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_SCORE": "Score",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_COINS": "Coins",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_STREAK": "Streak",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_PROGRESS": "Progress",
      "TEACHER_LIVE_COMPETITIONS.HOST_MARK_REINFORCE": "Reinforce",
      "TEACHER_LIVE_COMPETITIONS.HOST_MARK_RETRY": "Retry queued",
      "TEACHER_LIVE_COMPETITIONS.HOST_MARK_FROZEN": "Frozen",
      "TEACHER_LIVE_COMPETITIONS.HOST_NO_PLAYERS": "No players",
      "TEACHER_LIVE_COMPETITIONS.HOST_LOAD_ERROR": "Host board could not be loaded.",
      "TEACHER_LIVE_COMPETITIONS.HOST_RETRY": "Retry",
      "TEACHER_LIVE_COMPETITIONS.HOST_INVALID_SESSION": "Invalid session.",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_TITLE": "Student answers",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_HINT": "Read-only review from the server",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_CLOSE": "Close",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_LOAD_ERROR":
        "Could not load this student’s answers.",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_EMPTY": "No questions in this session yet.",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_UNANSWERED": "Not answered",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_EVER_CORRECT": "Correct",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_INCORRECT": "Incorrect",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_NO_ATTEMPTS": "No attempts yet.",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_OK": "Correct",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_MISS": "Wrong",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_TIMED_OUT": "Timed out",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_RETRY": "Retry",
      "TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_REINFORCE": "Reinforce",
      "TEACHER_LIVE_COMPETITIONS.HOST_DEMO_SUBTITLE": "Demo subtitle",
      "TEACHER_LIVE_COMPETITIONS.HOST_DEMO_CRUMB": "Demo board",
    };
    return labels[key] || key;
  };
  return {
    useTranslation: () => ({
      i18n: { dir: () => "ltr" },
      t,
    }),
  };
});

jest.mock("@/api/liveCompetitionsTeacherApi", () => {
  const actual = jest.requireActual("@/api/liveCompetitionsTeacherApi");
  return {
    ...actual,
    fetchLiveCompetitionHost: jest.fn(),
    endLiveCompetitionSession: jest.fn(),
    fetchLiveCompetitionPlayerAnswers: jest.fn(),
  };
});

const fetchHostMock = fetchLiveCompetitionHost as jest.MockedFunction<
  typeof fetchLiveCompetitionHost
>;
const endSessionMock = endLiveCompetitionSession as jest.MockedFunction<
  typeof endLiveCompetitionSession
>;
const fetchPlayerAnswersMock = fetchLiveCompetitionPlayerAnswers as jest.MockedFunction<
  typeof fetchLiveCompetitionPlayerAnswers
>;

function baseHost(
  overrides: Partial<LiveCompetitionHostPayload> = {}
): LiveCompetitionHostPayload {
  return {
    code: "HOST01",
    status: "playing",
    type: "classic",
    goal: "comprehension",
    goal_label: "Comprehension",
    goal_hint: "hint",
    version: 1,
    question_total: 6,
    question_seconds: 20,
    team_mode: true,
    firewood: 1,
    firewood_needed: 2,
    fire_lit: false,
    active_event: "storm",
    event_title: "STORM!",
    event_body: "Wind stole a log.",
    firewall_active: false,
    bridge_broken: false,
    bridge_progress: 0,
    invited_total: 2,
    joined_total: 2,
    players: [
      {
        id: 21,
        player_id: 101,
        rank: 1,
        name: "Sara",
        score: 3,
        coins: 12,
        streak: 2,
        progress: 50,
        avatar: null,
        power: "freeze",
        power_used: false,
        shield: false,
        frozen: false,
        team: "Red",
        team_color: "#f66",
        password_hint: "S",
        reinforce: true,
        retry_queued: 0,
        answers_since_retry: 1,
      },
      {
        id: 22,
        player_id: 102,
        rank: 2,
        name: "Omar",
        score: 1,
        coins: 4,
        streak: 0,
        progress: 16.7,
        avatar: null,
        power: null,
        power_used: false,
        shield: true,
        frozen: true,
        team: "Blue",
        team_color: "#66f",
        password_hint: null,
        reinforce: false,
        retry_queued: 1,
        answers_since_retry: 0,
      },
    ],
    teams: [
      { id: 1, name: "Red", color: "#f66", score: 3, coins: 12 },
      { id: 2, name: "Blue", color: "#66f", score: 1, coins: 4 },
    ],
    hardest: [],
    fastest_name: "Sara",
    fastest_ms: 900,
    fastest_id: 21,
    answers_total: 4,
    answers_correct: 3,
    class_accuracy: 75,
    seconds_left: 125,
    started_at: "2026-11-03 10:00:00",
    ends_at: "2026-11-03 10:10:00",
    ...overrides,
  };
}

function endedReportHost(
  overrides: Partial<LiveCompetitionHostPayload> = {}
): LiveCompetitionHostPayload {
  return baseHost({
    status: "ended",
    version: 9,
    seconds_left: 0,
    fire_lit: true,
    firewood: 2,
    active_event: null,
    event_title: null,
    event_body: null,
    class_accuracy: 62,
    answers_total: 10,
    answers_correct: 6,
    fastest_name: "Sara",
    fastest_ms: 1200,
    fastest_id: 21,
    hardest: [
      {
        id: 7,
        question: "What is photosynthesis?",
        wrong: 4,
        correct: 1,
        total: 5,
        miss_rate: 80,
      },
    ],
    ...overrides,
  });
}

function renderHost(sessionId = "55") {
  return render(
    <MemoryRouter initialEntries={[`/live-games/sessions/${sessionId}/host`]}>
      <Routes>
        <Route
          path="/live-games/sessions/:sessionId/host"
          element={<LiveSessionHostPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function renderDemoHost(mode: "playing" | "ended" = "playing") {
  return render(
    <MemoryRouter
      initialEntries={[`/live-games/sessions/demo/host?demo=${mode}`]}
    >
      <Routes>
        <Route
          path="/live-games/sessions/:sessionId/host"
          element={<LiveSessionHostPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("formatSecondsLeft", () => {
  it("formats null and positive seconds", () => {
    expect(formatSecondsLeft(null)).toBe("--:--");
    expect(formatSecondsLeft(125)).toBe("02:05");
  });
});

describe("formatFastestMs", () => {
  it("returns null for missing or non-positive values", () => {
    expect(formatFastestMs(null)).toBeNull();
    expect(formatFastestMs(0)).toBeNull();
    expect(formatFastestMs(-1)).toBeNull();
    expect(formatFastestMs(1500)).toBe("1.5s");
  });
});

describe("hardestAnswerBarSegments", () => {
  it("uses grey empty when there are no answers", () => {
    expect(hardestAnswerBarSegments({ correct: 0, wrong: 0, total: 0 })).toEqual({
      correctPct: 0,
      wrongPct: 0,
      empty: true,
    });
  });

  it("is full green when all correct and full red when all wrong", () => {
    expect(hardestAnswerBarSegments({ correct: 3, wrong: 0, total: 3 })).toEqual({
      correctPct: 100,
      wrongPct: 0,
      empty: false,
    });
    expect(hardestAnswerBarSegments({ correct: 0, wrong: 4, total: 4 })).toEqual({
      correctPct: 0,
      wrongPct: 100,
      empty: false,
    });
  });

  it("splits green and red for mixed answers", () => {
    expect(hardestAnswerBarSegments({ correct: 1, wrong: 4, total: 5 })).toEqual({
      correctPct: 20,
      wrongPct: 80,
      empty: false,
    });
  });
});

describe("LiveSessionHostPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchHostMock.mockReset();
    endSessionMock.mockReset();
    fetchPlayerAnswersMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads the host board and renders ranking, teams, and active event", async () => {
    fetchHostMock.mockResolvedValue({ status: true, host: baseHost() });
    renderHost();

    expect(await screen.findByTestId("host-board-stage")).toBeInTheDocument();
    expect(screen.getByTestId("host-room-code")).toHaveTextContent("CODE HOST01");
    expect(screen.getByTestId("host-status")).toHaveTextContent("playing");
    expect(screen.getByTestId("host-timer")).toHaveTextContent("02:05");
    expect(screen.getByTestId("host-player-rank-21")).toHaveTextContent("1");
    expect(screen.getByTestId("host-player-name-21")).toHaveTextContent("Sara");
    expect(screen.getByTestId("host-player-21")).toHaveAttribute(
      "data-first-place",
      "1"
    );
    expect(screen.getByTestId("host-first-place-tag")).toHaveTextContent("1st");
    expect(screen.getByTestId("host-player-22")).toHaveAttribute(
      "data-first-place",
      "0"
    );
    expect(screen.getByTestId("host-player-score-21")).toHaveTextContent("3/6");
    expect(screen.getByTestId("host-player-coins-22")).toHaveTextContent("4");
    expect(screen.getByTestId("host-teams")).toBeInTheDocument();
    expect(screen.getByTestId("host-team-1")).toHaveTextContent("Red · 3 pts · 12c");
    expect(screen.getByTestId("host-active-event")).toHaveTextContent("STORM!");
    expect(screen.getByTestId("host-campfire")).toHaveTextContent("Firewood 1 / 2");
    expect(screen.getByTestId("host-end-button")).toBeInTheDocument();
    expect(fetchHostMock).toHaveBeenCalledWith(55);
    expect(endSessionMock).not.toHaveBeenCalled();
  });

  it("shows End only while playing; not in lobby or ended", async () => {
    fetchHostMock.mockResolvedValue({
      status: true,
      host: baseHost({
        status: "lobby",
        version: 0,
        players: [],
        teams: [],
        active_event: null,
        event_title: null,
        event_body: null,
        joined_total: 1,
        invited_total: 3,
      }),
    });
    const { unmount } = renderHost();
    expect(await screen.findByTestId("host-lobby-state")).toBeInTheDocument();
    expect(screen.queryByTestId("host-end-button")).not.toBeInTheDocument();
    unmount();

    fetchHostMock.mockResolvedValue({
      status: true,
      host: endedReportHost(),
    });
    renderHost("57");
    expect(await screen.findByTestId("host-final-report")).toBeInTheDocument();
    expect(screen.queryByTestId("host-end-button")).not.toBeInTheDocument();
    expect(endSessionMock).not.toHaveBeenCalled();
  });

  it("requires confirmation before calling End once", async () => {
    jest.useRealTimers();
    fetchHostMock.mockResolvedValue({ status: true, host: baseHost() });
    endSessionMock.mockResolvedValue({
      status: true,
      host: endedReportHost(),
    });
    renderHost();

    expect(await screen.findByTestId("host-end-button")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("host-end-button"));
    expect(await screen.findByTestId("host-end-confirm")).toBeInTheDocument();
    expect(endSessionMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("host-end-confirm"));
    await waitFor(() => {
      expect(endSessionMock).toHaveBeenCalledTimes(1);
      expect(endSessionMock).toHaveBeenCalledWith(55);
      expect(screen.getByTestId("host-final-report")).toBeInTheDocument();
    });
    expect(screen.getByTestId("host-report-accuracy")).toHaveTextContent("62%");
    expect(screen.getByTestId("host-hardest-7")).toHaveTextContent(
      "What is photosynthesis?"
    );
    expect(screen.getByTestId("host-report-fastest")).toHaveTextContent("Sara");
    expect(screen.getByTestId("host-report-fastest")).toHaveTextContent("1.2s");
    expect(screen.getByTestId("host-final-player-21")).toHaveTextContent("Sara");
  });

  it("disables End while the request is pending and does not call End twice", async () => {
    jest.useRealTimers();
    fetchHostMock.mockResolvedValue({ status: true, host: baseHost() });
    let resolveEnd: ((value: unknown) => void) | null = null;
    endSessionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEnd = resolve;
        }) as any
    );

    renderHost();
    expect(await screen.findByTestId("host-end-button")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("host-end-button"));
    fireEvent.click(await screen.findByTestId("host-end-confirm"));

    await waitFor(() => {
      expect(endSessionMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("host-end-button")).toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("host-end-button"));
    expect(endSessionMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveEnd?.({ status: true, host: endedReportHost() });
    });
    await waitFor(() => {
      expect(screen.getByTestId("host-final-report")).toBeInTheDocument();
    });
  });

  it("loads an already-ended host as the final report without calling End", async () => {
    fetchHostMock.mockResolvedValue({
      status: true,
      host: endedReportHost(),
    });
    renderHost();

    expect(await screen.findByTestId("host-final-report")).toBeInTheDocument();
    expect(screen.getByTestId("host-report-answers")).toHaveTextContent("6/10");
    expect(screen.getByTestId("host-report-fire")).toHaveTextContent("Campfire lit");
    expect(endSessionMock).not.toHaveBeenCalled();
    expect(fetchHostMock).toHaveBeenCalled();
    const callsAfterLoad = fetchHostMock.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS * 3);
    });
    expect(fetchHostMock.mock.calls.length).toBe(callsAfterLoad);
    expect(endSessionMock).not.toHaveBeenCalled();
  });

  it("preserves the live board and allows retry when End fails", async () => {
    jest.useRealTimers();
    fetchHostMock.mockResolvedValue({ status: true, host: baseHost() });
    endSessionMock
      .mockRejectedValueOnce(new Error("Session is still in lobby."))
      .mockResolvedValueOnce({ status: true, host: endedReportHost() });

    renderHost();
    expect(await screen.findByTestId("host-player-name-21")).toHaveTextContent("Sara");

    fireEvent.click(screen.getByTestId("host-end-button"));
    fireEvent.click(await screen.findByTestId("host-end-confirm"));

    await waitFor(() => {
      expect(screen.getByText("Session is still in lobby.")).toBeInTheDocument();
    });
    expect(screen.getByTestId("host-board-body")).toBeInTheDocument();
    expect(screen.getByTestId("host-player-name-21")).toHaveTextContent("Sara");
    expect(screen.getByTestId("host-end-button")).not.toBeDisabled();
    expect(screen.queryByTestId("host-final-report")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("host-end-button"));
    fireEvent.click(await screen.findByTestId("host-end-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("host-final-report")).toBeInTheDocument();
    });
    expect(endSessionMock).toHaveBeenCalledTimes(2);
  });

  it("stops polling after End succeeds", async () => {
    fetchHostMock.mockResolvedValue({ status: true, host: baseHost() });
    endSessionMock.mockResolvedValue({
      status: true,
      host: endedReportHost(),
    });

    renderHost();
    expect(await screen.findByTestId("host-end-button")).toBeInTheDocument();
    const afterLoad = fetchHostMock.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS);
    });
    await waitFor(() => {
      expect(fetchHostMock.mock.calls.length).toBeGreaterThan(afterLoad);
    });

    // Dialog + End promise need real timers; polling already verified above.
    jest.useRealTimers();
    fireEvent.click(screen.getByTestId("host-end-button"));
    fireEvent.click(await screen.findByTestId("host-end-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("host-final-report")).toBeInTheDocument();
    });

    const callsAfterEnd = fetchHostMock.mock.calls.length;
    await new Promise((r) => setTimeout(r, HOST_POLL_MS + 200));
    expect(fetchHostMock.mock.calls.length).toBe(callsAfterEnd);
  });

  it("polls while playing without overlapping in-flight requests", async () => {
    let pendingResolve: ((value: unknown) => void) | null = null;
    let mode: "open" | "block" = "open";

    fetchHostMock.mockImplementation(() => {
      if (mode === "block") {
        return new Promise((resolve) => {
          pendingResolve = resolve;
        }) as any;
      }
      return Promise.resolve({ status: true, host: baseHost() });
    });

    renderHost();
    expect(await screen.findByTestId("host-board-stage")).toBeInTheDocument();
    const afterLoad = fetchHostMock.mock.calls.length;

    mode = "block";
    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS);
    });
    await waitFor(() => {
      expect(fetchHostMock.mock.calls.length).toBe(afterLoad + 1);
    });
    const whileBlocked = fetchHostMock.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS);
    });
    expect(fetchHostMock.mock.calls.length).toBe(whileBlocked);

    mode = "open";
    await act(async () => {
      pendingResolve?.({ status: true, host: baseHost({ seconds_left: 110 }) });
    });

    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS);
    });
    await waitFor(() => {
      expect(fetchHostMock.mock.calls.length).toBeGreaterThan(whileBlocked);
    });
  });

  it("stops polling after ended and cleans up on unmount", async () => {
    let ended = false;
    fetchHostMock.mockImplementation(async () => ({
      status: true,
      host: ended
        ? endedReportHost({ version: 2 })
        : baseHost({ version: 1 }),
    }));

    const { unmount } = renderHost();
    expect(await screen.findByTestId("host-status")).toHaveTextContent("playing");

    ended = true;
    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS);
    });
    expect(await screen.findByTestId("host-ended-banner")).toBeInTheDocument();

    const callsAfterEnded = fetchHostMock.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS * 3);
    });
    expect(fetchHostMock.mock.calls.length).toBe(callsAfterEnded);

    unmount();
    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS * 3);
    });
    expect(fetchHostMock.mock.calls.length).toBe(callsAfterEnded);
  });

  it("updates timer from the latest response when version is unchanged", async () => {
    let secondsLeft = 100;
    fetchHostMock.mockImplementation(async () => ({
      status: true,
      host: baseHost({
        version: 4,
        seconds_left: secondsLeft,
        players: [
          {
            ...baseHost().players[0],
            score: secondsLeft === 100 ? 3 : 99,
          },
          baseHost().players[1],
        ],
      }),
    }));

    renderHost();
    expect(await screen.findByTestId("host-timer")).toHaveTextContent("01:40");
    expect(screen.getByTestId("host-player-score-21")).toHaveTextContent("3/6");
    const body = screen.getByTestId("host-board-body");

    secondsLeft = 90;
    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS);
    });

    await waitFor(() => {
      expect(screen.getByTestId("host-timer")).toHaveTextContent("01:30");
    });
    expect(screen.getByTestId("host-board-body")).toBe(body);
    expect(screen.getByTestId("host-player-score-21")).toHaveTextContent("3/6");
  });

  it("does not present lobby status as playing", async () => {
    fetchHostMock.mockResolvedValue({
      status: true,
      host: baseHost({
        status: "lobby",
        version: 0,
        players: [],
        teams: [],
        active_event: null,
        event_title: null,
        event_body: null,
        joined_total: 1,
        invited_total: 3,
      }),
    });

    renderHost();
    expect(await screen.findByTestId("host-lobby-state")).toBeInTheDocument();
    expect(screen.getByTestId("host-status")).toHaveTextContent("lobby");
    expect(screen.queryByTestId("host-leaderboard")).not.toBeInTheDocument();
    expect(screen.queryByText("playing")).not.toBeInTheDocument();
  });

  it("preserves the last valid board on API failure and offers retry", async () => {
    let mode: "ok" | "fail" | "recover" = "ok";
    fetchHostMock.mockImplementation(async () => {
      if (mode === "fail") {
        throw new Error("Network down");
      }
      if (mode === "recover") {
        return {
          status: true,
          host: baseHost({ version: 5, seconds_left: 80 }),
        };
      }
      return { status: true, host: baseHost() };
    });

    renderHost();
    expect(await screen.findByTestId("host-player-name-21")).toHaveTextContent("Sara");

    mode = "fail";
    await act(async () => {
      jest.advanceTimersByTime(HOST_POLL_MS);
    });

    expect(await screen.findByText("Network down")).toBeInTheDocument();
    expect(screen.getByTestId("host-player-name-21")).toHaveTextContent("Sara");

    mode = "recover";
    fireEvent.click(screen.getByTestId("host-retry-button"));
    await waitFor(() => {
      expect(screen.getByTestId("host-timer")).toHaveTextContent("01:20");
    });
  });

  it("renders gold quest and hacking indicators from payload flags", async () => {
    fetchHostMock.mockResolvedValue({
      status: true,
      host: baseHost({
        type: "gold_quest",
        bridge_progress: 40,
        bridge_broken: false,
        active_event: null,
        event_title: null,
        event_body: null,
      }),
    });
    const { unmount } = renderHost();
    expect(await screen.findByTestId("host-bridge")).toHaveTextContent(
      "Bridge progress 40%"
    );
    unmount();

    fetchHostMock.mockResolvedValue({
      status: true,
      host: baseHost({
        type: "hacking",
        firewall_active: true,
        active_event: null,
        event_title: null,
        event_body: null,
      }),
    });
    renderHost("56");
    expect(await screen.findByTestId("host-firewall")).toHaveTextContent("Firewall up");
  });

  it("opens player answers drawer from a live name click and loads the review API", async () => {
    jest.useRealTimers();
    fetchHostMock.mockResolvedValue({ status: true, host: baseHost() });
    fetchPlayerAnswersMock.mockResolvedValue({
      status: true,
      review: {
        session: {
          id: 55,
          code: "HOST01",
          status: "playing",
          live_game_id: 1,
          class_id: 1,
        },
        student: { id: 21, name: "Sara", name_ar: null, photo: null },
        player: {
          player_id: 101,
          score: 3,
          coins: 12,
          streak: 2,
          rank: 1,
        },
        questions: [
          {
            id: 7,
            sort_order: 1,
            question: "What is photosynthesis?",
            image: null,
            voice_url: null,
            answer_type: "text",
            choices: ["A", "B"],
            correct_answer: "A",
            explanation: null,
            answered: true,
            ever_correct: true,
            attempts: [
              {
                id: 90,
                answer: "A",
                correct: true,
                timed_out: false,
                is_retry: false,
                is_reinforce: false,
                attempt: 1,
                elapsed_ms: 1200,
                coins_delta: 3,
                created_at: "2026-11-04 14:00:00",
              },
            ],
          },
        ],
      },
    });

    renderHost();
    fireEvent.click(await screen.findByTestId("host-player-name-21"));

    expect(await screen.findByTestId("host-answers-drawer")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchPlayerAnswersMock).toHaveBeenCalledWith(55, 21);
    });
    expect(await screen.findByTestId("host-review-question-7")).toHaveTextContent(
      "What is photosynthesis?"
    );
    expect(screen.getByTestId("host-review-student")).toHaveTextContent("Sara");
    expect(screen.getByTestId("host-review-attempt-90")).toHaveTextContent("A");
    expect(screen.getByTestId("host-review-attempt-90")).toHaveTextContent("Correct");

    fireEvent.click(screen.getByTestId("host-review-close"));
    await waitFor(() => {
      expect(screen.queryByTestId("host-review-question-7")).not.toBeInTheDocument();
    });
  });

  it("opens player answers from the ended board without calling the API in demo mode", async () => {
    jest.useRealTimers();
    renderDemoHost("ended");

    expect(await screen.findByTestId("host-final-report")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("host-final-player-name-101"));

    expect(await screen.findByTestId("host-answers-drawer")).toBeInTheDocument();
    expect(fetchPlayerAnswersMock).not.toHaveBeenCalled();
    expect(fetchHostMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("host-review-student")).toHaveTextContent(
      "Sara Hassan"
    );
    expect(screen.getByTestId("host-review-question-1001")).toBeInTheDocument();
  });
});

describe("HostFinalReport", () => {
  const t = (key: string, params?: Record<string, unknown>) => {
    if (key === "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST_META") {
      return `Missed by ${params?.wrong}/${params?.total} · ${params?.correct} correct · ${params?.miss}% miss`;
    }
    const labels: Record<string, string> = {
      "TEACHER_LIVE_COMPETITIONS.HOST_ENDED_TITLE": "Session ended",
      "TEACHER_LIVE_COMPETITIONS.HOST_ENDED_BODY": "Live polling has stopped.",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_ACCURACY": "Class accuracy",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_ANSWERS": "Correct answers",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FIRE": "Campfire",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FIRE_OUT": "Not lit",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FASTEST": "Fastest",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST": "Weakest questions",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST_EMPTY": "No scored answers yet.",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_QUESTION_FALLBACK": "Question",
      "TEACHER_LIVE_COMPETITIONS.HOST_REPORT_LEADERBOARD": "Final ranking",
      "TEACHER_LIVE_COMPETITIONS.HOST_FIRE_LIT": "Campfire lit",
      "TEACHER_LIVE_COMPETITIONS.HOST_FIRST_PLACE": "1st",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_RANK": "Rank",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_NAME": "Name",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_SCORE": "Score",
      "TEACHER_LIVE_COMPETITIONS.HOST_COL_COINS": "Coins",
      "TEACHER_LIVE_COMPETITIONS.HOST_NO_PLAYERS": "No players",
    };
    return labels[key] || key;
  };

  it("renders empty or null report fields safely and hides invalid fastest", () => {
    const { queryByTestId, getByTestId } = render(
      <HostFinalReport
        host={endedReportHost({
          class_accuracy: null as unknown as number,
          answers_total: null as unknown as number,
          answers_correct: null as unknown as number,
          fastest_name: null,
          fastest_ms: null,
          hardest: null as unknown as [],
          players: [],
          fire_lit: false,
        })}
        t={t}
      />
    );

    expect(getByTestId("host-report-accuracy")).toHaveTextContent("—");
    expect(getByTestId("host-report-answers")).toHaveTextContent("—/—");
    expect(getByTestId("host-report-fire")).toHaveTextContent("Not lit");
    expect(queryByTestId("host-report-fastest")).not.toBeInTheDocument();
    expect(getByTestId("host-report-hardest-empty")).toHaveTextContent(
      "No scored answers yet."
    );
  });

  it("uses backend hardest and fastest values as-is", () => {
    const { getByTestId } = render(
      <HostFinalReport host={endedReportHost()} t={t} />
    );
    expect(getByTestId("host-hardest-7")).toHaveTextContent(
      "What is photosynthesis?"
    );
    expect(getByTestId("host-hardest-7")).toHaveTextContent(
      "Missed by 4/5 · 1 correct · 80% miss"
    );
    expect(getByTestId("host-report-fastest")).toHaveTextContent("Sara");
    expect(getByTestId("host-report-fastest")).toHaveTextContent("1.2s");
  });

  it("renders green/red answer bars from correct and wrong shares", () => {
    const { getByTestId, queryByTestId } = render(
      <HostFinalReport
        host={endedReportHost({
          hardest: [
            {
              id: 1,
              question: "All correct",
              wrong: 0,
              correct: 2,
              total: 2,
              miss_rate: 0,
            },
            {
              id: 2,
              question: "All wrong",
              wrong: 2,
              correct: 0,
              total: 2,
              miss_rate: 100,
            },
            {
              id: 3,
              question: "Mixed",
              wrong: 1,
              correct: 1,
              total: 2,
              miss_rate: 50,
            },
            {
              id: 4,
              question: "No answers",
              wrong: 0,
              correct: 0,
              total: 0,
              miss_rate: 0,
            },
          ],
        })}
        t={t}
      />
    );

    expect(getByTestId("host-hardest-bar-correct-1")).toHaveStyle({ width: "100%" });
    expect(queryByTestId("host-hardest-bar-wrong-1")).not.toBeInTheDocument();
    expect(getByTestId("host-hardest-pct-1").querySelector('[data-pct="correct"]')).toHaveTextContent(
      "100%"
    );

    expect(getByTestId("host-hardest-bar-wrong-2")).toHaveStyle({ width: "100%" });
    expect(queryByTestId("host-hardest-bar-correct-2")).not.toBeInTheDocument();
    expect(getByTestId("host-hardest-pct-2").querySelector('[data-pct="wrong"]')).toHaveTextContent(
      "100%"
    );

    expect(getByTestId("host-hardest-bar-correct-3")).toHaveStyle({ width: "50%" });
    expect(getByTestId("host-hardest-bar-wrong-3")).toHaveStyle({ width: "50%" });
    expect(getByTestId("host-hardest-pct-3").querySelector('[data-pct="correct"]')).toHaveTextContent(
      "50%"
    );
    expect(getByTestId("host-hardest-pct-3").querySelector('[data-pct="wrong"]')).toHaveTextContent(
      "50%"
    );

    expect(getByTestId("host-hardest-bar-4")).toHaveAttribute("data-empty", "1");
    expect(getByTestId("host-hardest-pct-4").querySelector('[data-pct="empty"]')).toHaveTextContent(
      "0%"
    );
  });
});

describe("HostBoardBody memo", () => {
  it("keeps the same body instance when host reference is unchanged", () => {
    const host = baseHost();
    const t = (key: string) => key;
    const { rerender, getByTestId } = render(<HostBoardBody host={host} t={t} />);
    const first = getByTestId("host-board-body");
    rerender(<HostBoardBody host={host} t={t} />);
    expect(getByTestId("host-board-body")).toBe(first);
  });
});
