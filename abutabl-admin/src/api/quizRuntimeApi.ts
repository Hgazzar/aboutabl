import { getRequest, postRequest } from "@/utils/fetchMethods";
import {
  QuizRuntimeAttemptDetailResponse,
  QuizRuntimeAttemptsListResponse,
} from "@/types/quizRuntime";

export const fetchQuizRuntimeAttempts = async (params: {
  assign_id: number;
  student_id: number;
  /** Optional — scopes to one quiz inside a Multi-Activity assign. */
  quiz_id?: number;
}): Promise<QuizRuntimeAttemptsListResponse> => {
  return getRequest(params, "/api/quiz-runtime/attempts") as Promise<
    QuizRuntimeAttemptsListResponse
  >;
};

export const fetchQuizRuntimeAttempt = async (
  attemptId: number
): Promise<QuizRuntimeAttemptDetailResponse> => {
  return getRequest(
    {},
    `/api/quiz-runtime/attempts/${attemptId}`
  ) as Promise<QuizRuntimeAttemptDetailResponse>;
};

export const submitQuizManualGrade = async (
  attemptId: number,
  body: {
    row_version: number;
    grades: Array<{
      question_id?: number;
      snapshot_question_key?: string;
      manual_score: number;
      comment?: string;
    }>;
  }
) => {
  return postRequest(body, `/api/quiz-runtime/attempts/${attemptId}/manual-grade`);
};

export const submitQuizRegrade = async (
  attemptId: number,
  body: { mode?: string; reason?: string }
) => {
  return postRequest(body, `/api/quiz-runtime/attempts/${attemptId}/regrade`);
};
