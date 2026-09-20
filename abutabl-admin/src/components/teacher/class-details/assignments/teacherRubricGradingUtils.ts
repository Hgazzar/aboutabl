import {
  ASSIGNMENT_RUBRIC_POINTS,
  AssignmentGradePayload,
  AssignmentRubricCriterion,
  AssignmentRubricDefinition,
} from "@/api/classAssignmentsApi";

/** Matches AssignmentRubricService::WEIGHT_SUM_TOLERANCE */
export const RUBRIC_WEIGHT_SUM_TOLERANCE = 0.02;

export type RubricCriterionDraftRow = {
  /** Local key for React lists (new rows have no server id yet). */
  key: string;
  label: string;
  weight: string;
};

export type StudentCriterionScoreMap = Record<number, number | "">;

export function emptyCriterionDraftRow(index = 0): RubricCriterionDraftRow {
  return {
    key: `new-${Date.now()}-${index}`,
    label: "",
    weight: index === 0 ? "100" : "",
  };
}

export function rubricToDraftRows(
  rubric: AssignmentRubricDefinition | null
): RubricCriterionDraftRow[] {
  if (!rubric || rubric.criteria.length === 0) {
    return [emptyCriterionDraftRow(0)];
  }
  const sorted = [...rubric.criteria].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id
  );
  return sorted.map((row) => ({
    key: `c-${row.id}`,
    label: row.label,
    weight: String(row.weight),
  }));
}

export function parseWeight(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return Math.round(n * 10000) / 10000;
}

export function weightsSumTo100(
  rows: RubricCriterionDraftRow[]
): { ok: boolean; sum: number } {
  let sum = 0;
  for (const row of rows) {
    const w = parseWeight(row.weight);
    if (w === null) {
      return { ok: false, sum };
    }
    sum += w;
  }
  return {
    ok: Math.abs(sum - 100) <= RUBRIC_WEIGHT_SUM_TOLERANCE,
    sum,
  };
}

export function buildRubricUpsertBody(
  title: string,
  rows: RubricCriterionDraftRow[]
): { title: string; criteria: Array<{ label: string; weight: number }> } | null {
  const criteria: Array<{ label: string; weight: number }> = [];
  for (const row of rows) {
    const label = row.label.trim();
    const weight = parseWeight(row.weight);
    if (label === "" || weight === null) {
      return null;
    }
    criteria.push({ label, weight });
  }
  if (criteria.length === 0) {
    return null;
  }
  const { ok } = weightsSumTo100(rows);
  if (!ok) {
    return null;
  }
  return {
    title: title.trim() || "Assignment Rubric",
    criteria,
  };
}

export function isValidRubricPoint(points: number): boolean {
  return (ASSIGNMENT_RUBRIC_POINTS as readonly number[]).includes(points);
}

export function scoresFromGrade(
  grade: AssignmentGradePayload | null,
  criteria: AssignmentRubricCriterion[]
): StudentCriterionScoreMap {
  const map: StudentCriterionScoreMap = {};
  criteria.forEach((c) => {
    map[c.id] = "";
  });
  if (!grade) {
    return map;
  }
  grade.criteria.forEach((row) => {
    if (isValidRubricPoint(row.points)) {
      map[row.criterion_id] = row.points;
    }
  });
  return map;
}

export function isGradeDraftComplete(
  criteria: AssignmentRubricCriterion[],
  scores: StudentCriterionScoreMap
): boolean {
  if (criteria.length === 0) {
    return false;
  }
  return criteria.every((c) => {
    const points = scores[c.id];
    return typeof points === "number" && isValidRubricPoint(points);
  });
}

export function buildGradeUpsertBody(
  criteria: AssignmentRubricCriterion[],
  scores: StudentCriterionScoreMap,
  teacherFeedback: string
): {
  criteria: Array<{ criterion_id: number; points: number }>;
  teacher_feedback: string | null;
} | null {
  if (!isGradeDraftComplete(criteria, scores)) {
    return null;
  }
  const trimmed = teacherFeedback.trim();
  return {
    criteria: criteria.map((c) => ({
      criterion_id: c.id,
      points: scores[c.id] as number,
    })),
    teacher_feedback: trimmed === "" ? null : trimmed,
  };
}

/**
 * Return Assignment is allowed only when parent is submitted and a complete
 * saved draft exists (mirrors backend finalizeReturn gates at UI level).
 */
export function canReturnWithRubricDraft(args: {
  parentSubmissionStatus: string;
  hasRubric: boolean;
  grade: AssignmentGradePayload | null;
  criteria: AssignmentRubricCriterion[];
}): { ready: boolean; reason: "not_submitted" | "no_rubric" | "no_draft" | "incomplete_draft" | "already_graded" | null } {
  const status = String(args.parentSubmissionStatus || "active").toLowerCase();
  if (status === "graded") {
    return { ready: false, reason: "already_graded" };
  }
  if (status !== "submitted") {
    return { ready: false, reason: "not_submitted" };
  }
  if (!args.hasRubric || args.criteria.length === 0) {
    return { ready: false, reason: "no_rubric" };
  }
  if (!args.grade) {
    return { ready: false, reason: "no_draft" };
  }
  if (String(args.grade.status).toLowerCase() === "finalized") {
    return { ready: false, reason: "already_graded" };
  }
  const scoreMap = scoresFromGrade(args.grade, args.criteria);
  if (!isGradeDraftComplete(args.criteria, scoreMap)) {
    return { ready: false, reason: "incomplete_draft" };
  }
  return { ready: true, reason: null };
}
