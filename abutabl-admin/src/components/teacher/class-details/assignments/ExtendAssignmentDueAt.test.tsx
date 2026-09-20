import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssignmentDetailsScreen } from "./AssignmentDetailsScreen";
import { extendAssignmentDueAt } from "@/api/classAssignmentsApi";
import { notify } from "@/utils/notify";
import type {
  AssignmentDetailsAssignment,
  AssignmentDetailsStatistics,
  AssignmentDetailsStudentRow,
} from "@/types/classAssignments";
import {
  datetimeLocalToIso,
  minExtendDueAt,
} from "./ExtendAssignmentDueAtModal";

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
    extendAssignmentDueAt: jest.fn(),
  };
});

jest.mock("@/api/teacherEvaluationsApi", () => ({
  teacherEvaluationsApi: {
    create: jest.fn(),
  },
}));

const extendDue = extendAssignmentDueAt as jest.MockedFunction<
  typeof extendAssignmentDueAt
>;

const futureDue = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

const assignment: AssignmentDetailsAssignment = {
  id: 42,
  title: "Lifecycle Demo",
  subject: { id: 1, name: "English" },
  module: "learning_activities",
  module_type: "learning_activities",
  assignment_type: "assignment",
  due_date: futureDue,
  due_at: futureDue,
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

describe("datetime helpers", () => {
  it("converts datetime-local to ISO-8601", () => {
    const iso = datetimeLocalToIso("2030-01-15T14:30");
    expect(iso).toMatch(/2030-01-15T/);
    expect(() => new Date(iso).toISOString()).not.toThrow();
  });

  it("min extend is after now", () => {
    const current = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const min = minExtendDueAt(current.toISOString());
    expect(min.getTime()).toBeGreaterThan(Date.now());
    expect(min.getTime()).toBeLessThan(current.getTime());
  });
});

describe("AssignmentDetailsScreen Extend Deadline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens extend modal beside Edit and saves via API", async () => {
    const nextIso = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    extendDue.mockResolvedValue({
      status: true,
      data: { assign_id: 42, due_at: nextIso },
    });
    const onDueAtUpdated = jest.fn();

    render(
      <AssignmentDetailsScreen
        classId={1}
        assignment={assignment}
        statistics={statistics}
        students={[activeStudent]}
        classLabel="Class A"
        onBack={jest.fn()}
        onReview={jest.fn()}
        onDueAtUpdated={onDueAtUpdated}
      />
    );

    expect(screen.getByTestId("assignment-details-edit")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("assignment-details-extend"));
    expect(
      screen.getByTestId("extend-assignment-due-at-modal")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("extend-assignment-due-at-input")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("extend-assignment-due-at-save"));

    await waitFor(() => {
      expect(extendDue).toHaveBeenCalled();
    });
    expect(extendDue.mock.calls[0][0]).toBe(42);
    expect(typeof extendDue.mock.calls[0][1]).toBe("string");
    await waitFor(() => {
      expect(onDueAtUpdated).toHaveBeenCalledWith(nextIso);
    });
    expect(notify).toHaveBeenCalled();
  });

  it("cancel closes without calling API", () => {
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

    fireEvent.click(screen.getByTestId("assignment-details-extend"));
    fireEvent.click(screen.getByTestId("extend-assignment-due-at-cancel"));
    expect(extendDue).not.toHaveBeenCalled();
  });

  it("shows API validation error and keeps modal open", async () => {
    extendDue.mockRejectedValue(
      new Error("The new due date must be later than the current deadline.")
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

    fireEvent.click(screen.getByTestId("assignment-details-extend"));
    fireEvent.click(screen.getByTestId("extend-assignment-due-at-save"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "The new due date must be later than the current deadline."
        )
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("extend-assignment-due-at-modal")
    ).toBeInTheDocument();
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

    fireEvent.click(screen.getByTestId("assignment-details-extend"));
    expect(screen.queryByText(/Create Assignment/i)).not.toBeInTheDocument();
    expect(
      screen.getByTestId("extend-assignment-due-at-modal")
    ).toBeInTheDocument();
  });
});
