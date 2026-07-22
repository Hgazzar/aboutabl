import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useEffect, useRef, useState } from "react";

export type WizardSelectOption = {
  value: string;
  label: string;
  avatarLetter?: string;
};

export type WizardSelectProps = {
  value: string;
  options: WizardSelectOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  ariaLabel?: string;
};

/**
 * Teacher portal dropdown matching StudentSelectorToolbar visual language.
 */
export const WizardSelect = ({
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
  ariaLabel,
}: WizardSelectProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? null;
  const letter =
    selected?.avatarLetter ||
    (selected?.label || placeholder || "?").slice(0, 1).toUpperCase();

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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-[44px] w-full items-center gap-2.5 rounded-[12px] border border-[#E5E7EB] bg-white py-1.5 pl-2 pr-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2F6] text-[11px] font-bold text-[#4B5563]">
          {letter}
        </span>
        <span
          className={`min-w-0 flex-1 truncate text-[14px] font-semibold leading-5 ${
            selected ? "text-[#111827]" : "text-[#9CA3AF]"
          }`}
        >
          {selected?.label || placeholder}
        </span>
        <KeyboardArrowDownIcon sx={{ fontSize: 20, color: "#9CA3AF" }} />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 z-40 mt-1.5 max-h-64 w-full overflow-auto rounded-[12px] border border-[#E5E7EB] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
          {options.map((option) => {
            const isActive = option.value === value;
            const optionLetter =
              option.avatarLetter ||
              (option.label || "?").slice(0, 1).toUpperCase();

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] leading-5 hover:bg-[#F8FAFC] ${
                  isActive
                    ? "bg-[#E6F8F5] font-semibold text-[#0F766E]"
                    : "font-medium text-[#111827]"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2F6] text-[10px] font-bold text-[#4B5563]">
                  {optionLetter}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

