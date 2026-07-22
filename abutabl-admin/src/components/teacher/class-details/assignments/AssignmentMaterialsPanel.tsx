import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import StopOutlinedIcon from "@mui/icons-material/StopOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { AssignmentMaterialItem } from "@/types/assignmentMaterials";

export type AssignmentMaterialsPanelProps = {
  materials: AssignmentMaterialItem[];
  loading?: boolean;
  disabled?: boolean;
  showHint?: boolean;
  /** stack = list rows; grid = square cards (design) */
  layout?: "stack" | "grid";
  /** When empty, show Files / Voice / Links placeholder zones (Screen #6). */
  showSectionPlaceholders?: boolean;
  isRecording?: boolean;
  onUpload?: () => void;
  onRecordVoice?: () => void;
  onAddMore?: () => void;
  onRemove?: (id: string) => void;
};

type MaterialVisual = {
  label: string;
  Icon: ComponentType<{ sx?: { fontSize?: number } }>;
  iconClass: string;
};

const resolveMaterialVisual = (item: AssignmentMaterialItem): MaterialVisual => {
  if (item.kind === "voice") {
    return {
      label: item.label || "VOICE",
      Icon: MicNoneOutlinedIcon,
      iconClass: "bg-[#F3F4F6] text-[#111827]",
    };
  }

  if (item.kind === "link") {
    return {
      label: item.label || "LINK",
      Icon: OpenInNewOutlinedIcon,
      iconClass: "bg-[#EEF2FF] text-[#4F46E5]",
    };
  }

  const ext = (item.label || item.name.split(".").pop() || "FILE")
    .trim()
    .toUpperCase();

  if (ext === "PDF") {
    return {
      label: "PDF",
      Icon: PictureAsPdfOutlinedIcon,
      iconClass: "bg-[#FEE2E2] text-[#DC2626]",
    };
  }

  if (["DOC", "DOCX", "TXT", "RTF", "ODT"].includes(ext)) {
    return {
      label: ext,
      Icon: DescriptionOutlinedIcon,
      iconClass: "bg-[#DBEAFE] text-[#2563EB]",
    };
  }

  if (["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG", "BMP"].includes(ext)) {
    return {
      label: ext,
      Icon: ImageOutlinedIcon,
      iconClass: "bg-[#FCE7F3] text-[#DB2777]",
    };
  }

  if (["MP4", "MOV", "AVI", "MKV", "WEBM"].includes(ext)) {
    return {
      label: ext,
      Icon: VideocamOutlinedIcon,
      iconClass: "bg-[#EDE9FE] text-[#7C3AED]",
    };
  }

  if (["MP3", "WAV", "M4A", "AAC", "OGG", "WEBM"].includes(ext)) {
    return {
      label: ext,
      Icon: MicNoneOutlinedIcon,
      iconClass: "bg-[#F3F4F6] text-[#111827]",
    };
  }

  return {
    label: ext.slice(0, 8) || "FILE",
    Icon: InsertDriveFileOutlinedIcon,
    iconClass: "bg-[#F3F4F6] text-[#4B5563]",
  };
};

const AssignmentMaterialsPanel = (props: AssignmentMaterialsPanelProps) => {
  const {
    materials,
    loading = false,
    disabled = false,
    showHint = true,
    layout = "grid",
    showSectionPlaceholders = false,
    isRecording = false,
    onUpload,
    onRecordVoice,
    onAddMore,
    onRemove,
  } = props;

  const { t } = useTranslation();

  const files = materials.filter((item) => item.kind === "file");
  const voices = materials.filter((item) => item.kind === "voice");
  const links = materials.filter((item) => item.kind === "link");

  const renderCard = (item: AssignmentMaterialItem) => {
    const visual = resolveMaterialVisual(item);
    const Icon = visual.Icon;

    if (layout === "stack") {
      return (
        <li
          key={item.id}
          className="relative flex flex-col gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
        >
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280] disabled:opacity-50"
              aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_REMOVE")}
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </button>
          ) : null}
          <div className="flex items-center gap-3 pr-6">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${visual.iconClass}`}
            >
              <Icon sx={{ fontSize: 22 }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                {visual.label}
              </p>
              <p className="truncate text-sm font-semibold text-[#111827]">
                {item.name}
              </p>
            </div>
          </div>
          {item.kind === "voice" && item.previewUrl ? (
            <audio
              controls
              src={item.previewUrl}
              className="w-full"
              preload="metadata"
            />
          ) : null}
        </li>
      );
    }

    return (
      <li
        key={item.id}
        className="relative flex w-[148px] shrink-0 flex-col rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.06)] sm:w-[160px]"
      >
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
            className="absolute right-1.5 top-1.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#9CA3AF] shadow-sm hover:bg-[#F3F4F6] hover:text-[#6B7280] disabled:opacity-50"
            aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_REMOVE")}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </button>
        ) : null}

        <div className="mb-3 flex items-center gap-2 pr-5">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${visual.iconClass}`}
          >
            <Icon sx={{ fontSize: 24 }} />
          </span>
          <p className="truncate text-sm font-bold uppercase tracking-wide text-[#4B5563]">
            {visual.label}
          </p>
        </div>

        <p
          className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-[#6B7280]"
          title={item.name}
        >
          {item.name}
        </p>

        {item.kind === "voice" && item.previewUrl ? (
          <audio
            controls
            src={item.previewUrl}
            className="mt-2 w-full"
            preload="metadata"
          />
        ) : null}
      </li>
    );
  };

  const emptyZone = (labelKey: string) => (
    <div className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-8 text-center text-sm text-[#6B7280]">
      {t(labelKey)}
    </div>
  );

  const listClassName =
    layout === "grid" ? "flex flex-wrap gap-3" : "space-y-3";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-base font-bold text-[#111827]">
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_MATERIALS_TITLE")}
        </h4>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onUpload?.();
            }}
            disabled={disabled || isRecording || !onUpload}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AttachFileOutlinedIcon sx={{ fontSize: 18 }} />
            {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_UPLOAD")}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRecordVoice?.();
            }}
            disabled={disabled || !onRecordVoice}
            className={`inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
              isRecording ? "text-[#DC2626]" : "text-[#2563EB]"
            }`}
          >
            {isRecording ? (
              <StopOutlinedIcon sx={{ fontSize: 18 }} />
            ) : (
              <MicNoneOutlinedIcon sx={{ fontSize: 18 }} />
            )}
            {isRecording
              ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_STOP_RECORDING")
              : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_RECORD_VOICE")}
          </button>
        </div>
      </div>

      {showHint ? (
        <p className="text-xs text-[#9CA3AF]">
          {isRecording
            ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_RECORDING_HINT")
            : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_MATERIALS_HINT")}
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-10">
          <CircularProgress size={28} sx={{ color: "#23B8A2" }} />
        </div>
      ) : showSectionPlaceholders ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_FILES")}
            </p>
            {files.length > 0 ? (
              <ul className={listClassName}>{files.map(renderCard)}</ul>
            ) : (
              emptyZone("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_FILES_EMPTY")
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_VOICE")}
            </p>
            {voices.length > 0 ? (
              <ul className={listClassName}>{voices.map(renderCard)}</ul>
            ) : (
              emptyZone("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_VOICE_EMPTY")
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_LINKS")}
            </p>
            {links.length > 0 ? (
              <ul className={listClassName}>{links.map(renderCard)}</ul>
            ) : (
              emptyZone("TEACHER_CLASS_DETAILS.ASSIGNMENTS_DETAILS_LINKS_EMPTY")
            )}
          </div>
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-10 text-center text-sm text-[#6B7280]">
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_MATERIALS_EMPTY")}
        </div>
      ) : (
        <ul className={listClassName}>{materials.map(renderCard)}</ul>
      )}

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onAddMore?.();
        }}
        disabled={disabled || isRecording || !onAddMore}
        className="h-10 cursor-pointer rounded-[10px] border border-[#23B8A2] px-5 text-sm font-semibold text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_ADD_MORE")}
      </button>
    </div>
  );
};

export default AssignmentMaterialsPanel;
