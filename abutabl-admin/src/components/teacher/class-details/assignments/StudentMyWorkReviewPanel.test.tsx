import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { StudentMyWorkReviewPanel } from "./StudentMyWorkReviewPanel";
import type { LearningActivitiesReviewMyWorkItem } from "@/api/classAssignmentsApi";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", dir: () => "ltr" },
  }),
}));

const items: LearningActivitiesReviewMyWorkItem[] = [
  {
    id: 1,
    assign_id: 10,
    assign_student_id: 5,
    student_id: 20,
    kind: "image",
    original_filename: "drawing.png",
    url: "https://cdn.example/drawing.png",
    mime_type: "image/png",
    size_bytes: 12345,
    duration_ms: null,
    sort_order: 0,
  },
  {
    id: 2,
    assign_id: 10,
    assign_student_id: 5,
    student_id: 20,
    kind: "document",
    original_filename: "notes.pdf",
    url: "https://cdn.example/notes.pdf",
    mime_type: "application/pdf",
    size_bytes: 2048,
    duration_ms: null,
    sort_order: 1,
  },
  {
    id: 3,
    assign_id: 10,
    assign_student_id: 5,
    student_id: 20,
    kind: "voice",
    original_filename: "answer.webm",
    url: "https://cdn.example/answer.webm",
    mime_type: "audio/webm",
    size_bytes: 4096,
    duration_ms: 1500,
    sort_order: 2,
  },
];

describe("StudentMyWorkReviewPanel", () => {
  it("renders empty state", () => {
    render(<StudentMyWorkReviewPanel items={[]} />);
    expect(
      screen.getByText("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_EMPTY")
    ).toBeInTheDocument();
  });

  it("renders multiple image document and voice items with filenames", () => {
    render(<StudentMyWorkReviewPanel items={items} />);
    expect(screen.getByText("drawing.png")).toBeInTheDocument();
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
    expect(screen.getByText("answer.webm")).toBeInTheDocument();
    expect(document.querySelector("audio")).not.toBeNull();
  });

  it("toggles image preview", () => {
    render(<StudentMyWorkReviewPanel items={[items[0]]} />);
    fireEvent.click(
      screen.getByText("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_VIEW")
    );
    expect(screen.getByRole("img", { name: "drawing.png" })).toBeInTheDocument();
  });
});
