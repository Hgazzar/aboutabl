import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { useTranslation } from "react-i18next";

const TEAL = "#24B8A2";
const NOTE_MAX = 5000;

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(560px, calc(100vw - 32px))",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 3,
};

export type EvaluationFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialNote?: string;
  saving: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
};

export const EvaluationFormModal = ({
  open,
  mode,
  initialNote = "",
  saving,
  onClose,
  onSave,
}: EvaluationFormModalProps) => {
  const { t } = useTranslation();
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (open) {
      setNote(initialNote);
    }
  }, [open, initialNote]);

  const trimmed = note.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= NOTE_MAX && !saving;

  return (
    <Modal open={open} onClose={saving ? undefined : onClose}>
      <Box sx={modalStyle}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#111827]">
            {mode === "edit"
              ? t("TEACHER_STUDENT_PROFILE.EDIT_EVALUATION")
              : t("TEACHER_STUDENT_PROFILE.ADD_EVALUATION")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[#6B7280] disabled:opacity-50"
            aria-label={t("TEACHER_STUDENT_PROFILE.CANCEL")}
          >
            <HighlightOffRoundedIcon />
          </button>
        </div>

        <TextField
          multiline
          minRows={5}
          fullWidth
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
          disabled={saving}
          placeholder={t("TEACHER_STUDENT_PROFILE.EVALUATION_NOTE_PLACEHOLDER")}
          inputProps={{ maxLength: NOTE_MAX }}
        />
        <p className="mt-1 text-right text-xs text-[#9CA3AF]">
          {note.length}/{NOTE_MAX}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-5 text-sm font-semibold text-[#374151] disabled:opacity-50"
          >
            {t("TEACHER_STUDENT_PROFILE.CANCEL")}
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={async () => {
              if (!canSave) return;
              await onSave(trimmed);
            }}
            className="h-10 rounded-[10px] px-5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: TEAL }}
          >
            {saving
              ? t("TEACHER_STUDENT_PROFILE.SAVING")
              : t("TEACHER_STUDENT_PROFILE.SAVE")}
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default EvaluationFormModal;
