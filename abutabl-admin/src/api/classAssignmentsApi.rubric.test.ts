import {
  fetchAssignmentRubric,
  fetchAssignmentStudentGrade,
  upsertAssignmentRubric,
  upsertAssignmentStudentGrade,
} from "@/api/classAssignmentsApi";
import { getRequest, putRequest } from "@/utils/fetchMethods";

jest.mock("@/utils/fetchMethods", () => ({
  getRequest: jest.fn(),
  putRequest: jest.fn(),
  postRequest: jest.fn(),
}));

const getRequestMock = getRequest as jest.MockedFunction<typeof getRequest>;
const putRequestMock = putRequest as jest.MockedFunction<typeof putRequest>;

describe("classAssignmentsApi rubric/grade helpers", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    putRequestMock.mockReset();
  });

  it("fetchAssignmentRubric returns data payload", async () => {
    getRequestMock.mockResolvedValue({
      status: true,
      data: {
        assign_id: 12,
        possible_xp: 50,
        rubric: {
          id: 1,
          title: "R",
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

    const result = await fetchAssignmentRubric(12);
    expect(getRequestMock).toHaveBeenCalledWith({}, "/api/assigns/12/rubric");
    expect(result?.rubric?.title).toBe("R");
  });

  it("upsertAssignmentRubric PUTs criteria body", async () => {
    putRequestMock.mockResolvedValue({
      status: true,
      data: {
        assign_id: 12,
        possible_xp: null,
        rubric: { id: 1, title: "R", criteria: [] },
        rubric_locked: false,
      },
    });

    await upsertAssignmentRubric(12, {
      title: "R",
      criteria: [{ label: "Clarity", weight: 100 }],
    });

    expect(putRequestMock).toHaveBeenCalledWith(
      { title: "R", criteria: [{ label: "Clarity", weight: 100 }] },
      "/api/assigns/12/rubric"
    );
  });

  it("fetchAssignmentStudentGrade unwraps nested grade", async () => {
    getRequestMock.mockResolvedValue({
      status: true,
      data: {
        assign_id: 12,
        student_id: 5,
        grade: {
          id: 3,
          assign_id: 12,
          assign_student_id: 8,
          status: "draft",
          final_percent: 80,
          possible_xp: null,
          earned_xp: null,
          badge: null,
          teacher_feedback: null,
          graded_by: null,
          finalized_at: null,
          criteria: [{ criterion_id: 9, points: 4 }],
        },
      },
    });

    const grade = await fetchAssignmentStudentGrade(12, 5);
    expect(getRequestMock).toHaveBeenCalledWith(
      {},
      "/api/assigns/12/students/5/grade"
    );
    expect(grade?.status).toBe("draft");
    expect(grade?.criteria[0].points).toBe(4);
  });

  it("upsertAssignmentStudentGrade PUTs draft body", async () => {
    putRequestMock.mockResolvedValue({
      status: true,
      data: {
        id: 3,
        assign_id: 12,
        assign_student_id: 8,
        status: "draft",
        final_percent: 100,
        possible_xp: null,
        earned_xp: null,
        badge: null,
        teacher_feedback: "ok",
        graded_by: null,
        finalized_at: null,
        criteria: [{ criterion_id: 9, points: 4 }],
      },
    });

    await upsertAssignmentStudentGrade(12, 5, {
      criteria: [{ criterion_id: 9, points: 4 }],
      teacher_feedback: "ok",
    });

    expect(putRequestMock).toHaveBeenCalledWith(
      {
        criteria: [{ criterion_id: 9, points: 4 }],
        teacher_feedback: "ok",
      },
      "/api/assigns/12/students/5/grade"
    );
  });
});
