import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StudentProfileSummary } from "@/types/studentProfile";

export type StudentSelectorOption = {
  student_id: number;
  name: string;
  photo_url?: string | null;
};

export type StudentSelectorToolbarProps = {
  student: StudentProfileSummary;
  classmates: StudentSelectorOption[];
  onSelectStudent: (studentId: number) => void;
  onAssignHomework?: () => void;
  onAddEvaluation?: () => void;
  onSendMessage?: () => void;
};

const TEAL = "#24B8A2";
const TEAL_SOFT = "#5EC8E8";

export const StudentSelectorToolbar = ({
  student,
  classmates,
  onSelectStudent,
  onAssignHomework,
  onAddEvaluation,
  onSendMessage,
}: StudentSelectorToolbarProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const index = classmates.findIndex((item) => item.student_id === student.student_id);
  const prev = index > 0 ? classmates[index - 1] : null;
  const next = index >= 0 && index < classmates.length - 1 ? classmates[index + 1] : null;

  const avatarUrl = student.avatar || student.photo_url;
  const options = useMemo(
    () =>
      classmates.length > 0
        ? classmates
        : [{ student_id: student.student_id, name: student.name, photo_url: avatarUrl }],
    [avatarUrl, classmates, student.name, student.student_id]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-[44px] min-w-[220px] items-center gap-2.5 rounded-[12px] border border-[#E5E7EB] bg-white py-1.5 pl-2 pr-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEF2F6] text-[11px] font-bold text-[#4B5563]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (student.name || "?").slice(0, 1).toUpperCase()
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-5 text-[#111827]">
              {student.name || t("TEACHER_STUDENT_PROFILE.UNKNOWN_STUDENT")}
            </span>
            <KeyboardArrowDownIcon sx={{ fontSize: 20, color: "#9CA3AF" }} />
          </button>

          {open ? (
            <div className="absolute left-0 z-30 mt-1.5 max-h-64 w-full min-w-[220px] overflow-auto rounded-[12px] border border-[#E5E7EB] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
              {options.map((option) => (
                <button
                  key={option.student_id}
                  type="button"
                  onClick={() => {
                    onSelectStudent(option.student_id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] leading-5 hover:bg-[#F8FAFC] ${
                    option.student_id === student.student_id
                      ? "bg-[#E6F8F5] font-semibold text-[#0F766E]"
                      : "font-medium text-[#111827]"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEF2F6] text-[10px] font-bold text-[#4B5563]">
                    {option.photo_url ? (
                      <img src={option.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (option.name || "?").slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="truncate">{option.name}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && onSelectStudent(prev.student_id)}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#6B7280] shadow-[0_1px_2px_rgba(16,24,40,0.04)] disabled:opacity-40"
          aria-label={t("TEACHER_STUDENT_PROFILE.PREV_STUDENT")}
        >
          <ChevronLeftIcon sx={{ fontSize: 22 }} />
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && onSelectStudent(next.student_id)}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#6B7280] shadow-[0_1px_2px_rgba(16,24,40,0.04)] disabled:opacity-40"
          aria-label={t("TEACHER_STUDENT_PROFILE.NEXT_STUDENT")}
        >
          <ChevronRightIcon sx={{ fontSize: 22 }} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onAssignHomework}
          className="h-[44px] rounded-[10px] px-5 text-[14px] font-semibold leading-5 text-white"
          style={{ backgroundColor: TEAL }}
        >
          {t("TEACHER_STUDENT_PROFILE.ASSIGN_HOMEWORK")}
        </button>
        <button
          type="button"
          onClick={onAddEvaluation}
          className="h-[44px] rounded-[10px] border bg-white px-5 text-[14px] font-semibold leading-5"
          style={{ borderColor: TEAL, color: TEAL }}
        >
          {t("TEACHER_STUDENT_PROFILE.ADD_EVALUATION")}
        </button>
        <button
          type="button"
          onClick={onSendMessage}
          className="h-[44px] rounded-[10px] border bg-white px-5 text-[14px] font-semibold leading-5"
          style={{ borderColor: TEAL_SOFT, color: TEAL_SOFT }}
        >
          {t("TEACHER_STUDENT_PROFILE.SEND_MESSAGE")}
        </button>
      </div>
    </div>
  );
};

export default StudentSelectorToolbar;
