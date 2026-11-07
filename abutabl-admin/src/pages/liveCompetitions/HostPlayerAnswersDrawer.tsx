import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import {
  fetchLiveCompetitionPlayerAnswers,
  type LiveCompetitionPlayerAnswerAttempt,
  type LiveCompetitionPlayerAnswersReview,
  type LiveCompetitionPlayerAnswerQuestion,
} from "@/api/liveCompetitionsTeacherApi";
import { buildDemoPlayerAnswersReview } from "./hostBoardDemo";
import {
  TD_GREEN,
  tdCircularProgressSx,
  tdContainedButtonSx,
  tdOutlinedButtonSx,
} from "./teacherLiveTokens";
import styles from "./liveCompetitions.module.css";

type Props = {
  open: boolean;
  sessionId: number;
  studentId: number | null;
  isDemo?: boolean;
  onClose: () => void;
};

function attemptFlags(
  attempt: LiveCompetitionPlayerAnswerAttempt,
  t: (key: string) => string
): string[] {
  const flags: string[] = [];
  if (attempt.timed_out) {
    flags.push(t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_TIMED_OUT"));
  }
  if (attempt.is_retry) {
    flags.push(t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_RETRY"));
  }
  if (attempt.is_reinforce) {
    flags.push(t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_REINFORCE"));
  }
  return flags;
}

function QuestionBlock({
  question,
  index,
}: {
  question: LiveCompetitionPlayerAnswerQuestion;
  index: number;
}) {
  const { t } = useTranslation();
  const statusClass = !question.answered
    ? styles.reviewQUnanswered
    : question.ever_correct
      ? styles.reviewQCorrect
      : styles.reviewQWrong;

  return (
    <article
      className={`${styles.reviewQuestion} ${statusClass}`}
      data-testid={`host-review-question-${question.id}`}
    >
      <header className={styles.reviewQuestionHeader}>
        <span className={styles.reviewQuestionIndex}>
          {t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_Q_INDEX", {
            n: index + 1,
          })}
        </span>
        <span className={styles.reviewQuestionStatus} data-testid={`host-review-q-status-${question.id}`}>
          {!question.answered
            ? t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_UNANSWERED")
            : question.ever_correct
              ? t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_EVER_CORRECT")
              : t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_INCORRECT")}
        </span>
      </header>
      <p className={styles.reviewQuestionText}>
        {question.question ||
          t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_QUESTION_FALLBACK")}
      </p>
      <p className={styles.reviewCorrectAnswer}>
        {t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_CORRECT_ANSWER", {
          answer: question.correct_answer,
        })}
      </p>
      {question.attempts.length === 0 ? (
        <p className={styles.reviewAttemptEmpty}>
          {t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_NO_ATTEMPTS")}
        </p>
      ) : (
        <ul className={styles.reviewAttempts}>
          {question.attempts.map((attempt) => {
            const flags = attemptFlags(attempt, t);
            return (
              <li
                key={attempt.id}
                className={
                  attempt.correct
                    ? styles.reviewAttemptCorrect
                    : styles.reviewAttemptWrong
                }
                data-testid={`host-review-attempt-${attempt.id}`}
              >
                <div className={styles.reviewAttemptMain}>
                  <strong>
                    {t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_ATTEMPT_N", {
                      n: attempt.attempt,
                    })}
                  </strong>
                  <span>{attempt.answer}</span>
                  <span>
                    {attempt.correct
                      ? t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_OK")
                      : t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_MISS")}
                  </span>
                </div>
                <div className={styles.reviewAttemptMeta}>
                  {attempt.elapsed_ms != null
                    ? t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_ELAPSED", {
                        s: (Number(attempt.elapsed_ms) / 1000).toFixed(1),
                      })
                    : null}
                  {flags.length ? ` · ${flags.join(" · ")}` : null}
                  {attempt.coins_delta
                    ? ` · ${t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_COINS_DELTA", {
                        n: attempt.coins_delta,
                      })}`
                    : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

export default function HostPlayerAnswersDrawer({
  open,
  sessionId,
  studentId,
  isDemo = false,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<LiveCompetitionPlayerAnswersReview | null>(
    null
  );

  const load = useCallback(async () => {
    if (!open || studentId == null) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isDemo) {
        const demo = buildDemoPlayerAnswersReview(studentId);
        if (!demo) {
          throw new Error(
            t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_LOAD_ERROR")
          );
        }
        setReview(demo);
        return;
      }
      if (!sessionId) {
        throw new Error(t("TEACHER_LIVE_COMPETITIONS.HOST_INVALID_SESSION"));
      }
      const res = await fetchLiveCompetitionPlayerAnswers(sessionId, studentId);
      if (!res?.status || !res.review) {
        throw new Error(
          res?.msg || t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_LOAD_ERROR")
        );
      }
      setReview(res.review);
    } catch (err: unknown) {
      setReview(null);
      setError(
        err instanceof Error
          ? err.message
          : t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_LOAD_ERROR")
      );
    } finally {
      setLoading(false);
    }
    // t from i18n is stable in production; omit from deps to avoid remount loops in tests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, open, sessionId, studentId]);

  useEffect(() => {
    if (!open) {
      setReview(null);
      setError("");
      setLoading(false);
      return;
    }
    void load();
  }, [load, open]);

  const anchor = i18n.dir() === "rtl" ? "left" : "right";
  const titleName =
    review?.student?.name ||
    (studentId != null ? `#${studentId}` : t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_TITLE"));

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      PaperProps={{
        className: styles.reviewDrawerPaper,
        "data-testid": "host-answers-drawer",
      }}
    >
      <div className={styles.reviewDrawerHeader}>
        <div>
          <Typography
            component="h2"
            className={styles.reviewDrawerTitle}
            data-testid="host-review-title"
          >
            {t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_TITLE")}
          </Typography>
          <Typography
            className={styles.reviewDrawerSubtitle}
            data-testid="host-review-student"
          >
            {titleName}
          </Typography>
        </div>
        <IconButton
          aria-label={t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_CLOSE")}
          onClick={onClose}
          data-testid="host-review-close"
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className={styles.reviewDrawerBody}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress
              sx={tdCircularProgressSx}
              data-testid="host-review-loading"
            />
          </Box>
        ) : null}

        {!loading && error ? (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }} data-testid="host-review-error">
              {error}
            </Alert>
            <Button
              variant="contained"
              sx={tdContainedButtonSx}
              onClick={() => void load()}
              data-testid="host-review-retry"
            >
              {t("TEACHER_LIVE_COMPETITIONS.HOST_RETRY")}
            </Button>
          </Box>
        ) : null}

        {!loading && !error && review ? (
          <>
            <div className={styles.reviewStats} data-testid="host-review-stats">
              <div className={styles.reviewStat}>
                <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_RANK")}</span>
                <b>{review.player.rank ?? "—"}</b>
              </div>
              <div className={styles.reviewStat}>
                <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_SCORE")}</span>
                <b>{review.player.score}</b>
              </div>
              <div className={styles.reviewStat}>
                <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_COINS")}</span>
                <b>{review.player.coins}</b>
              </div>
              <div className={styles.reviewStat}>
                <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_STREAK")}</span>
                <b>{review.player.streak}</b>
              </div>
            </div>

            {review.questions.length === 0 ? (
              <p className={styles.waitCopyMeta} data-testid="host-review-empty">
                {t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_EMPTY")}
              </p>
            ) : (
              <div className={styles.reviewQuestionList}>
                {review.questions.map((question, index) => (
                  <QuestionBlock
                    key={question.id}
                    question={question}
                    index={index}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className={styles.reviewDrawerFooter}>
        <Button
          variant="outlined"
          sx={tdOutlinedButtonSx}
          onClick={onClose}
          data-testid="host-review-done"
        >
          {t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_CLOSE")}
        </Button>
        <span style={{ color: TD_GREEN, fontSize: "0.75rem", fontWeight: 600 }}>
          {t("TEACHER_LIVE_COMPETITIONS.HOST_REVIEW_HINT")}
        </span>
      </div>
    </Drawer>
  );
}
