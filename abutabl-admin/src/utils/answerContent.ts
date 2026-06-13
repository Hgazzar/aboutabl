/** For list/table cells: show readable text instead of raw HTML from Quill. */
export function stripHtmlToPlainText(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const withoutTags = s.replace(/<[^>]*>/g, " ");
  return withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize API question field (string or `{ text }`) then strip tags for table labels. */
export function questionFieldToPlainLabel(raw: unknown): string {
  const s =
    raw == null
      ? ""
      : typeof raw === "string"
      ? raw
      : typeof raw === "object" &&
          raw !== null &&
          "text" in (raw as Record<string, unknown>)
        ? String((raw as { text: unknown }).text ?? "")
        : String(raw);
  return stripHtmlToPlainText(s);
}

/** Embedded media URL in answer text (comma-separated or single URL). */
const MEDIA_IN_STRING =
  /\.(mp3|m4a|wav|aac|flac|ogg|webm|png|jpe?g|gif|webp|mp4|mkv|avi)(\?|#|$)/i;

export function stringLooksLikeMediaUrl(raw: unknown): boolean {
  return MEDIA_IN_STRING.test(String(raw ?? ""));
}

/**
 * Rich-text answers (e.g. Quill) can be truthy strings like "<p><br></p>" that look empty.
 * Use this instead of Boolean(a) when building MCQ option lists for the preview.
 */
export function answerHasRenderableContent(raw: unknown): boolean {
  const s = String(raw ?? "").trim();
  if (!s) return false;
  if (MEDIA_IN_STRING.test(s)) {
    return true;
  }
  const withoutTags = s.replace(/<[^>]*>/g, " ");
  const text = withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

/** Show MCQ row if option text has content, or API attached audio/image for that slot. */
export function mcqOptionRowShouldShow(
  item: unknown,
  optionNum: number,
  active?: Record<string, unknown> | null
): boolean {
  if (answerHasRenderableContent(item)) return true;
  if (!active) return false;
  const audio = active[`answer${optionNum}_audio`];
  const image = active[`answer${optionNum}_image`];
  const has = (v: unknown) => v != null && String(v).trim() !== "";
  return has(audio) || has(image);
}

/**
 * Whether this MCQ option is the correct one. `corAnswer` from API may be
 * option index ("2"), form field key ("answer2"), or the full option text.
 */
export function mcqOptionIsCorrect(
  corAnswer: unknown,
  optionNum: number,
  optionItem: string
): boolean {
  if (corAnswer == null || corAnswer === "") return false;
  const parts = String(corAnswer)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const numStr = String(optionNum);
  const answerKey = `answer${optionNum}`;
  return parts.some((p) => {
    if (p === numStr || p === answerKey) return true;
    if (optionItem && p === optionItem) return true;
    if (Number(p) === optionNum) return true;
    return false;
  });
}
