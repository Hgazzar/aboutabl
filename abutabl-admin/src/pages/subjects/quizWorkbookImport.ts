import { isAdminUser } from "@/utils/authSession";

export const QUIZ_WORKBOOK_TEMPLATE_PATH = "/quiz.xlsx";

export function showQuizWorkbookNav(
  user: Record<string, unknown> | null | undefined,
  hasAddQuestions: boolean
): boolean {
  return Boolean(hasAddQuestions) && isAdminUser(user);
}

export const WORKBOOK_HEADERS = [
  "subject",
  "Unit",
  "lesson",
  "Question Type",
  "Title ",
  "Audio Primary Question Head",
  "Text Primary Question Head",
  "Audio Primary Question Content",
  "Image Primary Question Content",
  "Text Primary Question Content",
  "Audio Secondary Question Head",
  "Text Secondary Question Head",
  "Correct Answer",
  "Answer1 Audio",
  "Answer1 Image",
  "Answer1 Text",
  "Answer2 Audio",
  "Answer2 Image",
  "Answer2 Text",
  "Answer3 Audio",
  "Answer3 Image",
  "Answer3 Text",
  "Answer4 Audio",
  "Answer4 Image",
  "Answer4 Text",
  "Standard Code",
] as const;

const MEDIA_BY_HEADER: Record<number, string> = {
  5: "primary_head_audio",
  7: "primary_content_audio",
  8: "primary_content_image",
  10: "secondary_head_audio",
  13: "answer1_audio",
  14: "answer1_image",
  16: "answer2_audio",
  17: "answer2_image",
  19: "answer3_audio",
  20: "answer3_image",
  22: "answer4_audio",
  23: "answer4_image",
};

export type WorkbookDecision = "skip" | "create_new";

export type MediaRef = {
  reference?: string | null;
  file_management_id?: number | null;
  resolved_url?: string | null;
};

export type WorkbookFields = {
  subject_id?: number | null;
  unit_id?: number | null;
  lesson_id?: number | null;
  type?: string | null;
  import_title?: string | null;
  question?: string | null;
  corAnswer?: string | null;
  answer1?: string | null;
  answer2?: string | null;
  answer3?: string | null;
  answer4?: string | null;
  code?: string | null;
  primary_head_text?: string | null;
  primary_content_text?: string | null;
  secondary_head_text?: string | null;
  media?: Record<string, MediaRef>;
};

export type PreviewRow = {
  row: number;
  status: string;
  errors?: string[];
  duplicate_of?: number | null;
  duplicate_of_row?: number | null;
  fields?: WorkbookFields;
};

export type PreviewPayload = {
  valid?: boolean;
  file_errors?: string[];
  rows?: PreviewRow[];
};

export type ImportResult = {
  written?: boolean;
  created?: { row: number; question_id: number }[];
  skipped?: number[];
  rows?: PreviewRow[];
  file_errors?: string[];
  quiz_id?: number | null;
};

export function cellForHeader(fields: WorkbookFields | undefined, index: number): string {
  if (!fields) return "";
  const mediaKey = MEDIA_BY_HEADER[index];
  if (mediaKey) {
    return fields.media?.[mediaKey]?.reference ?? "";
  }
  const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));
  switch (index) {
    case 0:
      return text(fields.subject_id);
    case 1:
      return text(fields.unit_id);
    case 2:
      return text(fields.lesson_id);
    case 3:
      return text(fields.type);
    case 4:
      return text(fields.import_title);
    case 6:
      return text(fields.primary_head_text);
    case 9:
      return text(fields.primary_content_text);
    case 11:
      return text(fields.secondary_head_text);
    case 12:
      return text(fields.corAnswer);
    case 15:
      return text(fields.answer1);
    case 18:
      return text(fields.answer2);
    case 21:
      return text(fields.answer3);
    case 24:
      return text(fields.answer4);
    case 25:
      return text(fields.code);
    default:
      return "";
  }
}

export function canCommit(
  preview: PreviewPayload | null,
  decisions: Record<number, WorkbookDecision | "">
): boolean {
  if (!preview || preview.valid !== true || !Array.isArray(preview.rows)) {
    return false;
  }
  if (preview.rows.length === 0) {
    return false;
  }
  return preview.rows.every((row) => {
    if (row.status === "error") return false;
    if (row.status === "duplicate") {
      return decisions[row.row] === "skip" || decisions[row.row] === "create_new";
    }
    return true;
  });
}

export function decisionsPayload(
  rows: PreviewRow[],
  decisions: Record<number, WorkbookDecision | "">
): { row: number; decision: WorkbookDecision }[] {
  return rows
    .filter(
      (row) =>
        row.status === "duplicate" &&
        (decisions[row.row] === "skip" || decisions[row.row] === "create_new")
    )
    .map((row) => ({
      row: row.row,
      decision: decisions[row.row] as WorkbookDecision,
    }));
}

export function workbookFormData(
  file: File,
  decisions?: { row: number; decision: WorkbookDecision }[],
  activityLessonId?: number
): FormData {
  const body = new FormData();
  body.append("file", file);
  if (decisions) {
    body.append("decisions", JSON.stringify(decisions));
  }
  if (activityLessonId) {
    body.append("activity_lesson_id", String(activityLessonId));
  }
  return body;
}
