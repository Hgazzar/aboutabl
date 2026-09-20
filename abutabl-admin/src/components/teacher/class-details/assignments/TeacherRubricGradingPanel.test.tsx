import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TeacherRubricGradingPanel } from "./TeacherRubricGradingPanel";
import {
  fetchAssignmentRubric,
  fetchAssignmentStudentGrade,
  upsertAssignmentRubric,
  upsertAssignmentStudentGrade,
} from "@/api/classAssignmentsApi";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { language: "en", dir: () => "ltr" },
  }),
}));

jest.mock("@/utils/notify", () => ({
  notify: jest.fn(),
}));

jest.mock("@/api/classAssignmentsApi", () => {
  const actual = jest.requireActual("@/api/classAssignmentsApi");
  return {
    ...actual,
    fetchAssignmentRubric: jest.fn(),
    fetchAssignmentStudentGrade: jest.fn(),
    upsertAssignmentRubric: jest.fn(),
    upsertAssignmentStudentGrade: jest.fn(),
  };
});

const fetchRubric = fetchAssignmentRubric as jest.MockedFunction<
  typeof fetchAssignmentRubric
>;
const fetchGrade = fetchAssignmentStudentGrade as jest.MockedFunction<
  typeof fetchAssignmentStudentGrade
>;
const upsertRubric = upsertAssignmentRubric as jest.MockedFunction<
  typeof upsertAssignmentRubric
>;
const upsertGrade = upsertAssignmentStudentGrade as jest.MockedFunction<
  typeof upsertAssignmentStudentGrade
>;

describe("TeacherRubricGradingPanel", () => {
  beforeEach(() => {
    fetchRubric.mockReset();
    fetchGrade.mockReset();
    upsertRubric.mockReset();
    upsertGrade.mockReset();
  });

  it("loads rubric and saves rubric criteria", async () => {
    fetchRubric.mockResolvedValue({
      assign_id: 12,
      possible_xp: null,
      rubric: null,
      rubric_locked: false,
    });
    fetchGrade.mockResolvedValue(null);
    upsertRubric.mockResolvedValue({
      status: true,
      data: {
        assign_id: 12,
        possible_xp: null,
        rubric: {
          id: 1,
          title: "Demo Rubric",
          criteria: [
            {
              id: 9,
              label: "Clarity",
              weight: 100,
              max_points: 4,
              sort_order: 0,
            },
          ],
        },
        rubric_locked: false,
      },
    });

    render(
      <TeacherRubricGradingPanel
        assignId={12}
        studentId={5}
        parentSubmissionStatus="active"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("teacher-rubric-panel")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId("teacher-rubric-criterion-label-0"), {
        target: { value: "Clarity" },
      });
      fireEvent.change(screen.getByTestId("teacher-rubric-criterion-weight-0"), {
        target: { value: "100" },
      });
      fireEvent.click(screen.getByTestId("teacher-rubric-save"));
    });

    await waitFor(() => {
      expect(upsertRubric).toHaveBeenCalledWith(12, {
        title: "Assignment Rubric",
        criteria: [{ label: "Clarity", weight: 100 }],
      });
    });
  });

  it("loads grade draft and saves criterion scores when submitted", async () => {
    fetchRubric.mockResolvedValue({
      assign_id: 12,
      possible_xp: null,
      rubric: {
        id: 1,
        title: "Demo",
        criteria: [
          {
            id: 9,
            label: "Clarity",
            weight: 100,
            max_points: 4,
            sort_order: 0,
          },
        ],
      },
      rubric_locked: true,
    });
    fetchGrade.mockResolvedValue(null);
    upsertGrade.mockResolvedValue({
      status: true,
      data: {
        id: 3,
        assign_id: 12,
        assign_student_id: 8,
        status: "draft",
        final_percent: 100,
        possible_xp: null,
        earned_xp: null,
        badge: { key: "excellent", label: "Excellent" },
        teacher_feedback: null,
        graded_by: null,
        finalized_at: null,
        criteria: [{ criterion_id: 9, points: 4 }],
      },
    });

    const onReady = jest.fn();
    render(
      <TeacherRubricGradingPanel
        assignId={12}
        studentId={5}
        parentSubmissionStatus="submitted"
        onReadinessChange={onReady}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("teacher-grade-draft-panel")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("teacher-grade-points-9-4"));

    await waitFor(() => {
      expect(screen.getByTestId("teacher-grade-save")).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("teacher-grade-save"));
    });

    await waitFor(() => {
      expect(upsertGrade).toHaveBeenCalledWith(12, 5, {
        criteria: [{ criterion_id: 9, points: 4 }],
        teacher_feedback: null,
      });
    });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith(
        expect.objectContaining({ ready: true, reason: null })
      );
    });
  });

  it("renders load error state", async () => {
    fetchRubric.mockRejectedValue(new Error("forbidden"));
    fetchGrade.mockResolvedValue(null);

    render(
      <TeacherRubricGradingPanel
        assignId={12}
        studentId={5}
        parentSubmissionStatus="submitted"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("teacher-rubric-error")).toHaveTextContent(
        "forbidden"
      );
    });
  });
});
