import { postFormRequest } from "../../utils/fetchMethods";
import {
  ImportResult,
  PreviewPayload,
  WorkbookDecision,
  workbookFormData,
} from "./quizWorkbookImport";

export async function previewQuizWorkbook(file: File): Promise<{
  msg?: string;
  preview?: PreviewPayload;
}> {
  const data = await postFormRequest(workbookFormData(file), "/api/quiz_workbook/preview");
  return data;
}

export async function commitQuizWorkbook(
  file: File,
  decisions: { row: number; decision: WorkbookDecision }[],
  activityLessonId?: number
): Promise<{ msg?: string; import_result?: ImportResult }> {
  const data = await postFormRequest(
    workbookFormData(file, decisions, activityLessonId),
    "/api/quiz_workbook/commit"
  );
  return data;
}
