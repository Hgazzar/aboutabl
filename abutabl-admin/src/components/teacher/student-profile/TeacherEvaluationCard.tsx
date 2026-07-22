import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { teacherEvaluationsApi } from "@/api/teacherEvaluationsApi";
import { useLoginUser } from "@/hooks/useLoginUser";
import {
  StudentProfileTeacherEvaluation,
  TeacherEvaluationNote,
} from "@/types/studentProfile";
import { EvaluationFormModal } from "./evaluation/EvaluationFormModal";
import { EvaluationHistoryModal } from "./evaluation/EvaluationHistoryModal";

const TEAL = "#24B8A2";

export type TeacherEvaluationCardProps = {
  classId: number;
  studentId: number;
  evaluation: StudentProfileTeacherEvaluation;
  onMutated: () => Promise<unknown> | void;
  /** Increment to open the create-evaluation modal (header button on Screen #9). */
  openCreateSignal?: number;
};

const confirmStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(440px, calc(100vw - 32px))",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 3,
};

const formatNoteDate = (iso: string | null, locale: string): string => {
  if (!iso) {
    return "—";
  }

  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

/**
 * Display-only Teacher Note & Evaluation from profile.teacher_evaluation.
 * Mutations call existing evaluation APIs then refresh profile (no FE ownership logic).
 */
export const TeacherEvaluationCard = ({
  classId,
  studentId,
  evaluation,
  onMutated,
  openCreateSignal = 0,
}: TeacherEvaluationCardProps) => {
  const { t, i18n } = useTranslation();
  const loginUser = useLoginUser();
  const cookieId = Cookies.get("abotable_id");
  const currentTeacherId = Number(loginUser?.id ?? cookieId ?? 0) || null;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<TeacherEvaluationNote | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeacherEvaluationNote | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Clear modals / draft targets whenever the selected student changes (no duplicated note state).
  useEffect(() => {
    setFormOpen(false);
    setFormMode("create");
    setEditing(null);
    setHistoryOpen(false);
    setDeleteTarget(null);
    setSaving(false);
    setDeleting(false);
  }, [studentId]);

  useEffect(() => {
    if (openCreateSignal <= 0) {
      return;
    }
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }, [openCreateSignal]);

  const latest = evaluation.latest_feedback ?? null;
  const notes = evaluation.notes ?? [];
  const isEmpty = !evaluation.available || latest == null;

  const latestDateLabel = useMemo(
    () => formatNoteDate(latest?.created_at ?? null, i18n.language),
    [latest?.created_at, i18n.language]
  );

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (note: TeacherEvaluationNote) => {
    setHistoryOpen(false);
    setFormMode("edit");
    setEditing(note);
    setFormOpen(true);
  };

  const handleSave = async (noteText: string) => {
    setSaving(true);
    try {
      if (formMode === "edit" && editing) {
        await teacherEvaluationsApi.update(
          classId,
          studentId,
          editing.id,
          noteText
        );
        toast.success(t("TEACHER_STUDENT_PROFILE.EVALUATION_UPDATED"));
      } else {
        await teacherEvaluationsApi.create(classId, studentId, noteText);
        toast.success(t("TEACHER_STUDENT_PROFILE.EVALUATION_CREATED"));
      }
      setFormOpen(false);
      setEditing(null);
      await onMutated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { msg?: string } }; message?: string })
          ?.response?.data?.msg ||
        (err as Error)?.message ||
        t("TEACHER_STUDENT_PROFILE.EVALUATION_SAVE_ERROR");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await teacherEvaluationsApi.remove(classId, studentId, deleteTarget.id);
      toast.success(t("TEACHER_STUDENT_PROFILE.EVALUATION_DELETED"));
      setDeleteTarget(null);
      await onMutated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { msg?: string } }; message?: string })
          ?.response?.data?.msg ||
        (err as Error)?.message ||
        t("TEACHER_STUDENT_PROFILE.EVALUATION_DELETE_ERROR");
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <article className="flex min-h-[220px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[#111827] md:text-[1.0625rem]">
            {t("TEACHER_STUDENT_PROFILE.TEACHER_EVALUATION")}
          </h2>
          <button
            type="button"
            onClick={openCreate}
            className="h-10 rounded-[10px] px-5 text-[14px] font-semibold leading-5 text-white"
            style={{ backgroundColor: TEAL }}
          >
            {t("TEACHER_STUDENT_PROFILE.ADD_EVALUATION")}
          </button>
        </div>

        {isEmpty ? (
          <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center">
            <p className="text-sm font-medium text-[#6B7280]">
              {t("TEACHER_STUDENT_PROFILE.NO_EVALUATIONS_YET")}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#F3F4F6] px-5 py-5 md:px-6 md:py-6">
            <p className="text-[15px] font-semibold text-[#111827]">
              {latest?.teacher_name || "—"}
            </p>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              {t("TEACHER_STUDENT_PROFILE.LAST_NOTE", { date: latestDateLabel })}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#374151]">
              {latest?.note}
            </p>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="mt-4 text-sm font-semibold"
              style={{ color: TEAL }}
            >
              {t("TEACHER_STUDENT_PROFILE.VIEW_HISTORY")}
            </button>
          </div>
        )}
      </article>

      <EvaluationFormModal
        open={formOpen}
        mode={formMode}
        initialNote={editing?.note ?? ""}
        saving={saving}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <EvaluationHistoryModal
        open={historyOpen}
        notes={notes}
        currentTeacherId={currentTeacherId}
        onClose={() => setHistoryOpen(false)}
        onEdit={openEdit}
        onDelete={(note) => {
          setHistoryOpen(false);
          setDeleteTarget(note);
        }}
        formatDate={(iso) => formatNoteDate(iso, i18n.language)}
      />

      <Modal
        open={deleteTarget != null}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
      >
        <Box sx={confirmStyle}>
          <h3 className="text-lg font-bold text-[#111827]">
            {t("TEACHER_STUDENT_PROFILE.DELETE_EVALUATION_TITLE")}
          </h3>
          <p className="mt-2 text-sm text-[#6B7280]">
            {t("TEACHER_STUDENT_PROFILE.DELETE_EVALUATION_CONFIRM")}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className="h-10 rounded-[10px] border border-[#E5E7EB] px-5 text-sm font-semibold text-[#374151] disabled:opacity-50"
            >
              {t("TEACHER_STUDENT_PROFILE.CANCEL")}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="h-10 rounded-[10px] bg-[#DC2626] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {deleting
                ? t("TEACHER_STUDENT_PROFILE.DELETING")
                : t("TEACHER_STUDENT_PROFILE.DELETE")}
            </button>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default TeacherEvaluationCard;
