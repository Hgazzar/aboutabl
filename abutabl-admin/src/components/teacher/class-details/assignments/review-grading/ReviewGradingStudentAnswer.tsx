import { RuntimeReviewQuestionView } from "@/types/quizRuntime";
import {
  formatRichContent,
  formatStudentAnswer,
  listFillBlankValuesFromPayload,
  listMatchingPairsFromPayload,
  listMcqOptionsFromSnapshot,
  listOrderingItemsFromPayload,
  normalizeTfDisplay,
  readMcqCorrectIndices,
  readMcqSelectedIndices,
  snapshotQuestionToDisplayShape,
} from "@/utils/quizRuntimeDisplay";
import { useTranslation } from "react-i18next";

export type ReviewGradingStudentAnswerProps = {
  row: RuntimeReviewQuestionView;
};

export const ReviewGradingStudentAnswer = ({
  row,
}: ReviewGradingStudentAnswerProps) => {
  const { t } = useTranslation();
  const type = (row.questionType ?? "").trim().toLowerCase();
  const payload = row.answer?.response_payload ?? null;
  const displayQuestion = snapshotQuestionToDisplayShape(row.snapshotQuestion);

  if (!row.answer) {
    return (
      <p className="text-sm italic text-[#9CA3AF]">
        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_S9_RUNTIME_RESULT_UNANSWERED")}
      </p>
    );
  }

  if (type === "mcq") {
    const selected = readMcqSelectedIndices(payload);
    const options = listMcqOptionsFromSnapshot(row.snapshotQuestion);
    if (options.length === 0) {
      return (
        <p className="text-sm text-[#374151]">
          {formatStudentAnswer(displayQuestion, payload)}
        </p>
      );
    }
    return (
      <ul className="space-y-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.index);
          return (
            <li
              key={option.index}
              className={`rounded-[12px] border px-3 py-2.5 text-sm ${
                isSelected
                  ? "border-[#23B8A2] bg-[#E6F8F5] font-semibold text-[#0F766E]"
                  : "border-[#EEF0F2] bg-white text-[#374151]"
              }`}
            >
              <span className="mr-2 text-[12px] font-bold text-[#9CA3AF]">
                {String.fromCharCode(64 + option.index)}
              </span>
              {option.label}
              {option.imageUrl ? (
                <img
                  src={option.imageUrl}
                  alt=""
                  className="mt-2 max-h-40 rounded-[8px] object-contain"
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  if (type === "tf") {
    const raw =
      payload?.value ?? payload?.selected ?? payload?.answer ?? null;
    const selected = normalizeTfDisplay(raw);
    const options = ["True", "False"];
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <span
              key={option}
              className={`inline-flex min-w-[100px] items-center justify-center rounded-[12px] border px-4 py-2.5 text-sm font-semibold ${
                isSelected
                  ? "border-[#23B8A2] bg-[#E6F8F5] text-[#0F766E]"
                  : "border-[#EEF0F2] bg-white text-[#6B7280]"
              }`}
            >
              {option}
            </span>
          );
        })}
      </div>
    );
  }

  if (type === "matching") {
    const pairs = listMatchingPairsFromPayload(payload);
    if (pairs.length === 0) {
      return (
        <p className="text-sm text-[#374151]">
          {formatStudentAnswer(displayQuestion, payload)}
        </p>
      );
    }
    return (
      <ul className="space-y-2">
        {pairs.map((pair, index) => (
          <li
            key={`${pair.left}-${pair.right}-${index}`}
            className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#EEF0F2] bg-white px-3 py-2.5 text-sm text-[#374151]"
          >
            <span className="font-semibold text-[#111827]">{pair.left}</span>
            <span className="text-[#9CA3AF]">→</span>
            <span>{pair.right}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (type === "ordering") {
    const items = listOrderingItemsFromPayload(payload);
    if (items.length === 0) {
      return (
        <p className="text-sm text-[#374151]">
          {formatStudentAnswer(displayQuestion, payload)}
        </p>
      );
    }
    return (
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-3 rounded-[12px] border border-[#EEF0F2] bg-white px-3 py-2.5 text-sm text-[#374151]"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[12px] font-bold text-[#6B7280]">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (type === "fill blank" || type === "fill_blank") {
    const blanks = listFillBlankValuesFromPayload(payload);
    if (blanks.length === 0) {
      return (
        <p className="text-sm text-[#374151]">
          {formatStudentAnswer(displayQuestion, payload)}
        </p>
      );
    }
    return (
      <ul className="space-y-2">
        {blanks.map((blank, index) => (
          <li
            key={`${blank}-${index}`}
            className="rounded-[12px] border border-[#EEF0F2] bg-white px-3 py-2.5 text-sm text-[#374151]"
          >
            <span className="mr-2 text-[12px] font-bold text-[#9CA3AF]">
              {index + 1}.
            </span>
            {blank}
          </li>
        ))}
      </ul>
    );
  }

  if (row.isManual) {
    return (
      <p className="text-sm font-bold leading-snug text-[#111827] whitespace-pre-wrap">
        {formatStudentAnswer(displayQuestion, payload)}
      </p>
    );
  }

  return (
    <p className="text-sm text-[#374151]">
      {formatStudentAnswer(displayQuestion, payload)}
    </p>
  );
};

export type ReviewGradingCorrectAnswerProps = {
  row: RuntimeReviewQuestionView;
};

export const ReviewGradingCorrectAnswer = ({
  row,
}: ReviewGradingCorrectAnswerProps) => {
  const type = (row.questionType ?? "").trim().toLowerCase();
  const displayQuestion = snapshotQuestionToDisplayShape(row.snapshotQuestion);

  if (row.isManual || !row.correctAnswerText) {
    return null;
  }

  if (type === "mcq") {
    const correctIndices = readMcqCorrectIndices(displayQuestion);
    const options = listMcqOptionsFromSnapshot(row.snapshotQuestion);
    const correctOptions =
      correctIndices.length > 0
        ? options.filter((option) => correctIndices.includes(option.index))
        : options.filter((option) =>
            row.correctAnswerText?.includes(option.label)
          );

    if (correctOptions.length === 0) {
      return (
        <p className="text-sm font-medium text-[#047857]">
          {row.correctAnswerText}
        </p>
      );
    }

    return (
      <ul className="space-y-2">
        {correctOptions.map((option) => (
          <li
            key={option.index}
            className="rounded-[12px] border border-[#A7F3D0] bg-white/70 px-3 py-2.5 text-sm font-medium text-[#047857]"
          >
            {option.label}
          </li>
        ))}
      </ul>
    );
  }

  if (type === "tf") {
    return (
      <p className="text-sm font-semibold text-[#047857]">
        {normalizeTfDisplay(displayQuestion.corAnswer)}
      </p>
    );
  }

  if (type === "matching") {
    const cor = displayQuestion.corAnswer;
    const pairs = listMatchingPairsFromPayload(
      typeof cor === "object" && cor !== null && !Array.isArray(cor)
        ? (cor as Record<string, unknown>)
        : { value: cor }
    );
    if (pairs.length > 0) {
      return (
        <ul className="space-y-2">
          {pairs.map((pair, index) => (
            <li
              key={`${pair.left}-${index}`}
              className="text-sm font-medium text-[#047857]"
            >
              {pair.left} → {pair.right}
            </li>
          ))}
        </ul>
      );
    }
  }

  return (
    <p className="text-sm font-medium text-[#047857]">
      {formatRichContent(row.correctAnswerText)}
    </p>
  );
};

export default ReviewGradingStudentAnswer;
