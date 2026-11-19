import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { MemoryRouter } from "react-router-dom";
import i18n from "@/config/i18next";
import { ApiResponseError } from "@/utils/fetchMethods";
import QuizWorkbookImportPage from "./QuizWorkbookImportPage";
import { commitQuizWorkbook, previewQuizWorkbook } from "./quizWorkbookImportApi";
import {
  QUIZ_WORKBOOK_TEMPLATE_PATH,
  WORKBOOK_HEADERS,
  canCommit,
  decisionsPayload,
  showQuizWorkbookNav,
  workbookFormData,
} from "./quizWorkbookImport";

jest.mock("react-redux", () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ login: { user: (global as { quizWorkbookUser?: unknown }).quizWorkbookUser } }),
}));

jest.mock("./quizWorkbookImportApi", () => ({
  previewQuizWorkbook: jest.fn(),
  commitQuizWorkbook: jest.fn(),
}));

const previewMock = previewQuizWorkbook as jest.Mock;
const commitMock = commitQuizWorkbook as jest.Mock;

const validDuplicate = {
  msg: "Preview ready.",
  preview: {
    valid: true,
    file_errors: [],
    rows: [
      {
        row: 4,
        status: "duplicate",
        errors: [],
        duplicate_of: 9,
        duplicate_of_row: null,
        fields: {
          subject_id: 1,
          unit_id: 2,
          lesson_id: 3,
          type: "MCQ",
          import_title: "عنوان",
          question: "سؤال",
          corAnswer: "1",
          answer1: "أ",
          answer2: "ب",
          answer3: null,
          answer4: null,
          code: "S1",
          primary_head_text: "رأس",
          primary_content_text: "محتوى",
          secondary_head_text: "",
          media: { answer1_image: { reference: "cat.png", file_management_id: 7, resolved_url: "http://x/cat.png" } },
        },
      },
    ],
  },
};

function renderPage(state?: { file?: File }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/quiz-workbook-import", state }]}>
      <QuizWorkbookImportPage />
    </MemoryRouter>
  );
}

function chooseFile(name = "quiz.xlsx") {
  const input = screen.getByTestId("quiz-workbook-file") as HTMLInputElement;
  const file = new File(["xlsx"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

describe("quiz workbook import", () => {
  beforeEach(async () => {
    (global as { quizWorkbookUser?: unknown }).quizWorkbookUser = { id: 1, type: "admin" };
    previewMock.mockReset();
    commitMock.mockReset();
    await i18n.changeLanguage("en");
  });

  it("keeps the 26 client headers, including the trailing space in Title", () => {
    expect(WORKBOOK_HEADERS).toHaveLength(26);
    expect(WORKBOOK_HEADERS[4]).toBe("Title ");
  });

  it("does not send a file until preview is clicked, and does not commit until save", async () => {
    previewMock.mockResolvedValue(validDuplicate);
    renderPage();
    chooseFile();
    expect(previewMock).not.toHaveBeenCalled();
    expect(commitMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("quiz-workbook-commit")).toBeDisabled();

    fireEvent.click(screen.getByTestId("quiz-workbook-preview"));
    await screen.findByText("Duplicate");
    expect(
      screen.getAllByRole("columnheader").some((cell) => cell.textContent === "Title ")
    ).toBe(true);
    expect(previewMock).toHaveBeenCalledTimes(1);
    expect(commitMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("quiz-workbook-commit")).toBeDisabled();
  });

  it("shows row errors for an invalid preview and keeps save disabled", async () => {
    previewMock.mockResolvedValue({
      msg: "Preview ready.",
      preview: {
        valid: false,
        file_errors: ["No question rows were found."],
        rows: [
          { row: 6, status: "error", errors: ["Subject was not found."], fields: { subject_id: null } },
        ],
      },
    });
    renderPage();
    chooseFile();
    fireEvent.click(screen.getByTestId("quiz-workbook-preview"));
    expect(await screen.findByText("Subject was not found.")).toBeInTheDocument();
    expect(screen.getByText("No question rows were found.")).toBeInTheDocument();
    expect(screen.getByTestId("quiz-workbook-commit")).toBeDisabled();
    expect(commitMock).not.toHaveBeenCalled();
  });

  it("requires skip or create_new, then sends that decision only after save", async () => {
    previewMock.mockResolvedValue(validDuplicate);
    commitMock.mockResolvedValue({
      msg: "Import saved.",
      import_result: { written: true, created: [{ row: 4, question_id: 88 }], skipped: [], rows: [], file_errors: [] },
    });
    renderPage();
    const file = chooseFile();
    fireEvent.click(screen.getByTestId("quiz-workbook-preview"));
    await screen.findByText("Duplicate");

    const openDecision = () => {
      const select = screen.getByTestId("decision-4").querySelector("[role='button']");
      fireEvent.mouseDown(select as Element);
    };
    openDecision();
    fireEvent.click(await screen.findByRole("option", { name: "Skip" }));
    expect(screen.getByTestId("quiz-workbook-commit")).toBeEnabled();

    openDecision();
    fireEvent.click(await screen.findByRole("option", { name: "Create new" }));
    fireEvent.click(screen.getByTestId("quiz-workbook-commit"));

    await screen.findByTestId("quiz-workbook-result");
    expect(commitMock).toHaveBeenCalledTimes(1);
    expect(commitMock).toHaveBeenCalledWith(file, [{ row: 4, decision: "create_new" }]);
    expect(screen.getByText(/#88/)).toBeInTheDocument();
  });

  it("clears a decision when the file changes or preview runs again", async () => {
    previewMock.mockResolvedValue(validDuplicate);
    renderPage();
    chooseFile("first.xlsx");
    fireEvent.click(screen.getByTestId("quiz-workbook-preview"));
    await screen.findByText("Duplicate");
    const select = screen.getByTestId("decision-4").querySelector("[role='button']");
    fireEvent.mouseDown(select as Element);
    fireEvent.click(await screen.findByRole("option", { name: "Skip" }));
    expect(screen.getByTestId("quiz-workbook-commit")).toBeEnabled();

    chooseFile("second.xlsx");
    expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
    expect(screen.getByTestId("quiz-workbook-commit")).toBeDisabled();

    fireEvent.click(screen.getByTestId("quiz-workbook-preview"));
    await screen.findByText("Duplicate");
    expect(screen.getByTestId("quiz-workbook-commit")).toBeDisabled();
  });

  it("shows the 422 import_result without treating it as a successful save", async () => {
    previewMock.mockResolvedValue({
      msg: "Preview ready.",
      preview: {
        valid: true,
        file_errors: [],
        rows: [{ row: 3, status: "ok", errors: [], fields: { type: "MCQ", corAnswer: "1" } }],
      },
    });
    commitMock.mockRejectedValue(
      new ApiResponseError("Nothing was saved.", 422, {
        status: false,
        msg: "Nothing was saved.",
        import_result: { written: false, created: [], skipped: [], rows: [], file_errors: ["Import failed and was rolled back. Nothing was saved."] },
      })
    );
    renderPage();
    chooseFile();
    fireEvent.click(screen.getByTestId("quiz-workbook-preview"));
    await waitFor(() => expect(screen.getByTestId("quiz-workbook-commit")).toBeEnabled());
    fireEvent.click(screen.getByTestId("quiz-workbook-commit"));
    expect(await screen.findByText("Nothing was saved.")).toBeInTheDocument();
    expect(screen.getByText(/false/)).toBeInTheDocument();
  });

  it("renders Arabic copy in RTL", async () => {
    await i18n.changeLanguage("ar");
    renderPage();
    expect(screen.getByText("استيراد دفتر الاختبار")).toBeInTheDocument();
    expect(screen.getByText("استيراد دفتر الاختبار").closest("[dir='rtl']")).toBeTruthy();
  });

  it("hides the importer from a non-admin user", () => {
    (global as { quizWorkbookUser?: unknown }).quizWorkbookUser = { id: 2, type: "teacher" };
    renderPage();
    expect(screen.queryByTestId("quiz-workbook-file")).not.toBeInTheDocument();
    expect(screen.getByText("This import is available to admin users only.")).toBeInTheDocument();
  });

  it("builds the commit body from the same file and decisions contract", () => {
    const file = new File(["xlsx"], "quiz.xlsx");
    const body = workbookFormData(file, [{ row: 4, decision: "skip" }]);
    expect(body.get("file")).toBe(file);
    expect(body.get("decisions")).toBe(JSON.stringify([{ row: 4, decision: "skip" }]));
    expect(canCommit(validDuplicate.preview, { 4: "" })).toBe(false);
    expect(canCommit(validDuplicate.preview, { 4: "skip" })).toBe(true);
    expect(decisionsPayload(validDuplicate.preview.rows, { 4: "skip" })).toEqual([
      { row: 4, decision: "skip" },
    ]);
  });

  it("leaves the old question bank upload on its existing endpoint", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "QuestionBank.tsx"),
      "utf8"
    );
    const reducer = fs.readFileSync(
      path.join(__dirname, "../../redux/reducers/questionBankReducer.tsx"),
      "utf8"
    );
    expect(source).not.toContain("quiz_workbook");
    expect(reducer).toContain("/api/questions/fileImport");
    expect(reducer).not.toContain("quiz_workbook");
  });

  it("shows the workbook link for an admin with add-questions and without view-questions", () => {
    expect(showQuizWorkbookNav({ type: "admin" }, true)).toBe(true);
    expect(showQuizWorkbookNav({ type: "admin" }, false)).toBe(false);
    expect(showQuizWorkbookNav({ type: "teacher" }, true)).toBe(false);
  });

  it("keeps activity quiz upload on the activity lesson importer", () => {
    const screenSource = fs.readFileSync(
      path.join(__dirname, "../../components/subjectDetails/QuizzesActivity.tsx"),
      "utf8"
    );
    const reducer = fs.readFileSync(
      path.join(__dirname, "../../redux/reducers/subjectsReducer.tsx"),
      "utf8"
    );
    expect(screenSource).toContain("uploadDataActivity");
    expect(screenSource).toContain('"/Activities Questions Template.xlsx"');
    expect(screenSource).toContain('"/activities-quizzes-demo.xlsx"');
    expect(screenSource).toContain("/subjects/${param.id}/add-quiz");
    expect(screenSource).not.toContain("quiz-workbook-import");
    expect(screenSource).not.toContain("QUIZ_WORKBOOK_TEMPLATE_PATH");
    expect(reducer).toContain('"/api/activity_lessons/fileImport"');
  });

  it("downloads the official workbook template from the workbook page only", () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    renderPage();
    fireEvent.click(screen.getByTestId("quiz-workbook-template"));
    expect(open).toHaveBeenCalledWith(expect.stringContaining(QUIZ_WORKBOOK_TEMPLATE_PATH), "_blank");
    expect(previewMock).not.toHaveBeenCalled();
    expect(commitMock).not.toHaveBeenCalled();
    open.mockRestore();
  });
});
