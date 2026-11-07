import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CreateLiveSessionPage from "./CreateLiveSessionPage";
import {
  createLiveCompetitionSession,
  fetchAvailableLiveCompetitions,
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

jest.mock("@/api/liveCompetitionsTeacherApi", () => {
  const actual = jest.requireActual("@/api/liveCompetitionsTeacherApi");
  return {
    ...actual,
    createLiveCompetitionSession: jest.fn(),
    fetchAvailableLiveCompetitions: jest.fn(),
  };
});

jest.mock("@/utils/fetchMethods", () => ({
  getRequest: jest.fn(),
}));

jest.mock("@/utils/notify", () => ({
  notify: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "TEACHER_LIVE_COMPETITIONS.CREATE_DURATION_OPTION") {
        return `${params?.minutes} minutes`;
      }
      if (key === "TEACHER_LIVE_COMPETITIONS.CREATE_SUBTITLE_WITH_GAME") {
        return `Choose a class for “${params?.name}”. Every active student in that class gets an invite.`;
      }
      if (key === "TEACHER_LIVE_COMPETITIONS.CREATE_GAME_META") {
        return `Game #${params?.id} · ${params?.type} · ${params?.count} questions`;
      }
      const map: Record<string, string> = {
        "TEACHER_LIVE_COMPETITIONS.HOME_TITLE": "Live competitions",
        "TEACHER_LIVE_COMPETITIONS.CREATE_TITLE": "Create live session",
        "TEACHER_LIVE_COMPETITIONS.CREATE_CRUMB": "Create session",
        "TEACHER_LIVE_COMPETITIONS.CREATE_SUBTITLE":
          "Choose an authorized class for this live competition.",
        "TEACHER_LIVE_COMPETITIONS.CREATE_DURATION_TITLE": "Session length",
        "TEACHER_LIVE_COMPETITIONS.CREATE_DURATION_HINT":
          "How long students have to play after you begin.",
        "TEACHER_LIVE_COMPETITIONS.CREATE_CLASSES_TITLE": "Your classes",
        "TEACHER_LIVE_COMPETITIONS.CREATE_CLASSES_HINT":
          "Pick one class for this lobby.",
        "TEACHER_LIVE_COMPETITIONS.CREATE_CLASSES_EMPTY":
          "No classes are available for your account.",
        "TEACHER_LIVE_COMPETITIONS.CREATE_STUDENTS": "students",
        "TEACHER_LIVE_COMPETITIONS.CREATE_SELECTED": "Selected",
        "TEACHER_LIVE_COMPETITIONS.CREATE_SUBMIT": "Create lobby",
        "TEACHER_LIVE_COMPETITIONS.CREATE_SUBMITTING": "Creating…",
        "TEACHER_LIVE_COMPETITIONS.CREATE_BACK": "Back",
      };
      return map[key] || key;
    },
  }),
}));

const fetchAvailableMock = fetchAvailableLiveCompetitions as jest.MockedFunction<
  typeof fetchAvailableLiveCompetitions
>;
const createSessionMock = createLiveCompetitionSession as jest.MockedFunction<
  typeof createLiveCompetitionSession
>;
const getRequestMock = getRequest as jest.MockedFunction<typeof getRequest>;

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={["/live-games/create?liveGameId=5"]}>
      <Routes>
        <Route path="/live-games/create" element={<CreateLiveSessionPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CreateLiveSessionPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    fetchAvailableMock.mockReset();
    createSessionMock.mockReset();
    getRequestMock.mockReset();
    (notify as jest.Mock).mockReset();

    fetchAvailableMock.mockResolvedValue({
      status: true,
      games: [
        {
          id: 5,
          name: "Classic Camp",
          type: "classic",
          time: "10:00",
          status: 1,
          is_published: true,
          questions_count: 6,
        },
      ],
    });
    getRequestMock.mockResolvedValue({
      status: true,
      meta: { total: 1, filter: "all", class_id: null },
      classes: [
        {
          class_id: 12,
          grade_id: 1,
          name: "Grade 5-A",
          grade_name: "Grade 5",
          class_name: "A",
          student_count: 20,
          health_status: "good",
          health_label: "Good",
          performance: { percent: 80, trend: "stable" },
          students_need_attention: 0,
          pending_assignments: 0,
          top_student: null,
          is_active: true,
        },
      ],
    });
  });

  it("loads teacher classes and creates a session with the exact payload", async () => {
    createSessionMock.mockResolvedValue({
      status: true,
      session: {
        id: 90,
        code: "ROOM01",
        status: "lobby",
        live_game_id: 5,
        class_id: 12,
        school_id: 1,
        host_user_id: 8,
      },
    });

    renderCreate();

    expect(await screen.findByText(/Classic Camp/)).toBeInTheDocument();
    expect(await screen.findByTestId("class-option-12")).toBeInTheDocument();
    expect(getRequestMock).toHaveBeenCalledWith(
      {},
      "/api/dashboard/teacher/classes"
    );

    expect(await screen.findByTestId("session-duration-select")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("class-option-12"));
    fireEvent.click(screen.getByTestId("create-session-button"));

    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalledWith({
        live_game_id: 5,
        class_id: 12,
        duration_minutes: 10,
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/live-games/sessions/90",
        expect.objectContaining({
          state: expect.objectContaining({
            gameName: "Classic Camp",
            className: "Grade 5-A",
          }),
        })
      );
    });
  });

  it("prevents duplicate create while pending", async () => {
    let resolveCreate: (value: unknown) => void = () => undefined;
    createSessionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }) as any
    );

    renderCreate();
    await screen.findByTestId("class-option-12");
    fireEvent.click(screen.getByTestId("class-option-12"));

    const button = screen.getByTestId("create-session-button");
    fireEvent.click(button);
    fireEvent.click(button);

    expect(createSessionMock).toHaveBeenCalledTimes(1);

    resolveCreate({
      status: true,
      session: {
        id: 91,
        code: "ROOM02",
        status: "lobby",
        live_game_id: 5,
        class_id: 12,
        school_id: 1,
        host_user_id: 8,
      },
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it("surfaces authorization errors from create", async () => {
    createSessionMock.mockRejectedValue(
      new Error("You are not authorized for this class.")
    );

    renderCreate();
    await screen.findByTestId("class-option-12");
    fireEvent.click(screen.getByTestId("class-option-12"));
    fireEvent.click(screen.getByTestId("create-session-button"));

    expect(
      await screen.findByText("You are not authorized for this class.")
    ).toBeInTheDocument();
  });

  it("sends the teacher-selected duration_minutes", async () => {
    createSessionMock.mockResolvedValue({
      status: true,
      session: {
        id: 92,
        code: "ROOM03",
        status: "lobby",
        live_game_id: 5,
        class_id: 12,
        school_id: 1,
        host_user_id: 8,
        duration_minutes: 20,
      },
    });

    renderCreate();
    await screen.findByTestId("class-option-12");

    fireEvent.change(screen.getByTestId("session-duration-select"), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByTestId("class-option-12"));
    fireEvent.click(screen.getByTestId("create-session-button"));

    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalledWith({
        live_game_id: 5,
        class_id: 12,
        duration_minutes: 20,
      });
    });
  });
});
