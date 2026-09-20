import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssignmentDetailsScreen } from "./AssignmentDetailsScreen";
import { updateAssignmentTitle } from "@/api/classAssignmentsApi";
import { notify } from "@/utils/notify";
import type {
  AssignmentDetailsAssignment,
  AssignmentDetailsStatistics,
  AssignmentDetailsStudentRow,
} from "@/types/classAssignments";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
    sendMissingAssignmentReminders: jest.fn(),
    updateAssignmentTitle: jest.fn(),
  };
});

jest.mock("@/api/teacherEvaluationsApi", () => ({
  teacherEvaluationsApi: {
    create: jest.fn(),
  },
}));

const updateTitle = updateAssignmentTitle as jest.MockedFunction<
  typeof updateAssignmentTitle
>;

const assignment: AssignmentDetailsAssignment = {
  id: 42,
  title: "Original Title",
  subject: { id: 1, name: "English" },
  module: "learning_activities",
  module_type: "learning_activities",
  assignment_type: "assignment",
  due_date: null,
  due_at: null,
  created_at: null,
  status: "active",
  created_by: 1,
  subtitle: "Assignment #42",
  standards_count: 0,
};

const statistics: AssignmentDetailsStatistics = {
  target_students: 1,
  completed_students: 0,
  pending_students: 1,
  overdue_students: 0,
  completion_percentage: 0,
  has_missing_students: true,
  has_overdue_students: false,
};

const activeStudent: AssignmentDetailsStudentRow = {
  student_id: 7,
  name: "Sara",
  status: "missing",
  submission_status: "active",
  opened_at: null,
  score_percent: null,
};

describe("AssignmentDetailsScreen Edit Title V1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens edit modal with existing title and saves via API", async () => {
    updateTitle.mockResolvedValue({
      status: true,
      data: { assign_id: 42, title: "New Title" },
    });
    const onTitleUpdated = jest.fn();

    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[activeStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
        onTitleUpdated={onTitleUpdated}
      />
    );

    fireEvent.click(screen.getByTestId("assignment-details-edit"));
    expect(screen.getByTestId("edit-assignment-title-modal")).toBeInTheDocument();
    const input = screen.getByTestId(
      "edit-assignment-title-input"
    ) as HTMLInputElement;
    expect(input.value).toBe("Original Title");

    fireEvent.change(input, { target: { value: "New Title" } });
    fireEvent.click(screen.getByTestId("edit-assignment-title-save"));

    await waitFor(() => {
      expect(updateTitle).toHaveBeenCalledWith(42, "New Title");
    });
    await waitFor(() => {
      expect(onTitleUpdated).toHaveBeenCalledWith("New Title");
    });
    expect(notify).toHaveBeenCalled();
  });

  it("cancel closes modal without calling API", () => {
    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[activeStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("assignment-details-edit"));
    fireEvent.click(screen.getByTestId("edit-assignment-title-cancel"));
    expect(updateTitle).not.toHaveBeenCalled();
  });

  it("disables edit when a student has submitted", () => {
    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[
          {
            ...activeStudent,
            status: "submitted",
            submission_status: "submitted",
          },
        ]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    expect(screen.getByTestId("assignment-details-edit")).toBeDisabled();
  });

  it("keeps typed value and shows API validation error", async () => {
    updateTitle.mockRejectedValue(new Error("The title field is required."));

    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[activeStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("assignment-details-edit"));
    const input = screen.getByTestId(
      "edit-assignment-title-input"
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Keep Me" } });
    fireEvent.click(screen.getByTestId("edit-assignment-title-save"));

    await waitFor(() => {
      expect(screen.getByText("The title field is required.")).toBeInTheDocument();
    });
    expect(input.value).toBe("Keep Me");
  });

  it("shows lifecycle conflict and locks edit", async () => {
    updateTitle.mockRejectedValue(
      new Error(
        "Assignment can no longer be edited because a student has submitted it."
      )
    );

    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[activeStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("assignment-details-edit"));
    const input = screen.getByTestId(
      "edit-assignment-title-input"
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Blocked Title" } });
    fireEvent.click(screen.getByTestId("edit-assignment-title-save"));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(
        "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT_LOCKED",
        "info"
      );
    });
    expect(
      screen.queryByTestId("edit-assignment-title-modal")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("assignment-details-edit")).toBeDisabled();
  });

  it("does not open Create Assignment wizard", () => {
    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[activeStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("assignment-details-edit"));
    expect(screen.queryByText(/Create Assignment/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("edit-assignment-title-modal")).toBeInTheDocument();
  });
});
