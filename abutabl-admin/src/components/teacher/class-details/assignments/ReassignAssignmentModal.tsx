import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { useTranslation } from "react-i18next";
import type { AssignmentDetailsStudentRow } from "@/types/classAssignments";

const TEAL = "#23B8A2";

const modalStyle = {
  position: "relative" as const,
  width: "min(480px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 48px)",
  overflow: "auto",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 3,
  outline: "none",
};

export const isReassignEligible = (row: AssignmentDetailsStudentRow): boolean => {
  if (row.status === "graded") {
    return false;
  }
  const parent = String(row.submission_status ?? "").toLowerCase();
  if (parent === "graded") {
    return false;
  }
  return (
    row.status === "missing" ||
    row.status === "submitted" ||
    row.status === "late" ||
    parent === "active" ||
    parent === "submitted"
  );
};

export type ReassignAssignmentModalProps = {
  open: boolean;
  students: AssignmentDetailsStudentRow[];
  initialSelectedIds: number[];
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (studentIds: number[]) => Promise<void>;
};

export const ReassignAssignmentModal = ({
  open,
  students,
  initialSelectedIds,
  saving,
  error = null,
  onClose,
  onConfirm,
}: ReassignAssignmentModalProps) => {
  const { t } = useTranslation();
  const eligible = useMemo(
    () => students.filter(isReassignEligible),
    [students]
  );
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const eligibleIds = new Set(eligible.map((s) => s.student_id));
    const seeded = initialSelectedIds.filter((id) => eligibleIds.has(id));
    setSelected(seeded.length > 0 ? seeded : []);
  }, [open, initialSelectedIds, eligible]);

  const allSelected =
    eligible.length > 0 && eligible.every((s) => selected.includes(s.student_id));

  const toggleAll = () => {
    setSelected(
      allSelected ? [] : eligible.map((s) => s.student_id)
    );
  };

  const toggleOne = (id: number) => {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  };

  const canConfirm = selected.length > 0 && !saving;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      data-testid="reassign-assignment-modal"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box sx={modalStyle}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REASSIGN_MODAL")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[#6B7280] disabled:opacity-50"
            aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REASSIGN_CANCEL")}
            data-testid="reassign-assignment-close"
          >
            <HighlightOffRoundedIcon />
          </button>
        </div>

        <p className="mb-3 text-[13px] text-[#6B7280]">
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REASSIGN_HINT")}
        </p>

        {eligible.length === 0 ? (
          <p
            className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-6 text-center text-[13px] text-[#6B7280]"
            data-testid="reassign-assignment-empty"
          >
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REASSIGN_EMPTY")}
          </p>
        ) : (
          <div className="rounded-[12px] border border-[#E5E7EB]">
            <label className="flex cursor-pointer items-center gap-3 border-b border-[#F3F4F6] px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={saving}
                className="h-[18px] w-[18px] accent-[#23B8A2]"
                data-testid="reassign-assignment-select-all"
              />
              <span className="text-[13px] font-semibold text-[#374151]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_SELECT_ALL")}
              </span>
            </label>
            <ul className="max-h-[280px] overflow-y-auto">
              {eligible.map((row) => {
                const checked = selected.includes(row.student_id);
                return (
                  <li key={row.student_id}>
                    <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8FAFB]">
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(row.student_id)}
                          disabled={saving}
                          className="h-[18px] w-[18px] accent-[#23B8A2]"
                          data-testid={`reassign-student-${row.student_id}`}
                        />
                        <span className="text-[14px] font-medium text-[#111827]">
                          {row.name}
                        </span>
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                        {row.status}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error ? (
          <p className="mt-3 text-[13px] text-[#DC2626]" data-testid="reassign-assignment-error">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-5 text-sm font-semibold text-[#374151] disabled:opacity-50"
            data-testid="reassign-assignment-cancel"
          >
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REASSIGN_CANCEL")}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={async () => {
              if (!canConfirm) return;
              await onConfirm(selected);
            }}
            className="h-10 rounded-[10px] px-5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: TEAL }}
            data-testid="reassign-assignment-confirm"
          >
            {saving
              ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REASSIGN_SAVING")
              : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_REASSIGN_CONFIRM")}
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default ReassignAssignmentModal;
