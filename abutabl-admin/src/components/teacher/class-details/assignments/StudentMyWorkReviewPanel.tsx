import { useState } from "react";
import { useTranslation } from "react-i18next";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import type { LearningActivitiesReviewMyWorkItem } from "@/api/classAssignmentsApi";
import {
  formatReviewMyWorkDuration,
  formatReviewMyWorkSize,
  sortedReviewMyWorkItems,
} from "./studentMyWorkReviewUtils";

const CARD_SHADOW = "0 4px 16px rgba(15, 23, 42, 0.06)";

type Props = {
  items: LearningActivitiesReviewMyWorkItem[] | null | undefined;
};

function KindIcon({ kind }: { kind: string }) {
  if (kind === "image") {
    return <ImageOutlinedIcon sx={{ fontSize: 22 }} />;
  }
  if (kind === "voice") {
    return <MicNoneOutlinedIcon sx={{ fontSize: 22 }} />;
  }
  if (kind === "document") {
    return <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />;
  }
  return <InsertDriveFileOutlinedIcon sx={{ fontSize: 22 }} />;
}

/**
 * Read-only Student My Work in Teacher Assignment Review.
 * Data comes from learning_activities/review students[].my_work — no extra fetches.
 */
export const StudentMyWorkReviewPanel = ({ items }: Props) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const ordered = sortedReviewMyWorkItems(items);

  const kindLabel = (kind: string): string => {
    const key = `ASSIGNMENTS_S9_LA_MY_WORK_KIND_${kind.toUpperCase()}`;
    const translated = t(`TEACHER_CLASS_DETAILS.${key}`);
    if (translated === `TEACHER_CLASS_DETAILS.${key}`) {
      return kind;
    }
    return translated;
  };

  const openExternal = (url: string | null) => {
    if (!url) {
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      className="rounded-[16px] border border-[#EEF0F2] bg-white p-4"
      style={{ boxShadow: CARD_SHADOW }}
      aria-labelledby="teacher-review-my-work-heading"
    >
      <h4
        id="teacher-review-my-work-heading"
        className="text-[15px] font-extrabold text-[#111827]"
      >
        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_TITLE")}
      </h4>
      <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">
        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_HINT")}
      </p>

      {ordered.length === 0 ? (
        <p className="mt-3 text-[13px] font-semibold text-[#9CA3AF]">
          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_EMPTY")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {ordered.map((item) => {
            const sizeLabel = formatReviewMyWorkSize(item.size_bytes);
            const durationLabel =
              item.kind === "voice"
                ? formatReviewMyWorkDuration(item.duration_ms)
                : null;
            const name =
              item.original_filename ||
              kindLabel(String(item.kind));

            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-[12px] border border-[#F3F4F6] bg-[#F9FAFB] p-3 sm:flex-row sm:items-center"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F8F5] text-[#0F766E]">
                  <KindIcon kind={String(item.kind)} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-[#111827]">
                    {name}
                  </p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#6B7280]">
                    {kindLabel(String(item.kind))}
                    {sizeLabel ? ` · ${sizeLabel}` : ""}
                    {durationLabel ? ` · ${durationLabel}` : ""}
                  </p>
                  {item.kind === "voice" && item.url ? (
                    <audio
                      className="mt-2 h-8 max-w-full"
                      controls
                      preload="none"
                      src={item.url}
                    >
                      {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_PLAY")}
                    </audio>
                  ) : null}
                  {item.kind === "image" && item.url && previewUrl === item.url ? (
                    <div className="mt-2 overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white p-2">
                      <img
                        src={item.url}
                        alt={name}
                        className="mx-auto max-h-64 w-auto max-w-full object-contain"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.kind === "image" && item.url ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewUrl((current) =>
                          current === item.url ? null : item.url
                        )
                      }
                      className="text-[13px] font-semibold text-[#00A68A] hover:underline"
                    >
                      {previewUrl === item.url
                        ? t(
                            "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_HIDE_PREVIEW"
                          )
                        : t(
                            "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_VIEW"
                          )}
                    </button>
                  ) : null}
                  {item.kind === "document" && item.url ? (
                    <button
                      type="button"
                      onClick={() => openExternal(item.url)}
                      className="text-[13px] font-semibold text-[#00A68A] hover:underline"
                    >
                      {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_OPEN")}
                    </button>
                  ) : null}
                  {item.kind === "image" && item.url ? (
                    <button
                      type="button"
                      onClick={() => openExternal(item.url)}
                      className="text-[13px] font-semibold text-[#6B7280] hover:underline"
                    >
                      {t(
                        "TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_LA_MY_WORK_OPEN_NEW_TAB"
                      )}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default StudentMyWorkReviewPanel;
