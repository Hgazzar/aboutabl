import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

const TEAL = "#23B8A2";
const TEAL_DARK = "#0F766E";

const pickerTheme = createTheme({
  palette: {
    primary: {
      main: TEAL,
      light: "#5DCFBF",
      dark: TEAL_DARK,
      contrastText: "#FFFFFF",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        textPrimary: {
          color: TEAL,
          "&:hover": {
            backgroundColor: "rgba(35, 184, 162, 0.08)",
          },
        },
      },
    },
  },
});

const modalStyle = {
  position: "relative" as const,
  width: "min(480px, calc(100vw - 32px))",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 3,
  outline: "none",
  overflow: "visible",
};

const pickerPaperSx = {
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #E5E7EB",
  boxShadow: "0 12px 40px rgba(15, 23, 42, 0.14)",
  "& .MuiPickersDay-root.Mui-selected": {
    backgroundColor: `${TEAL} !important`,
    color: "#FFFFFF !important",
  },
  "& .MuiPickersDay-root.Mui-selected:hover": {
    backgroundColor: `${TEAL_DARK} !important`,
  },
  "& .MuiPickersDay-root.Mui-selected:focus": {
    backgroundColor: `${TEAL} !important`,
  },
  "& .MuiPickersDay-today:not(.Mui-selected)": {
    borderColor: TEAL,
  },
  "& .MuiMultiSectionDigitalClockSection-item.Mui-selected": {
    backgroundColor: `${TEAL} !important`,
    color: "#FFFFFF !important",
  },
  "& .MuiMultiSectionDigitalClockSection-item.Mui-selected:hover": {
    backgroundColor: `${TEAL_DARK} !important`,
  },
  "& .MuiMenuItem-root.Mui-selected": {
    backgroundColor: `${TEAL} !important`,
    color: "#FFFFFF !important",
  },
  "& .MuiButton-textPrimary": {
    color: `${TEAL} !important`,
  },
  "& .MuiPickersLayout-actionBar .MuiButton-root": {
    color: TEAL,
  },
};

/** Format a Date as `YYYY-MM-DDTHH:mm` for datetime-local inputs (local TZ). */
export const toDatetimeLocalValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Convert datetime-local value to ISO-8601 (with offset). */
export const datetimeLocalToIso = (localValue: string): string => {
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) {
    throw new Error("invalid_datetime");
  }
  return d.toISOString();
};

/** Earliest selectable instant: strictly after now (any future date/time). */
export const minExtendDueAt = (_currentDueAt?: string | null): Date => {
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() + 1);
  return now;
};

export type ExtendAssignmentDueAtModalProps = {
  open: boolean;
  currentDueAt: string | null;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (dueAtIso: string) => Promise<void>;
};

export const ExtendAssignmentDueAtModal = ({
  open,
  currentDueAt,
  saving,
  error = null,
  onClose,
  onSave,
}: ExtendAssignmentDueAtModalProps) => {
  const { t } = useTranslation();
  const minDate = useMemo(() => minExtendDueAt(), [open]);
  const [value, setValue] = useState<Dayjs | null>(() => dayjs(minDate));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const nextMin = minExtendDueAt();
      const current =
        currentDueAt && !Number.isNaN(new Date(currentDueAt).getTime())
          ? dayjs(currentDueAt)
          : null;
      setValue(
        current && current.isAfter(dayjs(nextMin)) ? current : dayjs(nextMin)
      );
      setLocalError(null);
    }
  }, [open, currentDueAt]);

  const displayError = localError || error;
  const canSave = value != null && value.isValid() && !saving;

  const handleSave = async () => {
    setLocalError(null);
    if (value == null || !value.isValid()) {
      setLocalError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_INVALID"));
      return;
    }
    const picked = value.toDate();
    const iso = picked.toISOString();
    if (picked.getTime() <= Date.now()) {
      setLocalError(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_MUST_FUTURE"));
      return;
    }
    await onSave(iso);
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      data-testid="extend-assignment-due-at-modal"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pt: { xs: 2, sm: 6 },
        px: 2,
        overflowY: "auto",
      }}
    >
      <Box sx={modalStyle}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_MODAL")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[#6B7280] disabled:opacity-50"
            aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_CANCEL")}
            data-testid="extend-assignment-due-at-close"
          >
            <HighlightOffRoundedIcon />
          </button>
        </div>

        {currentDueAt ? (
          <p className="mb-3 text-[13px] text-[#6B7280]">
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_CURRENT", {
              date: new Date(currentDueAt).toLocaleString(),
            })}
          </p>
        ) : null}

        <label
          htmlFor="extend-assignment-due-at-input"
          className="mb-1.5 block text-[13px] font-semibold text-[#374151]"
        >
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_LABEL")}
        </label>

        <ThemeProvider theme={pickerTheme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              value={value}
              onChange={(next) => {
                setLocalError(null);
                setValue(next);
              }}
              disabled={saving}
              minDateTime={dayjs(minDate)}
              ampm
              minutesStep={5}
              closeOnSelect={false}
              slotProps={{
                popper: {
                  placement: "bottom-start",
                  disablePortal: false,
                  modifiers: [
                    { name: "offset", options: { offset: [0, 8] } },
                    {
                      name: "preventOverflow",
                      options: { altAxis: true, padding: 12 },
                    },
                  ],
                  sx: { zIndex: 2000 },
                },
                desktopPaper: {
                  sx: pickerPaperSx,
                },
                digitalClockSectionItem: {
                  sx: {
                    "&.Mui-selected": {
                      backgroundColor: `${TEAL} !important`,
                      color: "#FFFFFF !important",
                    },
                  },
                },
                textField: {
                  id: "extend-assignment-due-at-input",
                  fullWidth: true,
                  error: Boolean(displayError),
                  helperText: displayError || undefined,
                  inputProps: {
                    "data-testid": "extend-assignment-due-at-input",
                  },
                  sx: {
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                      {
                        borderColor: TEAL,
                        borderWidth: 2,
                      },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: TEAL,
                    },
                  },
                },
                actionBar: {
                  actions: ["clear", "today", "accept"],
                },
                openPickerButton: {
                  sx: { color: TEAL },
                },
              }}
            />
          </LocalizationProvider>
        </ThemeProvider>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-5 text-sm font-semibold text-[#374151] disabled:opacity-50"
            data-testid="extend-assignment-due-at-cancel"
          >
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_CANCEL")}
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="h-10 rounded-[10px] px-5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: TEAL }}
            data-testid="extend-assignment-due-at-save"
          >
            {saving
              ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_SAVING")
              : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S8_EXTEND_SAVE")}
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default ExtendAssignmentDueAtModal;
