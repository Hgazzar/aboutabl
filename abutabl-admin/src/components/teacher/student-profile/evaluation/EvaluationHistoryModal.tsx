import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { useTranslation } from "react-i18next";
import { TeacherEvaluationNote } from "@/types/studentProfile";

const TEAL = "#24B8A2";

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(640px, calc(100vw - 32px))",
  maxHeight: "80vh",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 3,
  display: "flex",
  flexDirection: "column" as const,
};

export type EvaluationHistoryModalProps = {
  open: boolean;
  notes: TeacherEvaluationNote[];
  currentTeacherId: number | null;
  onClose: () => void;
  onEdit: (note: TeacherEvaluationNote) => void;
  onDelete: (note: TeacherEvaluationNote) => void;
  formatDate: (iso: string | null) => string;
};

export const EvaluationHistoryModal = ({
  open,
  notes,
  currentTeacherId,
  onClose,
  onEdit,
  onDelete,
  formatDate,
}: EvaluationHistoryModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#111827]">
            {t("TEACHER_STUDENT_PROFILE.EVALUATION_HISTORY")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280]"
            aria-label={t("TEACHER_STUDENT_PROFILE.CANCEL")}
          >
            <HighlightOffRoundedIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#9CA3AF]">
              {t("TEACHER_STUDENT_PROFILE.NO_EVALUATIONS_YET")}
            </p>
          ) : (
            notes.map((item) => {
              const isOwner =
                currentTeacherId != null &&
                Number(item.teacher_id) === Number(currentTeacherId);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">
                        {item.teacher_name || "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    {isOwner ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="text-xs font-semibold"
                          style={{ color: TEAL }}
                        >
                          {t("TEACHER_STUDENT_PROFILE.EDIT")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="text-xs font-semibold text-[#DC2626]"
                        >
                          {t("TEACHER_STUDENT_PROFILE.DELETE")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#374151]">
                    {item.note}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </Box>
    </Modal>
  );
};

export default EvaluationHistoryModal;
