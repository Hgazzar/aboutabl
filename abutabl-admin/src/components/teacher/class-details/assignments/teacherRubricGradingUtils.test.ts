import {
  buildGradeUpsertBody,
  buildRubricUpsertBody,
  canReturnWithRubricDraft,
  isGradeDraftComplete,
  rubricToDraftRows,
  scoresFromGrade,
  weightsSumTo100,
} from "./teacherRubricGradingUtils";
import type {
  AssignmentGradePayload,
  AssignmentRubricCriterion,
} from "@/api/classAssignmentsApi";

const criteria: AssignmentRubricCriterion[] = [
  {
    id: 10,
    label: "Clarity",
    weight: 50,
    max_points: 4,
    sort_order: 0,
  },
  {
    id: 11,
    label: "Effort",
    weight: 50,
    max_points: 4,
    sort_order: 1,
  },
];

describe("teacherRubricGradingUtils", () => {
  it("builds rubric upsert body when weights sum to 100", () => {
    const body = buildRubricUpsertBody("Demo", [
      { key: "a", label: "Clarity", weight: "50" },
      { key: "b", label: "Effort", weight: "50" },
    ]);
    expect(body).toEqual({
      title: "Demo",
      criteria: [
        { label: "Clarity", weight: 50 },
        { label: "Effort", weight: 50 },
      ],
    });
  });

  it("rejects rubric body when weights do not sum to 100", () => {
    expect(
      buildRubricUpsertBody("Demo", [
        { key: "a", label: "Clarity", weight: "40" },
        { key: "b", label: "Effort", weight: "50" },
      ])
    ).toBeNull();
    expect(
      weightsSumTo100([
        { key: "a", label: "Clarity", weight: "40" },
        { key: "b", label: "Effort", weight: "50" },
      ]).ok
    ).toBe(false);
  });

  it("maps saved grade scores onto criteria", () => {
    const grade: AssignmentGradePayload = {
      id: 1,
      assign_id: 9,
      assign_student_id: 3,
      status: "draft",
      final_percent: 75,
      possible_xp: null,
      earned_xp: null,
      badge: null,
      teacher_feedback: "Nice",
      graded_by: null,
      finalized_at: null,
      criteria: [
        { criterion_id: 10, points: 4 },
        { criterion_id: 11, points: 2 },
      ],
    };
    expect(scoresFromGrade(grade, criteria)).toEqual({ 10: 4, 11: 2 });
    expect(isGradeDraftComplete(criteria, { 10: 4, 11: 2 })).toBe(true);
    expect(isGradeDraftComplete(criteria, { 10: 4, 11: "" })).toBe(false);
  });

  it("builds grade upsert body only when every criterion is scored", () => {
    expect(buildGradeUpsertBody(criteria, { 10: 4, 11: "" }, "x")).toBeNull();
    expect(buildGradeUpsertBody(criteria, { 10: 4, 11: 3 }, "  hi  ")).toEqual({
      criteria: [
        { criterion_id: 10, points: 4 },
        { criterion_id: 11, points: 3 },
      ],
      teacher_feedback: "hi",
    });
  });

  it("gates Return Assignment on saved complete draft", () => {
    expect(
      canReturnWithRubricDraft({
        parentSubmissionStatus: "submitted",
        hasRubric: true,
        grade: null,
        criteria,
      }).reason
    ).toBe("no_draft");

    expect(
      canReturnWithRubricDraft({
        parentSubmissionStatus: "submitted",
        hasRubric: true,
        grade: {
          id: 1,
          assign_id: 9,
          assign_student_id: 3,
          status: "draft",
          final_percent: 50,
          possible_xp: null,
          earned_xp: null,
          badge: null,
          teacher_feedback: null,
          graded_by: null,
          finalized_at: null,
          criteria: [{ criterion_id: 10, points: 2 }],
        },
        criteria,
      }).reason
    ).toBe("incomplete_draft");

    expect(
      canReturnWithRubricDraft({
        parentSubmissionStatus: "submitted",
        hasRubric: true,
        grade: {
          id: 1,
          assign_id: 9,
          assign_student_id: 3,
          status: "draft",
          final_percent: 75,
          possible_xp: null,
          earned_xp: null,
          badge: null,
          teacher_feedback: null,
          graded_by: null,
          finalized_at: null,
          criteria: [
            { criterion_id: 10, points: 4 },
            { criterion_id: 11, points: 2 },
          ],
        },
        criteria,
      })
    ).toEqual({ ready: true, reason: null });
  });

  it("hydrates draft rows from saved rubric", () => {
    const rows = rubricToDraftRows({
      id: 5,
      title: "T",
      criteria,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].label).toBe("Clarity");
    expect(rows[0].weight).toBe("50");
  });
});
