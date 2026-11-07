import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GamesList from "./GamesList";
import { getRequest } from "@/utils/fetchMethods";
import { useLoginUser } from "@/hooks/useLoginUser";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("@/hooks/useLoginUser", () => ({
  useLoginUser: jest.fn(),
}));

jest.mock("@/utils/fetchMethods", () => ({
  getRequest: jest.fn(),
  postRequest: jest.fn(),
  downloadAuthenticatedFile: jest.fn(),
}));

jest.mock("./GameCatalogImport", () => ({
  __esModule: true,
  default: () => <div>Catalog import</div>,
}));

const getRequestMock = getRequest as jest.MockedFunction<typeof getRequest>;
const useLoginUserMock = useLoginUser as jest.MockedFunction<typeof useLoginUser>;

function renderList(initialPath = "/games") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/games" element={<GamesList />} />
        <Route path="/live-games" element={<div>Teacher live games</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("GamesList Live Competitions catalog only", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    getRequestMock.mockReset();
  });

  it("redirects teachers to /live-games without calling interactive-games", async () => {
    useLoginUserMock.mockReturnValue({ id: 8, type: "teacher" });

    renderList();

    expect(await screen.findByText("Teacher live games")).toBeInTheDocument();
    expect(getRequestMock).not.toHaveBeenCalled();
  });

  it("admins load the Live Competitions catalog only", async () => {
    useLoginUserMock.mockReturnValue({ id: 1, type: "admin" });
    getRequestMock.mockResolvedValue({
      status: true,
      games: [
        {
          id: 7,
          name: "Catalog gold",
          type: "gold_quest",
          is_published: true,
          questions_count: 3,
          entitled_school_count: 0,
        },
      ],
    } as any);

    renderList();

    expect(await screen.findByText("Catalog gold")).toBeInTheDocument();
    expect(getRequestMock).toHaveBeenCalledWith({}, "/api/live-competitions");
    expect(getRequestMock).not.toHaveBeenCalledWith({}, "/api/interactive-games");
    expect(screen.getByText("Catalog import")).toBeInTheDocument();
    expect(screen.queryByTestId("legacy-interactive-games-link")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Catalog gold"));
    expect(mockNavigate).toHaveBeenCalledWith("/games/7");

    await waitFor(() => {
      expect(screen.getByTestId("live-games-catalog")).toBeInTheDocument();
    });
  });
});
