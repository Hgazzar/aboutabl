import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { useTranslation } from "react-i18next";

const TEAL = "#24B8A2";
const TITLE_MAX = 255;

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(480px, calc(100vw - 32px))",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 3,
};

export type EditAssignmentTitleModalProps = {
  open: boolean;
  initialTitle: string;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
};

export const EditAssignmentTitleModal = ({
  open,
  initialTitle,
  saving,
  error = null,
  onClose,
  onSave,
}: EditAssignmentTitleModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
    }
  }, [open, initialTitle]);

  const trimmed = title.trim();
  const canSave =
    trimmed.length > 0 && trimmed.length <= TITLE_MAX && !saving;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      data-testid="edit-assignment-title-modal"
    >
      <Box sx={modalStyle}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT_TITLE_MODAL")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[#6B7280] disabled:opacity-50"
            aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT_CANCEL")}
            data-testid="edit-assignment-title-close"
          >
            <HighlightOffRoundedIcon />
          </button>
        </div>

        <label
          htmlFor="edit-assignment-title-input"
          className="mb-1.5 block text-[13px] font-semibold text-[#374151]"
        >
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT_TITLE_LABEL")}
        </label>
        <TextField
          id="edit-assignment-title-input"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
          disabled={saving}
          inputProps={{
            maxLength: TITLE_MAX,
            "data-testid": "edit-assignment-title-input",
          }}
          error={Boolean(error)}
          helperText={error || undefined}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-5 text-sm font-semibold text-[#374151] disabled:opacity-50"
            data-testid="edit-assignment-title-cancel"
          >
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT_CANCEL")}
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
            data-testid="edit-assignment-title-save"
          >
            {saving
              ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT_SAVING")
              : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EDIT_SAVE")}
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default EditAssignmentTitleModal;
