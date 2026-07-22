import {
  QuestionBankItem,
  QuizRuntimeSnapshotQuestion,
} from "@/types/quizRuntime";

const MANUAL_TYPES = new Set(["essay", "shn", "upload"]);

export const formatRichContent = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "string") {
    try {
      return formatRichContent(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((part) => {
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return String(part ?? "");
      })
      .filter((part) => part.trim() !== "");
    return parts.length > 0 ? parts.join(" ") : "—";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

export const isManualQuestionType = (
  type: string | null | undefined,
  needsManual: boolean
): boolean => {
  if (needsManual) {
    return true;
  }
  const key = (type ?? "").trim().toLowerCase();
  return MANUAL_TYPES.has(key);
};

const optionToIndex = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number" && value >= 1 && value <= 8) {
    return value;
  }
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) {
      const n = Number(value);
      return n >= 1 && n <= 8 ? n : null;
    }
    const match = /^answer(\d+)$/i.exec(value.trim());
    if (match) {
      const n = Number(match[1]);
      return n >= 1 && n <= 8 ? n : null;
    }
  }
  return null;
};

export const readMcqSelectedIndices = (
  payload: Record<string, unknown> | null
): number[] => {
  if (!payload) {
    return [];
  }
  const raw =
    payload.selected ??
    payload.value ??
    payload.answers ??
    payload.answer ??
    null;
  if (raw === null) {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [raw];
  const out = list
    .map((item) => optionToIndex(item))
    .filter((item): item is number => item != null);
  return Array.from(new Set(out)).sort((a, b) => a - b);
};

export const snapshotQuestionToDisplayShape = (
  question: QuizRuntimeSnapshotQuestion
): QuestionBankItem => {
  const options = question.options ?? {};
  const display: QuestionBankItem = {
    id: question.question_id ?? 0,
    type: question.type ?? "",
    question: question.stem,
    corAnswer: question.correct_key?.corAnswer,
  };

  for (let i = 1; i <= 8; i += 1) {
    const key = `answer${i}`;
    if (options[key] !== undefined) {
      display[key] = options[key];
    }
    const imageKey = `answer${i}_image`;
    const audioKey = `answer${i}_audio`;
    if (options[imageKey] !== undefined) {
      display[imageKey] = options[imageKey];
    }
    if (options[audioKey] !== undefined) {
      display[audioKey] = options[audioKey];
    }
  }

  return display;
};

export const formatSnapshotStem = (question: QuizRuntimeSnapshotQuestion): string =>
  formatRichContent(question.stem);

export const formatMcqOptionText = (
  question: QuestionBankItem | null,
  index: number
): string => {
  if (!question) {
    return `Option ${index}`;
  }
  const key = `answer${index}`;
  return formatRichContent(question[key]);
};

export const formatStudentAnswer = (
  question: QuestionBankItem | null,
  payload: Record<string, unknown> | null
): string => {
  if (!payload) {
    return "—";
  }
  const type = (question?.type ?? "").toLowerCase();
  if (type === "mcq") {
    const indices = readMcqSelectedIndices(payload);
    if (indices.length === 0) {
      return formatRichContent(payload);
    }
    return indices
      .map((index) => formatMcqOptionText(question, index))
      .join(", ");
  }
  if (type === "tf") {
    const raw =
      payload.value ?? payload.selected ?? payload.answer ?? payload.text;
    return formatRichContent(raw);
  }
  const text =
    payload.text ??
    payload.value ??
    payload.answer ??
    payload.content ??
    payload.response;
  if (text !== undefined) {
    return formatRichContent(text);
  }
  return formatRichContent(payload);
};

export const formatCorrectAnswer = (
  question: QuestionBankItem | null
): string | null => {
  if (!question) {
    return null;
  }
  const type = (question.type ?? "").toLowerCase();
  if (type === "mcq") {
    const cor = question.corAnswer;
    const indices: number[] = [];
    if (Array.isArray(cor)) {
      cor.forEach((part) => {
        const index = optionToIndex(part);
        if (index != null) {
          indices.push(index);
        }
      });
    } else {
      String(cor ?? "")
        .split(",")
        .map((part) => part.trim())
        .forEach((part) => {
          const index = optionToIndex(part);
          if (index != null) {
            indices.push(index);
          }
        });
    }
    if (indices.length === 0) {
      return formatRichContent(cor);
    }
    return Array.from(new Set(indices))
      .sort((a, b) => a - b)
      .map((index) => formatMcqOptionText(question, index))
      .join(", ");
  }
  return formatRichContent(question.corAnswer);
};

export const readMcqCorrectIndices = (
  question: QuestionBankItem | null
): number[] => {
  if (!question) {
    return [];
  }
  const cor = question.corAnswer;
  const indices: number[] = [];
  if (Array.isArray(cor)) {
    cor.forEach((part) => {
      const index = optionToIndex(part);
      if (index != null) {
        indices.push(index);
      }
    });
  } else {
    String(cor ?? "")
      .split(",")
      .map((part) => part.trim())
      .forEach((part) => {
        const index = optionToIndex(part);
        if (index != null) {
          indices.push(index);
        }
      });
  }
  return Array.from(new Set(indices)).sort((a, b) => a - b);
};

export type McqOptionView = {
  index: number;
  label: string;
  imageUrl: string | null;
};

export const listMcqOptionsFromSnapshot = (
  question: QuizRuntimeSnapshotQuestion
): McqOptionView[] => {
  const display = snapshotQuestionToDisplayShape(question);
  const options = question.options ?? {};
  const out: McqOptionView[] = [];
  for (let i = 1; i <= 8; i += 1) {
    const key = `answer${i}`;
    if (options[key] === undefined && display[key] === undefined) {
      continue;
    }
    const imageKey = `answer${i}_image`;
    const imageRaw = options[imageKey] ?? display[imageKey];
    out.push({
      index: i,
      label: formatMcqOptionText(display, i),
      imageUrl:
        typeof imageRaw === "string" && imageRaw.trim() !== "" ? imageRaw : null,
    });
  }
  return out;
};

export type SnapshotMediaItem = {
  kind: "image" | "audio" | "file";
  label: string;
  url: string;
};

const isUrlString = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim());

export const collectSnapshotMedia = (
  question: QuizRuntimeSnapshotQuestion
): SnapshotMediaItem[] => {
  const options = question.options ?? {};
  const correctKey = question.correct_key ?? {};
  const items: SnapshotMediaItem[] = [];

  const push = (kind: SnapshotMediaItem["kind"], label: string, raw: unknown) => {
    if (isUrlString(raw)) {
      items.push({ kind, label, url: raw.trim() });
    }
  };

  push("image", "Question image", options.question_image);
  push("audio", "Question audio", options.question_audio);
  push("image", "Correct answer image", correctKey.corAnswer_image);
  push("audio", "Correct answer audio", correctKey.corAnswer_audio);

  for (let i = 1; i <= 8; i += 1) {
    push("image", `Option ${i} image`, options[`answer${i}_image`]);
    push("audio", `Option ${i} audio`, options[`answer${i}_audio`]);
  }

  return items;
};

export type MatchingPairView = {
  left: string;
  right: string;
};

export const listMatchingPairsFromPayload = (
  payload: Record<string, unknown> | null
): MatchingPairView[] => {
  if (!payload) {
    return [];
  }
  const raw =
    payload.pairs ??
    payload.matching ??
    payload.value ??
    payload.selected ??
    null;
  if (raw === null) {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [raw];
  const pairs: MatchingPairView[] = [];
  list.forEach((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const left = (item as { left?: unknown; 0?: unknown }).left ?? (item as { 0?: unknown })[0];
      const right = (item as { right?: unknown; 1?: unknown }).right ?? (item as { 1?: unknown })[1];
      if (left != null && right != null) {
        pairs.push({
          left: formatRichContent(left),
          right: formatRichContent(right),
        });
      }
      return;
    }
    const text = String(item ?? "");
    const separator = text.includes(":") ? ":" : text.includes("|") ? "|" : null;
    if (!separator) {
      return;
    }
    const [left, right] = text.split(separator);
    if (left && right) {
      pairs.push({
        left: left.trim(),
        right: right.trim(),
      });
    }
  });
  return pairs;
};

export const listOrderingItemsFromPayload = (
  payload: Record<string, unknown> | null
): string[] => {
  if (!payload) {
    return [];
  }
  const raw =
    payload.order ??
    payload.ordering ??
    payload.items ??
    payload.sequence ??
    payload.value ??
    null;
  if (raw === null) {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((item) => formatRichContent(item)).filter((item) => item !== "—");
};

export const listFillBlankValuesFromPayload = (
  payload: Record<string, unknown> | null
): string[] => {
  if (!payload) {
    return [];
  }
  const raw =
    payload.blanks ??
    payload.fill_blanks ??
    payload.answers ??
    payload.value ??
    null;
  if (raw === null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.map((item) => formatRichContent(item)).filter((item) => item !== "—");
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, value]) => formatRichContent(value))
      .filter((item) => item !== "—");
  }
  return [formatRichContent(raw)].filter((item) => item !== "—");
};

export const normalizeTfDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }
  const key = String(value).trim().toLowerCase();
  if (["1", "true", "t", "yes"].includes(key)) {
    return "True";
  }
  if (["0", "false", "f", "no"].includes(key)) {
    return "False";
  }
  return formatRichContent(value);
};

export const formatAttemptDuration = (
  startedAt: string | null | undefined,
  submittedAt: string | null | undefined
): string | null => {
  if (!startedAt || !submittedAt) {
    return null;
  }
  const start = Date.parse(startedAt);
  const end = Date.parse(submittedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  const totalSeconds = Math.floor((end - start) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};
