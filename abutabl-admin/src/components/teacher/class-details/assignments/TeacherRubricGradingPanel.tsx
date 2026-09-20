import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CircularProgress from "@mui/material/CircularProgress";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ASSIGNMENT_RUBRIC_POINTS,
  AssignmentGradePayload,
  AssignmentRubricCriterion,
  AssignmentRubricPayload,
  fetchAssignmentRubric,
  fetchAssignmentStudentGrade,
  upsertAssignmentRubric,
  upsertAssignmentStudentGrade,
} from "@/api/classAssignmentsApi";
import { notify } from "@/utils/notify";
import {
  buildGradeUpsertBody,
  buildRubricUpsertBody,
  canReturnWithRubricDraft,
  emptyCriterionDraftRow,
  isGradeDraftComplete,
  rubricToDraftRows,
  RubricCriterionDraftRow,
  scoresFromGrade,
  StudentCriterionScoreMap,
  weightsSumTo100,
} from "./teacherRubricGradingUtils";

const CARD_SHADOW = "0 4px 16px rgba(15, 23, 42, 0.06)";
const BRAND = "#00A68A";

export type TeacherRubricReadiness = {
  ready: boolean;
  reason:
    | "not_submitted"
    | "no_rubric"
    | "no_draft"
    | "incomplete_draft"
    | "already_graded"
    | null;
  hasRubric: boolean;
  grade: AssignmentGradePayload | null;
  criteria: AssignmentRubricCriterion[];
};

export type TeacherRubricGradingPanelProps = {
  assignId: number;
  studentId: number;
  parentSubmissionStatus: string;
  onReadinessChange?: (state: TeacherRubricReadiness) => void;
};

const POINT_LABEL_KEYS: Record<number, string> = {
  4: "ASSIGNMENTS_S9_RUBRIC_POINTS_4",
  3: "ASSIGNMENTS_S9_RUBRIC_POINTS_3",
  2: "ASSIGNMENTS_S9_RUBRIC_POINTS_2",
  1: "ASSIGNMENTS_S9_RUBRIC_POINTS_1",
};

/**
 * Assignment-level rubric editor + per-student rubric grade draft.
 * Uses existing /rubric and /grade APIs only.
 */
export const TeacherRubricGradingPanel = ({
  assignId,
  studentId,
  parentSubmissionStatus,
  onReadinessChange,
}: TeacherRubricGradingPanelProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rubricPayload, setRubricPayload] =
    useState<AssignmentRubricPayload | null>(null);
  const [grade, setGrade] = useState<AssignmentGradePayload | null>(null);

  const [title, setTitle] = useState("Assignment Rubric");
  const [draftRows, setDraftRows] = useState<RubricCriterionDraftRow[]>([
    emptyCriterionDraftRow(0),
  ]);
  const [savingRubric, setSavingRubric] = useState(false);

  const [scores, setScores] = useState<StudentCriterionScoreMap>({});
  const [feedback, setFeedback] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const parentStatus = String(parentSubmissionStatus || "active").toLowerCase();
  const rubricLocked = Boolean(rubricPayload?.rubric_locked);
  const criteria = useMemo(
    () =>
      [...(rubricPayload?.rubric?.criteria ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id
      ),
    [rubricPayload]
  );
  const hasRubric = criteria.length > 0;
  const gradeFinalized =
    String(grade?.status || "").toLowerCase() === "finalized" ||
    parentStatus === "graded";
  const canEditRubric = !rubricLocked && !gradeFinalized;
  const canEditScores =
    parentStatus === "submitted" && !gradeFinalized && hasRubric;

  const loadAll = useCallback(async () => {
    if (!assignId || !studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [rubricRes, gradeRes] = await Promise.all([
        fetchAssignmentRubric(assignId),
        fetchAssignmentStudentGrade(assignId, studentId),
      ]);
      if (!rubricRes) {
        setLoadError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_LOAD_ERROR"));
        setRubricPayload(null);
        setGrade(null);
        return;
      }
      setRubricPayload(rubricRes);
      setTitle(rubricRes.rubric?.title || "Assignment Rubric");
      setDraftRows(rubricToDraftRows(rubricRes.rubric));
      setGrade(gradeRes);
      const nextCriteria = [...(rubricRes.rubric?.criteria ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id
      );
      setScores(scoresFromGrade(gradeRes, nextCriteria));
      setFeedback(gradeRes?.teacher_feedback ?? "");
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_LOAD_ERROR")
      );
      setRubricPayload(null);
      setGrade(null);
    } finally {
      setLoading(false);
    }
  }, [assignId, studentId, parentSubmissionStatus]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const readiness = useMemo((): TeacherRubricReadiness => {
    const gate = canReturnWithRubricDraft({
      parentSubmissionStatus: parentStatus,
      hasRubric,
      grade,
      criteria,
    });
    return {
      ready: gate.ready,
      reason: gate.reason,
      hasRubric,
      grade,
      criteria,
    };
  }, [parentStatus, hasRubric, grade, criteria]);

  useEffect(() => {
    onReadinessChange?.(readiness);
  }, [onReadinessChange, readiness]);

  const weightCheck = weightsSumTo100(draftRows);

  const handleSaveRubric = async () => {
    if (!canEditRubric || savingRubric) {
      return;
    }
    const body = buildRubricUpsertBody(title, draftRows);
    if (!body) {
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_INVALID"),
        "error"
      );
      return;
    }
    setSavingRubric(true);
    try {
      const response = await upsertAssignmentRubric(assignId, body);
      if (response?.status === false || !response.data) {
        throw new Error(
          response?.msg ||
            t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_SAVE_ERROR")
        );
      }
      setRubricPayload(response.data);
      setTitle(response.data.rubric?.title || title);
      setDraftRows(rubricToDraftRows(response.data.rubric));
      const nextCriteria = [...(response.data.rubric?.criteria ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id
      );
      setScores((prev) => {
        const next = scoresFromGrade(grade, nextCriteria);
        nextCriteria.forEach((c) => {
          if (prev[c.id] !== undefined && prev[c.id] !== "") {
            next[c.id] = prev[c.id];
          }
        });
        return next;
      });
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_SAVE_SUCCESS"),
        "success"
      );
    } catch (err: unknown) {
      notify(
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_SAVE_ERROR"),
        "error"
      );
    } finally {
      setSavingRubric(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!canEditScores || savingGrade) {
      return;
    }
    const body = buildGradeUpsertBody(criteria, scores, feedback);
    if (!body) {
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_DRAFT_INCOMPLETE"),
        "error"
      );
      return;
    }
    setSavingGrade(true);
    try {
      const response = await upsertAssignmentStudentGrade(
        assignId,
        studentId,
        body
      );
      if (response?.status === false || !response.data) {
        throw new Error(
          response?.msg ||
            t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_SAVE_ERROR")
        );
      }
      setGrade(response.data);
      setScores(scoresFromGrade(response.data, criteria));
      setFeedback(response.data.teacher_feedback ?? "");
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_SAVE_SUCCESS"),
        "success"
      );
    } catch (err: unknown) {
      notify(
        err instanceof Error
          ? err.message
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_SAVE_ERROR"),
        "error"
      );
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return (
      <div
        className="mb-3 flex min-h-[88px] items-center justify-center rounded-[16px] border border-[#EEF0F2] bg-white"
        style={{ boxShadow: CARD_SHADOW }}
        data-testid="teacher-rubric-loading"
      >
        <CircularProgress size={24} sx={{ color: BRAND }} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="mb-3 rounded-[16px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B91C1C]"
        style={{ boxShadow: CARD_SHADOW }}
        data-testid="teacher-rubric-error"
      >
        {loadError}
      </div>
    );
  }

  const draftComplete = isGradeDraftComplete(criteria, scores);

  return (
    <div className="mb-3 space-y-3" data-testid="teacher-rubric-panel">
      {/* Assignment-level rubric */}
      <div
        className="rounded-[16px] border border-[#EEF0F2] bg-white p-4"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[16px] font-extrabold text-[#111827]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_TITLE")}
            </h3>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              {hasRubric
                ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_EXISTS")
                : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_MISSING")}
              {rubricLocked
                ? ` · ${t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_LOCKED")}`
                : null}
            </p>
          </div>
          {canEditRubric ? (
            <button
              type="button"
              disabled={savingRubric}
              onClick={() => void handleSaveRubric()}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] px-4 text-[14px] font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: BRAND }}
              data-testid="teacher-rubric-save"
            >
              {savingRubric
                ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SAVING")
                : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_SAVE")}
            </button>
          ) : null}
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-[12px] font-bold text-[#374151]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_NAME")}
          </span>
          <input
            type="text"
            value={title}
            disabled={!canEditRubric}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] text-[#111827] disabled:bg-[#F9FAFB]"
            data-testid="teacher-rubric-title"
          />
        </label>

        <div className="space-y-2">
          {draftRows.map((row, index) => (
            <div
              key={row.key}
              className="flex flex-col gap-2 rounded-[12px] border border-[#F3F4F6] bg-[#F9FAFB] p-3 sm:flex-row sm:items-end"
            >
              <label className="min-w-0 flex-1">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                  {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_CRITERION")}
                </span>
                <input
                  type="text"
                  value={row.label}
                  disabled={!canEditRubric}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDraftRows((prev) =>
                      prev.map((r) =>
                        r.key === row.key ? { ...r, label: value } : r
                      )
                    );
                  }}
                  className="h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[14px] disabled:bg-[#F3F4F6]"
                  data-testid={`teacher-rubric-criterion-label-${index}`}
                />
              </label>
              <label className="w-full sm:w-28">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                  {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_WEIGHT")}
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.weight}
                  disabled={!canEditRubric}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDraftRows((prev) =>
                      prev.map((r) =>
                        r.key === row.key ? { ...r, weight: value } : r
                      )
                    );
                  }}
                  className="h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[14px] disabled:bg-[#F3F4F6]"
                  data-testid={`teacher-rubric-criterion-weight-${index}`}
                />
              </label>
              {canEditRubric && draftRows.length > 1 ? (
                <button
                  type="button"
                  aria-label={t(
                    "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_REMOVE_CRITERION"
                  )}
                  onClick={() =>
                    setDraftRows((prev) => prev.filter((r) => r.key !== row.key))
                  }
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#FECACA] text-[#DC2626]"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {canEditRubric ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setDraftRows((prev) => [
                  ...prev,
                  emptyCriterionDraftRow(prev.length),
                ])
              }
              className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-[#99F6E4] bg-[#E6F8F5] px-3 text-[13px] font-bold text-[#0F766E]"
              data-testid="teacher-rubric-add-criterion"
            >
              <AddIcon sx={{ fontSize: 18 }} />
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_ADD_CRITERION")}
            </button>
            <span
              className={`text-[12px] font-semibold ${
                weightCheck.ok ? "text-[#0F766E]" : "text-[#C2410C]"
              }`}
              data-testid="teacher-rubric-weight-sum"
            >
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_WEIGHT_SUM", {
                sum: Math.round(weightCheck.sum * 100) / 100,
              })}
            </span>
          </div>
        ) : null}
      </div>

      {/* Student-level grade draft */}
      <div
        className="rounded-[16px] border border-[#EEF0F2] bg-white p-4"
        style={{ boxShadow: CARD_SHADOW }}
        data-testid="teacher-grade-draft-panel"
      >
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[16px] font-extrabold text-[#111827]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_TITLE")}
            </h3>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              {gradeFinalized
                ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_FINALIZED")
                : parentStatus === "submitted"
                  ? draftComplete
                    ? grade
                      ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_DRAFT_READY")
                      : t(
                          "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_DRAFT_UNSAVED"
                        )
                    : t(
                        "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_DRAFT_INCOMPLETE"
                      )
                  : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_WAIT_SUBMIT")}
            </p>
          </div>
          {canEditScores ? (
            <button
              type="button"
              disabled={savingGrade || !draftComplete}
              onClick={() => void handleSaveGrade()}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] px-4 text-[14px] font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: BRAND }}
              data-testid="teacher-grade-save"
            >
              {savingGrade
                ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_SAVING")
                : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_SAVE")}
            </button>
          ) : null}
        </div>

        {!hasRubric ? (
          <p className="text-[13px] font-medium text-[#C2410C]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_NEED_RUBRIC")}
          </p>
        ) : (
          <div className="space-y-3">
            {criteria.map((criterion) => (
              <div
                key={criterion.id}
                className="rounded-[12px] border border-[#F3F4F6] bg-[#F9FAFB] p-3"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[14px] font-bold text-[#111827]">
                    {criterion.label}
                  </p>
                  <span className="text-[12px] font-semibold text-[#6B7280]">
                    {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUBRIC_WEIGHT_BADGE", {
                      weight: criterion.weight,
                    })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ASSIGNMENT_RUBRIC_POINTS.map((points) => {
                    const selected = scores[criterion.id] === points;
                    const labelKey = POINT_LABEL_KEYS[points];
                    return (
                      <button
                        key={points}
                        type="button"
                        disabled={!canEditScores}
                        onClick={() =>
                          setScores((prev) => ({
                            ...prev,
                            [criterion.id]: points,
                          }))
                        }
                        className={`inline-flex min-h-9 items-center rounded-full border px-3 text-[12px] font-bold disabled:opacity-70 ${
                          selected
                            ? "border-[#0F766E] bg-[#E6F8F5] text-[#0F766E]"
                            : "border-[#E5E7EB] bg-white text-[#374151]"
                        }`}
                        data-testid={`teacher-grade-points-${criterion.id}-${points}`}
                      >
                        {points} · {t(`TEACHER_CLASS_DETAILS.${labelKey}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <label className="block">
              <span className="mb-1 block text-[12px] font-bold text-[#374151]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_FEEDBACK")}
              </span>
              <textarea
                value={feedback}
                disabled={!canEditScores}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder={t(
                  "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MANUAL_FEEDBACK_PLACEHOLDER"
                )}
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#111827] disabled:bg-[#F9FAFB]"
                data-testid="teacher-grade-feedback"
              />
            </label>

            {grade && grade.final_percent != null ? (
              <p className="text-[13px] font-semibold text-[#0F766E]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_GRADE_PREVIEW", {
                  percent: Math.round(Number(grade.final_percent)),
                })}
                {grade.badge?.label ? ` · ${grade.badge.label}` : ""}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherRubricGradingPanel;
