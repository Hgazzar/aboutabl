import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import i18n from "@/config/i18next";
import { getRequest, postRequest } from "@/utils/fetchMethods";
import loginReducer, { setUser } from "@/redux/reducers/loginReducer";
import subjectsReducer from "@/redux/reducers/subjectsReducer";
import permissionReducer from "@/redux/reducers/permissionReducer";
import QuizzesActivity from "./QuizzesActivity";

jest.mock("@/utils/fetchMethods", () => ({
  getRequest: jest.fn(),
  postRequest: jest.fn(),
  putRequest: jest.fn(),
  deleteRequest: jest.fn(),
}));

const getMock = getRequest as jest.Mock;
const postMock = postRequest as jest.Mock;

function storeFor(type: "admin" | "user") {
  const store = configureStore({
    reducer: {
      login: loginReducer,
      subjects: subjectsReducer,
      permissions: permissionReducer,
    },
  });
  store.dispatch(setUser({ id: 1, type }));
  return store;
}

function renderQuizzes(type: "admin" | "user") {
  return render(
    <Provider store={storeFor(type)}>
      <MemoryRouter initialEntries={["/subjects/5"]}>
        <Routes>
          <Route path="/subjects/:id" element={<QuizzesActivity />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

async function openQuizRow() {
  fireEvent.click(await screen.findByText("Quizzes"));
  fireEvent.click(await screen.findByText("First lesson"));
  await screen.findByText("First");
}

describe("quiz score to pass visibility", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    getMock.mockImplementation((_params: unknown, url: string) => {
      if (url.includes("subject_activities/list")) {
        return Promise.resolve({
          status: true,
          data: [{ id: 10, subject_id: 5, name_en: "Quizzes", name_ar: "اختبارات" }],
        });
      }
      if (url.includes("subject_activities/show")) {
        return Promise.resolve({
          status: true,
          lessons: [{ id: 3, name_en: "First lesson", name_ar: "الدرس" }],
          subject_activity: {
            id: 10,
            name_en: "Quizzes",
            name_ar: "اختبارات",
            type: "quizzes",
            subject_id: 5,
          },
        });
      }
      if (url.includes("activity_lessons/show")) {
        return Promise.resolve({
          status: true,
          quizzes: [
            {
              id: 77,
              title_en: "First",
              title_ar: "أول",
              score_to_pass: 0,
              code: "",
              status: 1,
              status_raw: 1,
            },
          ],
        });
      }
      return Promise.resolve({ status: true, data: [] });
    });
    postMock.mockResolvedValue({
      status: true,
      quiz: { id: 77, score_to_pass: 4, code: null },
    });
  });

  it("shows Score To Pass for an admin and saves the existing field", async () => {
    renderQuizzes("admin");
    await openQuizRow();

    expect(screen.getByText("Score To Pass")).toBeInTheDocument();
    const input = screen.getByTestId("quiz-score-to-pass") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.blur(input);

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        { score_to_pass: "4" },
        "/api/quizes/list_fields/77"
      )
    );
  });

  it("hides Score To Pass from a teacher", async () => {
    renderQuizzes("user");
    await openQuizRow();

    expect(screen.queryByText("Score To Pass")).not.toBeInTheDocument();
    expect(screen.queryByTestId("quiz-score-to-pass")).not.toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });
});
