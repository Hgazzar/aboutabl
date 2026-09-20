import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssignmentDetailsScreen } from "./AssignmentDetailsScreen";
import { reassignAssignment } from "@/api/classAssignmentsApi";
import { notify } from "@/utils/notify";
import type {
  AssignmentDetailsAssignment,
  AssignmentDetailsStatistics,
  AssignmentDetailsStudentRow,
} from "@/types/classAssignments";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count != null ? `${key}:${opts.count}` : key,
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
    extendAssignmentDueAt: jest.fn(),
    reassignAssignment: jest.fn(),
  };
});

jest.mock("@/api/teacherEvaluationsApi", () => ({
  teacherEvaluationsApi: {
    create: jest.fn(),
  },
}));

const reassign = reassignAssignment as jest.MockedFunction<
  typeof reassignAssignment
>;

const assignment: AssignmentDetailsAssignment = {
  id: 42,
  title: "Reassign Demo",
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
  target_students: 2,
  completed_students: 1,
  pending_students: 1,
  overdue_students: 0,
  completion_percentage: 50,
  has_missing_students: true,
  has_overdue_students: false,
};

const missingStudent: AssignmentDetailsStudentRow = {
  student_id: 7,
  name: "Sara",
  status: "missing",
  submission_status: "active",
  opened_at: null,
  score_percent: null,
};

const submittedStudent: AssignmentDetailsStudentRow = {
  student_id: 8,
  name: "Omar",
  status: "submitted",
  submission_status: "submitted",
  opened_at: "2026-09-20T10:00:00Z",
  score_percent: null,
};

const gradedStudent: AssignmentDetailsStudentRow = {
  student_id: 9,
  name: "Lina",
  status: "graded",
  submission_status: "graded",
  opened_at: "2026-09-19T10:00:00Z",
  score_percent: 90,
};

describe("AssignmentDetailsScreen Reassign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens reassign modal for missing student and calls API", async () => {
    reassign.mockResolvedValue({
      status: true,
      data: { assign_id: 42, reassigned_student_ids: [7], notified: 1 },
    });
    const onReassigned = jest.fn();

    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[missingStudent, submittedStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
        onReassigned={onReassigned}
      />
    );

    fireEvent.click(screen.getByTestId("assignment-details-reassign-7"));
    expect(screen.getByTestId("reassign-assignment-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("reassign-assignment-confirm"));

    await waitFor(() => {
      expect(reassign).toHaveBeenCalledWith(42, [7]);
    });
    await waitFor(() => {
      expect(onReassigned).toHaveBeenCalledWith([7]);
    });
    expect(notify).toHaveBeenCalled();
  });

  it("shows reassign for submitted and review together", () => {
    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[submittedStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    expect(screen.getByTestId("assignment-details-reassign-8")).toBeInTheDocument();
    expect(screen.getByTestId("assignment-details-review-8")).toBeInTheDocument();
  });

  it("hides reassign for graded students", () => {
    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[gradedStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    expect(
      screen.queryByTestId("assignment-details-reassign-9")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("assignment-details-review-9")).toBeInTheDocument();
  });

  it("cancel does not call API", () => {
    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[missingStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("assignment-details-reassign-7"));
    fireEvent.click(screen.getByTestId("reassign-assignment-cancel"));
    expect(reassign).not.toHaveBeenCalled();
  });

  it("shows API validation error in modal", async () => {
    reassign.mockRejectedValue(new Error("Cannot reassign a graded student."));

    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[missingStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("assignment-details-reassign-7"));
    fireEvent.click(screen.getByTestId("reassign-assignment-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("reassign-assignment-error")).toHaveTextContent(
        "Cannot reassign a graded student."
      );
    });
    expect(screen.getByTestId("reassign-assignment-modal")).toBeInTheDocument();
  });
});
