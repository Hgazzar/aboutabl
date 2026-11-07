import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AvailableLiveGamesPage from "./AvailableLiveGamesPage";
import {
  fetchAvailableLiveCompetitions,
  fetchLiveCompetitionLobbySessions,
} from "@/api/liveCompetitionsTeacherApi";

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
      const map: Record<string, string> = {
        "TEACHER_LIVE_COMPETITIONS.HOME_TITLE": "Live competitions",
        "TEACHER_LIVE_COMPETITIONS.HOME_PICK_TYPE": "Pick a game type",
        "TEACHER_LIVE_COMPETITIONS.HOME_PICK_GAME": "Pick a game for this type",
        "TEACHER_LIVE_COMPETITIONS.HOME_BACK_TYPES": "Back to game types",
        "TEACHER_LIVE_COMPETITIONS.HOME_EMPTY":
          "No published live competitions are available for your schools yet.",
        "TEACHER_LIVE_COMPETITIONS.HOME_LOAD_ERROR":
          "Available live competitions could not be loaded.",
        "TEACHER_LIVE_COMPETITIONS.HOME_ACTIVE_SESSIONS": "Your active sessions",
        "TEACHER_LIVE_COMPETITIONS.HOME_ACTIVE_SESSIONS_HINT":
          "Resume a lobby or host board without starting a new session.",
        "TEACHER_LIVE_COMPETITIONS.HOME_ENTER_LOBBY": "Enter lobby",
        "TEACHER_LIVE_COMPETITIONS.HOME_ENTER_HOST": "Open host board",
        "TEACHER_LIVE_COMPETITIONS.HOME_STATUS_LOBBY": "Lobby",
        "TEACHER_LIVE_COMPETITIONS.HOME_STATUS_PLAYING": "Playing",
        "TEACHER_LIVE_COMPETITIONS.HOME_SESSION_COUNTS":
          "{{joined}} joined · {{invited}} invited",
        "TEACHER_LIVE_COMPETITIONS.TYPE_CLASSIC": "Classic",
        "TEACHER_LIVE_COMPETITIONS.TYPE_CLASSIC_BLURB": "Campfire race",
        "TEACHER_LIVE_COMPETITIONS.TYPE_HACKING": "hacking",
        "TEACHER_LIVE_COMPETITIONS.TYPE_HACKING_BLURB": "Password protocols",
        "TEACHER_LIVE_COMPETITIONS.TYPE_GOLD_QUEST": "GoldQuest",
        "TEACHER_LIVE_COMPETITIONS.TYPE_GOLD_QUEST_BLURB": "Treasure chests",
        "TEACHER_LIVE_COMPETITIONS.TYPE_UNAVAILABLE":
          "Unavailable for your schools",
      };
      if (key === "TEACHER_LIVE_COMPETITIONS.HOME_SESSION_LABEL") {
        return `Session #${params?.id}`;
      }
      if (key === "TEACHER_LIVE_COMPETITIONS.HOST_CODE") {
        return `CODE ${params?.code}`;
      }
      if (key === "TEACHER_LIVE_COMPETITIONS.TYPE_GAME_COUNT") {
        return `${params?.count} games`;
      }
      if (key === "TEACHER_LIVE_COMPETITIONS.HOME_SESSION_COUNTS") {
        return `${params?.joined} joined · ${params?.invited} invited`;
      }
      return map[key] || key;
    },
  }),
}));

jest.mock("@/api/liveCompetitionsTeacherApi", () => ({
  fetchAvailableLiveCompetitions: jest.fn(),
  fetchLiveCompetitionLobbySessions: jest.fn(),
}));

const fetchAvailableMock = fetchAvailableLiveCompetitions as jest.MockedFunction<
  typeof fetchAvailableLiveCompetitions
>;
const fetchSessionsMock = fetchLiveCompetitionLobbySessions as jest.MockedFunction<
  typeof fetchLiveCompetitionLobbySessions
>;

function renderPage() {
  return render(
    <MemoryRouter>
      <AvailableLiveGamesPage />
    </MemoryRouter>
  );
}

describe("AvailableLiveGamesPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    fetchAvailableMock.mockReset();
    fetchSessionsMock.mockReset();
    fetchSessionsMock.mockResolvedValue({ status: true, sessions: [] });
  });

  it("shows three game type tiles", async () => {
    fetchAvailableMock.mockResolvedValue({
      status: true,
      games: [
        {
          id: 5,
          name: "Gold Quest A",
          type: "gold_quest",
          status: 1,
          is_published: true,
          questions_count: 4,
        },
      ],
    });

    renderPage();
    expect(await screen.findByTestId("live-game-type-picker")).toBeInTheDocument();
    expect(screen.getByTestId("live-game-type-classic")).toBeDisabled();
    expect(screen.getByTestId("live-game-type-hacking")).toBeDisabled();
    expect(screen.getByTestId("live-game-type-gold_quest")).not.toBeDisabled();
  });

  it("navigates to create when a type has exactly one game", async () => {
    fetchAvailableMock.mockResolvedValue({
      status: true,
      games: [
        {
          id: 5,
          name: "Gold Quest A",
          type: "gold_quest",
          status: 1,
          is_published: true,
          questions_count: 4,
        },
      ],
    });

    renderPage();
    fireEvent.click(await screen.findByTestId("live-game-type-gold_quest"));
    expect(mockNavigate).toHaveBeenCalledWith("/live-games/create?liveGameId=5");
  });

  it("lists games when a type has more than one match", async () => {
    fetchAvailableMock.mockResolvedValue({
      status: true,
      games: [
        {
          id: 5,
          name: "Gold Quest A",
          type: "gold_quest",
          status: 1,
          is_published: true,
          questions_count: 4,
        },
        {
          id: 6,
          name: "Gold Quest B",
          type: "gold_quest",
          status: 1,
          is_published: true,
          questions_count: 3,
        },
      ],
    });

    renderPage();
    fireEvent.click(await screen.findByTestId("live-game-type-gold_quest"));
    expect(await screen.findByText("Gold Quest A")).toBeInTheDocument();
    expect(screen.getByText("Gold Quest B")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("available-game-5"));
    expect(mockNavigate).toHaveBeenCalledWith("/live-games/create?liveGameId=5");
  });

  it("shows empty state when no games", async () => {
    fetchAvailableMock.mockResolvedValue({ status: true, games: [] });
    renderPage();
    expect(
      await screen.findByText(
        /No published live competitions are available for your schools yet/i
      )
    ).toBeInTheDocument();
  });

  it("does not promote Interactive waiting-room games from Live competitions home", async () => {
    fetchAvailableMock.mockResolvedValue({ status: true, games: [] });
    renderPage();
    expect(
      await screen.findByText(
        /No published live competitions are available for your schools yet/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/Interactive waiting-room games/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /waiting-room/i })).not.toBeInTheDocument();
  });

  it("shows error state", async () => {
    fetchAvailableMock.mockRejectedValue(new Error("Teachers only."));
    renderPage();
    expect(await screen.findByText("Teachers only.")).toBeInTheDocument();
  });

  it("lists open lobbies with class and participation", async () => {
    fetchAvailableMock.mockResolvedValue({ status: true, games: [] });
    fetchSessionsMock.mockResolvedValue({
      status: true,
      sessions: [
        {
          id: 77,
          code: "ZZ99AA",
          status: "lobby",
          live_game_id: 1,
          class_id: 2,
          school_id: 3,
          host_user_id: 4,
          game_name: "Campfire Classic",
          class_name: "Class A",
          grade_name: "Grade 1",
          joined_player_count: 2,
          invited_total: 4,
        },
      ],
    });
    renderPage();
    expect(await screen.findByText("Campfire Classic")).toBeInTheDocument();
    expect(
      screen.getByText(/Lobby · Grade 1 · Class A · 2 joined · 4 invited/)
    ).toBeInTheDocument();
    expect(screen.getByText(/ZZ99AA/)).toBeInTheDocument();
    expect(screen.queryByText(/^lobby$/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("recover-session-77")).toHaveAttribute(
      "href",
      "/live-games/sessions/77"
    );
  });

  it("recovers playing sessions to the host board without creating or beginning", async () => {
    fetchAvailableMock.mockResolvedValue({ status: true, games: [] });
    fetchSessionsMock.mockResolvedValue({
      status: true,
      sessions: [
        {
          id: 88,
          code: "PLAY01",
          status: "playing",
          live_game_id: 1,
          class_id: 2,
          school_id: 3,
          host_user_id: 10,
        },
        {
          id: 77,
          code: "LOBBY1",
          status: "lobby",
          live_game_id: 1,
          class_id: 2,
          school_id: 3,
          host_user_id: 10,
        },
      ],
    });
    renderPage();
    expect(await screen.findByTestId("recoverable-sessions")).toBeInTheDocument();
    expect(screen.getByTestId("recover-session-88")).toHaveAttribute(
      "href",
      "/live-games/sessions/88/host"
    );
    expect(screen.getByTestId("recover-session-77")).toHaveAttribute(
      "href",
      "/live-games/sessions/77"
    );
    expect(fetchSessionsMock).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
