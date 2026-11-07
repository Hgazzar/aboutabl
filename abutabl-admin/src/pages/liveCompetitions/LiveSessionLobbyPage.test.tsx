import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LiveSessionLobbyPage, {
  participationViewForStudent,
} from "./LiveSessionLobbyPage";
import {
  beginLiveCompetitionSession,
  fetchAvailableLiveCompetitions,
  fetchLiveCompetitionLobby,
  fetchLiveCompetitionSessionStudents,
  LIVE_COMPETITION_NOT_IN_LOBBY_MSG,
} from "@/api/liveCompetitionsTeacherApi";
import { getRequest } from "@/utils/fetchMethods";
import { notify } from "@/utils/notify";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "TEACHER_LIVE_COMPETITIONS.TOTALS" && params) {
        return `${params.joined} joined · ${params.pending} waiting · ${params.invited} invited`;
      }
      const labels: Record<string, string> = {
        "TEACHER_LIVE_COMPETITIONS.STATUS_JOINED": "Joined",
        "TEACHER_LIVE_COMPETITIONS.STATUS_WAITING": "Waiting to join",
        "TEACHER_LIVE_COMPETITIONS.STATUS_ACCEPTED_NO_PLAYER": "Invite accepted",
        "TEACHER_LIVE_COMPETITIONS.STATUS_REVOKED": "Invite revoked",
        "TEACHER_LIVE_COMPETITIONS.STATUS_EXPIRED": "Invite expired",
        "TEACHER_LIVE_COMPETITIONS.STATUS_UNKNOWN": "Not invited",
        "TEACHER_LIVE_COMPETITIONS.WAITING_TITLE": "Waiting for participants…",
        "TEACHER_LIVE_COMPETITIONS.PARTICIPATION_HINT":
          "Joined means the student accepted and has a player seat.",
      };
      return labels[key] || key;
    },
  }),
}));

jest.mock("@/api/liveCompetitionsTeacherApi", () => {
  const actual = jest.requireActual("@/api/liveCompetitionsTeacherApi");
  return {
    ...actual,
    beginLiveCompetitionSession: jest.fn(),
    fetchAvailableLiveCompetitions: jest.fn(),
    fetchLiveCompetitionLobby: jest.fn(),
    fetchLiveCompetitionSessionStudents: jest.fn(),
  };
});

jest.mock("@/utils/fetchMethods", () => ({
  getRequest: jest.fn(),
}));

jest.mock("@/utils/notify", () => ({
  notify: jest.fn(),
}));

const fetchLobbyMock = fetchLiveCompetitionLobby as jest.MockedFunction<
  typeof fetchLiveCompetitionLobby
>;
const fetchStudentsMock = fetchLiveCompetitionSessionStudents as jest.MockedFunction<
  typeof fetchLiveCompetitionSessionStudents
>;
const beginMock = beginLiveCompetitionSession as jest.MockedFunction<
  typeof beginLiveCompetitionSession
>;
const fetchAvailableMock = fetchAvailableLiveCompetitions as jest.MockedFunction<
  typeof fetchAvailableLiveCompetitions
>;
const getRequestMock = getRequest as jest.MockedFunction<typeof getRequest>;

const lobbyPayload = {
  status: true as const,
  lobby: {
    session: {
      id: 55,
      code: "LOBBY1",
      status: "lobby",
      live_game_id: 5,
      class_id: 12,
      school_id: 1,
      host_user_id: 8,
      questions_count: 6,
    },
    invited_total: 2,
    joined_total: 1,
    pending_total: 1,
    eligible_students: [
      {
        id: 21,
        name: "Sara",
        name_ar: null,
        photo: null,
        class_id: 12,
        school_id: 1,
        invite_status: "accepted",
        joined: true,
        accepted_at: "2026-11-03T09:00:00+00:00",
      },
      {
        id: 22,
        name: "Omar",
        name_ar: null,
        photo: null,
        class_id: 12,
        school_id: 1,
        invite_status: "pending",
        joined: false,
        accepted_at: null,
      },
    ],
  },
};

function renderLobby() {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/live-games/sessions/55",
          state: { gameName: "Classic Camp", className: "Grade 5-A" },
        },
      ]}
    >
      <Routes>
        <Route
          path="/live-games/sessions/:sessionId"
          element={<LiveSessionLobbyPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("participationViewForStudent", () => {
  it("requires a player row for Joined and pending invite for Waiting", () => {
    expect(
      participationViewForStudent({
        id: 1,
        name: "A",
        class_id: 1,
        invite_status: "accepted",
        joined: true,
      }).labelKey
    ).toBe("TEACHER_LIVE_COMPETITIONS.STATUS_JOINED");

    expect(
      participationViewForStudent({
        id: 2,
        name: "B",
        class_id: 1,
        invite_status: "pending",
        joined: false,
      }).labelKey
    ).toBe("TEACHER_LIVE_COMPETITIONS.STATUS_WAITING");

    expect(
      participationViewForStudent({
        id: 3,
        name: "C",
        class_id: 1,
        invite_status: "accepted",
        joined: false,
      }).labelKey
    ).toBe("TEACHER_LIVE_COMPETITIONS.STATUS_ACCEPTED_NO_PLAYER");
  });
});

describe("LiveSessionLobbyPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate.mockReset();
    fetchLobbyMock.mockReset();
    fetchStudentsMock.mockReset();
    beginMock.mockReset();
    fetchAvailableMock.mockReset();
    getRequestMock.mockReset();
    (notify as jest.Mock).mockReset();

    fetchLobbyMock.mockResolvedValue(lobbyPayload);
    fetchStudentsMock.mockResolvedValue({
      status: true,
      students: lobbyPayload.lobby.eligible_students,
    });
    fetchAvailableMock.mockResolvedValue({ status: true, games: [] });
    getRequestMock.mockResolvedValue({ status: true, classes: [] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders joined vs waiting from backend participation fields", async () => {
    renderLobby();

    expect(await screen.findByTestId("teacher-lobby-stage")).toBeInTheDocument();
    expect(screen.getByText("Classic Camp")).toBeInTheDocument();
    expect(screen.getByTestId("lobby-room-code")).toHaveTextContent("LOBBY1");
    expect(screen.getByText("Sara")).toBeInTheDocument();
    expect(screen.getByText("Omar")).toBeInTheDocument();
    expect(screen.getByTestId("lobby-invite-count")).toHaveTextContent(
      "1 joined · 1 waiting · 2 invited"
    );
    expect(screen.getByTestId("lobby-student-status-21")).toHaveTextContent("Joined");
    expect(screen.getByTestId("lobby-student-status-22")).toHaveTextContent(
      "Waiting to join"
    );
    expect(screen.getByTestId("lobby-student-21")).toHaveAttribute(
      "data-joined",
      "true"
    );
    expect(screen.getByTestId("lobby-student-22")).toHaveAttribute(
      "data-joined",
      "false"
    );
  });

  it("does not label every eligible student as joined when fields are missing", async () => {
    fetchLobbyMock.mockResolvedValue({
      status: true,
      lobby: {
        ...lobbyPayload.lobby,
        invited_total: undefined,
        joined_total: undefined,
        pending_total: undefined,
        eligible_students: [
          {
            id: 21,
            name: "Sara",
            name_ar: null,
            photo: null,
            class_id: 12,
            school_id: 1,
          },
        ],
      },
    });
    fetchStudentsMock.mockResolvedValue({
      status: true,
      students: [
        {
          id: 21,
          name: "Sara",
          name_ar: null,
          photo: null,
          class_id: 12,
          school_id: 1,
        },
      ],
    });

    renderLobby();
    expect(await screen.findByTestId("lobby-student-status-21")).toHaveTextContent(
      "Not invited"
    );
    expect(screen.getByTestId("lobby-student-21")).toHaveAttribute(
      "data-joined",
      "false"
    );
  });

  it("polls lobby while in lobby and cleans up on unmount", async () => {
    const { unmount } = renderLobby();
    await screen.findByTestId("teacher-lobby-stage");
    expect(fetchLobbyMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(fetchLobbyMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    const callsAfterPoll = fetchLobbyMock.mock.calls.length;
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(fetchLobbyMock.mock.calls.length).toBe(callsAfterPoll);
  });

  it("begins the session once and navigates to the host placeholder", async () => {
    let resolveBegin: (value: unknown) => void = () => undefined;
    beginMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBegin = resolve;
        }) as any
    );

    renderLobby();
    await screen.findByTestId("begin-session-button");

    const button = screen.getByTestId("begin-session-button");
    fireEvent.click(button);
    fireEvent.click(button);
    expect(beginMock).toHaveBeenCalledTimes(1);
    expect(beginMock).toHaveBeenCalledWith(55);

    await act(async () => {
      resolveBegin({
        status: true,
        session: { ...lobbyPayload.lobby.session, status: "playing" },
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/live-games/sessions/55/host",
        { replace: true }
      );
    });
  });

  it("treats lobby 409 as started-session transition", async () => {
    fetchLobbyMock.mockRejectedValue(new Error(LIVE_COMPETITION_NOT_IN_LOBBY_MSG));
    renderLobby();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/live-games/sessions/55/host",
        { replace: true }
      );
    });
  });

  it("shows authorization errors without navigating", async () => {
    fetchLobbyMock.mockRejectedValue(
      new Error("You are not authorized for this session.")
    );
    renderLobby();

    expect(
      await screen.findByText("You are not authorized for this session.")
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
