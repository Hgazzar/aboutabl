export type QuizRuntimeAttemptListItem = {
  attempt_id: number;
  quiz_id: number;
  student_id: number;
  assign_id: number | null;
  status: string;
  submitted_at: string | null;
};

export type QuizRuntimeAttemptMeta = {
  attempt_id: number;
  quiz_id: number;
  quiz_snapshot_id?: number;
  student_id: number;
  assign_id: number | null;
  status: string;
  attempt_no?: number;
  started_at?: string | null;
  ends_at?: string | null;
  row_version: number;
  submitted_at: string | null;
};

export type QuizRuntimeSnapshotQuestion = {
  snapshot_question_key: string;
  question_id: number | null;
  position: number | null;
  type: string | null;
  stem: unknown;
  question_des?: unknown;
  options: Record<string, unknown>;
  correct_key: {
    corAnswer?: unknown;
    corAnswer_image?: unknown;
    corAnswer_audio?: unknown;
  };
  max_score: number;
  explanation?: unknown;
};

export type QuizRuntimeAnswerRow = {
  question_id: number;
  snapshot_question_key: string;
  response_payload: Record<string, unknown> | null;
  is_draft: boolean;
  needs_manual: boolean;
  is_correct: boolean | null;
  auto_score: number | null;
  manual_score: number | null;
  score_awarded: number | null;
  teacher_comment: string | null;
  answered_at: string | null;
};

export type QuizShowQuestionRow = {
  info?: QuestionBankItem;
  score?: number | string | null;
  score_formate?: string | null;
};

export type QuizShowResponse = {
  status?: boolean;
  questions?: QuizShowQuestionRow[];
};

export type QuizRuntimeResultRow = {
  score: number;
  max_score: number;
  percentage: number;
  pass: boolean;
  pending_manual: boolean;
  finalized_at: string | null;
};

export type QuizRuntimeAttemptDetailResponse = {
  status?: boolean;
  attempt: QuizRuntimeAttemptMeta;
  snapshot?: {
    quiz_snapshot_id: number;
    questions: QuizRuntimeSnapshotQuestion[];
  };
  answers: QuizRuntimeAnswerRow[];
  result: QuizRuntimeResultRow | null;
};

export type QuizRuntimeAttemptsListResponse = {
  status?: boolean;
  attempts: QuizRuntimeAttemptListItem[];
};

export type QuestionBankItem = {
  id: number;
  type: string;
  question?: unknown;
  corAnswer?: unknown;
  [key: string]: unknown;
};

export type QuestionShowResponse = {
  status?: boolean;
  question?: QuestionBankItem;
};

export type RuntimeReviewQuestionView = {
  key: string;
  questionId: number | null;
  questionType: string | null;
  questionText: string;
  studentAnswerText: string;
  correctAnswerText: string | null;
  isManual: boolean;
  isCorrect: boolean | null;
  maxScore: number | null;
  scoreAwarded: number | null;
  answer: QuizRuntimeAnswerRow | null;
  snapshotQuestion: QuizRuntimeSnapshotQuestion;
};
