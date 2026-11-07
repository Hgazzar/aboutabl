import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import {
  cancelLiveCompetitionLobby,
  endLiveCompetitionSession,
  fetchLiveCompetitionHost,
  type LiveCompetitionHardestQuestion,
  type LiveCompetitionHostPayload,
  type LiveCompetitionHostPlayer,
  type LiveCompetitionHostTeam,
} from "@/api/liveCompetitionsTeacherApi";
import HostPlayerAnswersDrawer from "./HostPlayerAnswersDrawer";
import { TeacherLivePageShell } from "./TeacherLivePageShell";
import {
  TD_GREEN,
  tdCircularProgressSx,
  tdContainedButtonSx,
  tdOutlinedButtonSx,
} from "./teacherLiveTokens";
import styles from "./liveCompetitions.module.css";
import { liveCompetitionsHomePath } from "./paths";
import {
  buildDemoHostBoard,
  isHostBoardDemoMode,
} from "./hostBoardDemo";

export const HOST_POLL_MS = 2500;

export function formatSecondsLeft(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(Number(seconds))) {
    return "--:--";
  }
  const total = Math.max(0, Math.floor(Number(seconds)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatFastestMs(ms: number | null | undefined): string | null {
  if (ms == null || Number.isNaN(Number(ms)) || Number(ms) <= 0) {
    return null;
  }
  return `${(Number(ms) / 1000).toFixed(1)}s`;
}

function photoUrl(photo?: string | null): string | null {
  if (!photo) {
    return null;
  }
  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }
  return `${window.location.origin}/${photo.replace(/^\//, "")}`;
}

type Translate = (key: string, params?: Record<string, unknown>) => string;

function isFirstPlace(rank: number | null | undefined): boolean {
  return Number(rank) === 1;
}

function FirstPlaceTag({ t }: { t: Translate }) {
  return (
    <span className={styles.firstPlaceTag} data-testid="host-first-place-tag">
      <span className={styles.firstPlaceCrown} aria-hidden>
        👑
      </span>
      {t("TEACHER_LIVE_COMPETITIONS.HOST_FIRST_PLACE")}
    </span>
  );
}

type HostBoardBodyProps = {
  host: LiveCompetitionHostPayload;
  t: Translate;
  onSelectPlayer?: (studentId: number) => void;
};

/**
 * Live leaderboard / theme body. Memoized on host identity so timer-only updates
 * (same version) do not rebuild the board.
 */
export const HostBoardBody = memo(function HostBoardBody({
  host,
  t,
  onSelectPlayer,
}: HostBoardBodyProps) {
  return (
    <div data-testid="host-board-body" data-version={host.version}>
      {host.status === "lobby" ? (
        <div className={styles.waitCopy} data-testid="host-lobby-state">
          <div className={styles.waitCopyTitle}>
            {t("TEACHER_LIVE_COMPETITIONS.HOST_LOBBY_TITLE")}
          </div>
          <div className={styles.waitCopyMeta}>
            {t("TEACHER_LIVE_COMPETITIONS.HOST_LOBBY_BODY", {
              joined: host.joined_total,
              invited: host.invited_total,
            })}
          </div>
        </div>
      ) : null}

      {(host.active_event || host.event_title || host.event_body) && (
        <div className={styles.eventBanner} data-testid="host-active-event">
          <strong>{host.event_title || host.active_event}</strong>
          {host.event_body ? <span>{host.event_body}</span> : null}
        </div>
      )}

      <div className={styles.themeIndicators} data-testid="host-theme-indicators">
        {host.type === "classic" ? (
          <div className={styles.pill} data-testid="host-campfire">
            {t("TEACHER_LIVE_COMPETITIONS.HOST_FIREWOOD", {
              current: host.firewood,
              needed: host.firewood_needed,
            })}
            {host.fire_lit
              ? ` · ${t("TEACHER_LIVE_COMPETITIONS.HOST_FIRE_LIT")}`
              : ""}
          </div>
        ) : null}
        {host.type === "gold_quest" ? (
          <div className={styles.bridgeBlock} data-testid="host-bridge">
            <div
              className={`${styles.bridgeTrack}${
                host.bridge_broken ? ` ${styles.bridgeCracked}` : ""
              }`}
            >
              <div
                className={styles.bridgeFill}
                style={{
                  width: `${Math.max(0, Math.min(100, Number(host.bridge_progress) || 0))}%`,
                }}
              />
            </div>
            <div className={styles.waitCopyMeta}>
              {host.bridge_broken
                ? t("TEACHER_LIVE_COMPETITIONS.HOST_BRIDGE_BROKEN")
                : t("TEACHER_LIVE_COMPETITIONS.HOST_BRIDGE_OK", {
                    progress: host.bridge_progress,
                  })}
            </div>
          </div>
        ) : null}
        {host.type === "hacking" ? (
          <div className={styles.pill} data-testid="host-firewall">
            {host.firewall_active
              ? t("TEACHER_LIVE_COMPETITIONS.HOST_FIREWALL_ON")
              : t("TEACHER_LIVE_COMPETITIONS.HOST_FIREWALL_OFF")}
          </div>
        ) : null}
      </div>

      {host.teams?.length ? (
        <div className={styles.teamsRow} data-testid="host-teams">
          {host.teams.map((team: LiveCompetitionHostTeam) => (
            <div
              key={team.id}
              className={styles.teamPill}
              style={team.color ? { background: team.color, color: "#111" } : undefined}
              data-testid={`host-team-${team.id}`}
            >
              {t("TEACHER_LIVE_COMPETITIONS.HOST_TEAM_LINE", {
                name: team.name,
                score: team.score,
                coins: team.coins,
              })}
            </div>
          ))}
        </div>
      ) : null}

      {host.status !== "lobby" ? (
        <div className={styles.leaderboardWrap} data-testid="host-leaderboard">
          <div className={styles.leaderboardHeader} aria-hidden>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_RANK")}</span>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_NAME")}</span>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_SCORE")}</span>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_COINS")}</span>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_STREAK")}</span>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_PROGRESS")}</span>
          </div>
          {(host.players || []).map((player: LiveCompetitionHostPlayer) => {
            const avatar = photoUrl(player.avatar);
            const marks: string[] = [];
            if (player.reinforce) {
              marks.push(t("TEACHER_LIVE_COMPETITIONS.HOST_MARK_REINFORCE"));
            }
            if (player.retry_queued > 0) {
              marks.push(t("TEACHER_LIVE_COMPETITIONS.HOST_MARK_RETRY"));
            }
            if (player.frozen) {
              marks.push(t("TEACHER_LIVE_COMPETITIONS.HOST_MARK_FROZEN"));
            }
            if (player.power) {
              marks.push(
                player.power_used
                  ? t("TEACHER_LIVE_COMPETITIONS.HOST_MARK_POWER_USED", {
                      power: player.power,
                    })
                  : t("TEACHER_LIVE_COMPETITIONS.HOST_MARK_POWER", {
                      power: player.power,
                    })
              );
            }
            const first = isFirstPlace(player.rank);
            return (
              <div
                key={player.player_id}
                className={`${styles.leaderboardRow}${
                  first ? ` ${styles.leaderboardRowFirst}` : ""
                }`}
                data-testid={`host-player-${player.id}`}
                data-first-place={first ? "1" : "0"}
                style={
                  player.team_color
                    ? { borderInlineStart: `4px solid ${player.team_color}` }
                    : undefined
                }
              >
                <span
                  className={styles.rankCell}
                  data-testid={`host-player-rank-${player.id}`}
                >
                  {player.rank}
                </span>
                <span className={styles.playerIdentity}>
                  {avatar ? (
                    <img className={styles.rowAvatar} src={avatar} alt="" />
                  ) : (
                    <span className={styles.rowAvatarFallback}>
                      {(player.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>
                    <button
                      type="button"
                      className={styles.playerNameBtn}
                      onClick={() => onSelectPlayer?.(player.id)}
                      data-testid={`host-player-name-${player.id}`}
                    >
                      {player.name}
                    </button>
                    {first ? <FirstPlaceTag t={t} /> : null}
                    {player.team ? (
                      <span className={styles.playerTeamMeta}>{player.team}</span>
                    ) : null}
                    {marks.length ? (
                      <span className={styles.playerMarks}>{marks.join(" · ")}</span>
                    ) : null}
                  </span>
                </span>
                <span data-testid={`host-player-score-${player.id}`}>
                  {player.score}/{host.question_total}
                </span>
                <span data-testid={`host-player-coins-${player.id}`}>{player.coins}</span>
                <span data-testid={`host-player-streak-${player.id}`}>{player.streak}</span>
                <span data-testid={`host-player-progress-${player.id}`}>
                  {player.progress}%
                </span>
              </div>
            );
          })}
          {!host.players?.length ? (
            <div className={styles.emptyBoard}>
              {t("TEACHER_LIVE_COMPETITIONS.HOST_NO_PLAYERS")}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

type HostFinalReportProps = {
  host: LiveCompetitionHostPayload;
  t: Translate;
  onSelectPlayer?: (studentId: number) => void;
};

/** Green = correct share, red = wrong share, grey = no answers. */
export function hardestAnswerBarSegments(row: {
  correct?: number | null;
  wrong?: number | null;
  total?: number | null;
}): { correctPct: number; wrongPct: number; empty: boolean } {
  const total = Math.max(0, Number(row.total) || 0);
  const correct = Math.max(0, Number(row.correct) || 0);
  const wrong = Math.max(0, Number(row.wrong) || 0);
  if (total <= 0 || (correct === 0 && wrong === 0)) {
    return { correctPct: 0, wrongPct: 0, empty: true };
  }
  const scored = Math.min(total, correct + wrong);
  const correctPct = Math.round((Math.min(correct, scored) / scored) * 100);
  return {
    correctPct,
    wrongPct: 100 - correctPct,
    empty: false,
  };
}

/** Final results from the ended host payload only — no client-side scoring. */
export function HostFinalReport({
  host,
  t,
  onSelectPlayer,
}: HostFinalReportProps) {
  const hardest = Array.isArray(host.hardest) ? host.hardest : [];
  const fastestTime = formatFastestMs(host.fastest_ms);
  const showFastest =
    Boolean(host.fastest_name || host.fastest_id) && fastestTime != null;

  const cancelled = Boolean(host.cancelled) || (!host.started_at && host.status === "ended");

  return (
    <div className={styles.reportPanel} data-testid="host-final-report">
      <div className={styles.waitCopy} data-testid="host-ended-banner">
        <div className={styles.waitCopyTitle}>
          {cancelled
            ? t("TEACHER_LIVE_COMPETITIONS.HOST_CANCELLED_TITLE")
            : t("TEACHER_LIVE_COMPETITIONS.HOST_ENDED_TITLE")}
        </div>
        <div className={styles.waitCopyMeta}>
          {cancelled
            ? t("TEACHER_LIVE_COMPETITIONS.HOST_CANCELLED_BODY")
            : t("TEACHER_LIVE_COMPETITIONS.HOST_ENDED_BODY")}
        </div>
      </div>

      {!cancelled ? (
      <div className={styles.reportStats} data-testid="host-report-summary">
        <div className={styles.statCard} data-testid="host-report-accuracy">
          <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_ACCURACY")}</span>
          <b>
            {host.class_accuracy != null && !Number.isNaN(Number(host.class_accuracy))
              ? `${host.class_accuracy}%`
              : "—"}
          </b>
        </div>
        <div className={styles.statCard} data-testid="host-report-answers">
          <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_ANSWERS")}</span>
          <b>
            {host.answers_correct ?? "—"}/{host.answers_total ?? "—"}
          </b>
        </div>
        {host.type === "classic" ? (
          <div className={styles.statCard} data-testid="host-report-fire">
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FIRE")}</span>
            <b>
              {host.fire_lit
                ? t("TEACHER_LIVE_COMPETITIONS.HOST_FIRE_LIT")
                : t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FIRE_OUT")}
            </b>
          </div>
        ) : null}
        {showFastest ? (
          <div className={styles.statCard} data-testid="host-report-fastest">
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_FASTEST")}</span>
            <b>{host.fastest_name || `#${host.fastest_id}`}</b>
            <div className={styles.waitCopyMeta}>{fastestTime}</div>
          </div>
        ) : null}
      </div>
      ) : null}

      <div className={styles.reportSection} data-testid="host-report-hardest">
        <h3>{t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST")}</h3>
        {hardest.length === 0 ? (
          <p className={styles.waitCopyMeta} data-testid="host-report-hardest-empty">
            {t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST_EMPTY")}
          </p>
        ) : (
          <ul className={styles.hardestList}>
            {hardest.map((row: LiveCompetitionHardestQuestion) => {
              const bar = hardestAnswerBarSegments(row);
              return (
                <li key={row.id} data-testid={`host-hardest-${row.id}`}>
                  <div className={styles.hardestQuestion}>
                    {row.question || t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_QUESTION_FALLBACK")}
                  </div>
                  <div className={styles.waitCopyMeta}>
                    {t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_HARDEST_META", {
                      wrong: row.wrong,
                      total: row.total,
                      correct: row.correct,
                      miss: row.miss_rate,
                    })}
                  </div>
                  <div className={styles.answerBarRow}>
                    <div
                      className={styles.answerBarTrack}
                      data-testid={`host-hardest-bar-${row.id}`}
                      data-empty={bar.empty ? "1" : "0"}
                    >
                      {bar.empty ? (
                        <div className={styles.answerBarEmpty} style={{ width: "100%" }} />
                      ) : (
                        <>
                          {bar.correctPct > 0 ? (
                            <div
                              className={styles.answerBarCorrect}
                              style={{ width: `${bar.correctPct}%` }}
                              data-testid={`host-hardest-bar-correct-${row.id}`}
                            />
                          ) : null}
                          {bar.wrongPct > 0 ? (
                            <div
                              className={styles.answerBarWrong}
                              style={{ width: `${bar.wrongPct}%` }}
                              data-testid={`host-hardest-bar-wrong-${row.id}`}
                            />
                          ) : null}
                        </>
                      )}
                    </div>
                    <div
                      className={styles.answerBarLegend}
                      data-testid={`host-hardest-pct-${row.id}`}
                    >
                      {bar.empty ? (
                        <span className={styles.answerBarPctEmpty} data-pct="empty">
                          0%
                        </span>
                      ) : (
                        <>
                          {bar.correctPct > 0 ? (
                            <span
                              className={styles.answerBarPctCorrect}
                              data-pct="correct"
                            >
                              {bar.correctPct}%
                            </span>
                          ) : null}
                          {bar.wrongPct > 0 ? (
                            <span
                              className={styles.answerBarPctWrong}
                              data-pct="wrong"
                            >
                              {bar.wrongPct}%
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={styles.reportSection}>
        <h3>{t("TEACHER_LIVE_COMPETITIONS.HOST_REPORT_LEADERBOARD")}</h3>
        <div className={styles.leaderboardWrap} data-testid="host-final-leaderboard">
          <div className={styles.finalLeaderboardHeader} aria-hidden>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_RANK")}</span>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_NAME")}</span>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_SCORE")}</span>
            <span>{t("TEACHER_LIVE_COMPETITIONS.HOST_COL_COINS")}</span>
          </div>
          {(host.players || []).map((player: LiveCompetitionHostPlayer) => {
            const avatar = photoUrl(player.avatar);
            const first = isFirstPlace(player.rank);
            return (
              <div
                key={player.player_id}
                className={`${styles.finalLeaderboardRow}${
                  first ? ` ${styles.finalLeaderboardRowFirst}` : ""
                }`}
                data-testid={`host-final-player-${player.id}`}
                data-first-place={first ? "1" : "0"}
                style={
                  player.team_color
                    ? { borderInlineStart: `4px solid ${player.team_color}` }
                    : undefined
                }
              >
                <span className={styles.rankCell}>{player.rank}</span>
                <span className={styles.playerIdentity}>
                  {avatar ? (
                    <img className={styles.rowAvatar} src={avatar} alt="" />
                  ) : (
                    <span className={styles.rowAvatarFallback}>
                      {(player.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>
                    <button
                      type="button"
                      className={styles.playerNameBtn}
                      onClick={() => onSelectPlayer?.(player.id)}
                      data-testid={`host-final-player-name-${player.id}`}
                    >
                      {player.name}
                    </button>
                    {first ? <FirstPlaceTag t={t} /> : null}
                    {player.team ? (
                      <span className={styles.playerTeamMeta}>{player.team}</span>
                    ) : null}
                  </span>
                </span>
                <span>
                  {player.score}/{host.question_total}
                </span>
                <span>{player.coins}</span>
              </div>
            );
          })}
          {!host.players?.length ? (
            <div className={styles.emptyBoard}>
              {t("TEACHER_LIVE_COMPETITIONS.HOST_NO_PLAYERS")}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LiveSessionHostPage() {
  const { t } = useTranslation();
  const { sessionId: sessionIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const demoMode = searchParams.get("demo");
  const isDemo = isHostBoardDemoMode(demoMode);
  const sessionId = Number(sessionIdParam || 0);

  const [board, setBoard] = useState<LiveCompetitionHostPayload | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewStudentId, setReviewStudentId] = useState<number | null>(null);

  const boardRef = useRef<LiveCompetitionHostPayload | null>(null);
  const inFlightRef = useRef(false);
  const endingRef = useRef(false);
  const cancellingRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const applyHost = useCallback(
    (next: LiveCompetitionHostPayload, opts?: { force?: boolean }) => {
      const previous = boardRef.current;
      setSecondsLeft(next.seconds_left ?? null);

      const versionChanged =
        !previous ||
        previous.version !== next.version ||
        previous.status !== next.status;

      if (opts?.force || versionChanged) {
        boardRef.current = next;
        setBoard(next);
      }
    },
    []
  );

  const loadHost = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (isDemo || !sessionId || inFlightRef.current || endingRef.current) {
        return;
      }

      inFlightRef.current = true;
      if (!opts?.silent && !boardRef.current) {
        setLoading(true);
      }

      try {
        const res = await fetchLiveCompetitionHost(sessionId);
        // End owns the next board; ignore stale polls that finish during/after End.
        if (endingRef.current || boardRef.current?.status === "ended") {
          return;
        }
        if (!res?.status || !res.host) {
          throw new Error(res?.msg || t("TEACHER_LIVE_COMPETITIONS.HOST_LOAD_ERROR"));
        }
        applyHost(res.host);
        setError("");
      } catch (err: unknown) {
        if (endingRef.current || boardRef.current?.status === "ended") {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : t("TEACHER_LIVE_COMPETITIONS.HOST_LOAD_ERROR");
        setError(message);
      } finally {
        inFlightRef.current = false;
        if (!opts?.silent) {
          setLoading(false);
        }
      }
    },
    [applyHost, isDemo, sessionId, t]
  );

  const confirmEnd = useCallback(async () => {
    if (endingRef.current || boardRef.current?.status !== "playing") {
      return;
    }

    endingRef.current = true;
    setEnding(true);
    setConfirmOpen(false);
    stopPolling();

    try {
      if (isDemo) {
        applyHost(buildDemoHostBoard("ended"), { force: true });
        setError("");
        return;
      }
      if (!sessionId) {
        return;
      }
      const res = await endLiveCompetitionSession(sessionId);
      if (!res?.status || !res.host) {
        throw new Error(res?.msg || t("TEACHER_LIVE_COMPETITIONS.HOST_END_ERROR"));
      }
      applyHost(res.host, { force: true });
      setError("");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("TEACHER_LIVE_COMPETITIONS.HOST_END_ERROR");
      setError(message);
    } finally {
      endingRef.current = false;
      setEnding(false);
    }
  }, [applyHost, isDemo, sessionId, stopPolling, t]);

  const confirmCancelLobby = useCallback(async () => {
    if (
      cancellingRef.current ||
      endingRef.current ||
      boardRef.current?.status !== "lobby"
    ) {
      return;
    }

    cancellingRef.current = true;
    setCancelling(true);
    setCancelConfirmOpen(false);
    stopPolling();

    try {
      if (isDemo) {
        applyHost(buildDemoHostBoard("ended"), { force: true });
        setError("");
        return;
      }
      if (!sessionId) {
        return;
      }
      const res = await cancelLiveCompetitionLobby(sessionId);
      if (!res?.status || !res.host) {
        throw new Error(
          res?.msg || t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_ERROR")
        );
      }
      applyHost(res.host, { force: true });
      setError("");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_ERROR");
      setError(message);
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  }, [applyHost, isDemo, sessionId, stopPolling, t]);

  useEffect(() => {
    if (!isDemo) {
      return;
    }
    applyHost(buildDemoHostBoard(demoMode), { force: true });
    setLoading(false);
    setError("");
  }, [applyHost, demoMode, isDemo]);

  useEffect(() => {
    if (isDemo) {
      return;
    }
    void loadHost();
  }, [isDemo, loadHost]);

  useEffect(() => {
    stopPolling();
    if (isDemo || !sessionId || board?.status !== "playing" || ending) {
      return;
    }

    pollTimerRef.current = setInterval(() => {
      void loadHost({ silent: true });
    }, HOST_POLL_MS);

    return () => {
      stopPolling();
    };
  }, [board?.status, ending, isDemo, loadHost, sessionId, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  let body: ReactNode;
  if (!isDemo && !sessionId) {
    body = (
      <Alert severity="warning">{t("TEACHER_LIVE_COMPETITIONS.HOST_INVALID_SESSION")}</Alert>
    );
  } else if (loading && !board) {
    body = (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress sx={tdCircularProgressSx} data-testid="host-loading" />
      </Box>
    );
  } else if (!board) {
    body = (
      <Box>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Button
          variant="contained"
          sx={tdContainedButtonSx}
          onClick={() => void loadHost()}
          data-testid="host-retry-button"
        >
          {t("TEACHER_LIVE_COMPETITIONS.HOST_RETRY")}
        </Button>
      </Box>
    );
  } else {
    body = (
      <>
        {error ? (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void loadHost({ silent: true })}
                data-testid="host-retry-button"
              >
                {t("TEACHER_LIVE_COMPETITIONS.HOST_RETRY")}
              </Button>
            }
          >
            {error}
          </Alert>
        ) : null}
        <div className={styles.stage} data-testid="host-board-stage">
          <div className={styles.topbar}>
            <div className={styles.brand}>
              <span data-testid="host-type">{board.type}</span>
              {board.goal_label ? (
                <span className={styles.pill}>{board.goal_label}</span>
              ) : null}
            </div>
            <div
              className={`${styles.pill} ${styles.pillCode}`}
              data-testid="host-room-code"
            >
              {t("TEACHER_LIVE_COMPETITIONS.HOST_CODE", { code: board.code })}
            </div>
            <div
              className={`${styles.pill}${
                board.status === "playing"
                  ? ` ${styles.pillPlaying}`
                  : board.status === "lobby"
                    ? ` ${styles.pillLobby}`
                    : ` ${styles.pillEnded}`
              }`}
              data-testid="host-status"
            >
              {t("TEACHER_LIVE_COMPETITIONS.HOST_STATUS", { status: board.status })}
            </div>
            <div className={styles.pill} data-testid="host-question-total">
              {t("TEACHER_LIVE_COMPETITIONS.HOST_QUESTIONS", {
                total: board.question_total,
              })}
            </div>
            {board.status === "playing" ? (
              <div
                className={`${styles.timerPill}${
                  typeof secondsLeft === "number" && secondsLeft <= 10
                    ? ` ${styles.timerPillUrgent}`
                    : ""
                }`}
                data-testid="host-timer"
              >
                {formatSecondsLeft(secondsLeft)}
              </div>
            ) : null}
            {board.status === "playing" ? (
              <button
                type="button"
                className={styles.endBtn}
                disabled={ending}
                onClick={() => setConfirmOpen(true)}
                data-testid="host-end-button"
              >
                {ending
                  ? t("TEACHER_LIVE_COMPETITIONS.HOST_ENDING")
                  : t("TEACHER_LIVE_COMPETITIONS.HOST_END")}
              </button>
            ) : null}
            {board.status === "lobby" ? (
              <button
                type="button"
                className={styles.endBtn}
                disabled={cancelling}
                onClick={() => setCancelConfirmOpen(true)}
                data-testid="host-cancel-lobby-button"
              >
                {cancelling
                  ? t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_ENDING")
                  : t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY")}
              </button>
            ) : null}
          </div>

          {board.status === "ended" ? (
            <HostFinalReport
              host={board}
              t={t}
              onSelectPlayer={setReviewStudentId}
            />
          ) : (
            <HostBoardBody
              host={board}
              t={t}
              onSelectPlayer={setReviewStudentId}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <TeacherLivePageShell
      title={t("TEACHER_LIVE_COMPETITIONS.HOST_TITLE")}
      subtitle={
        isDemo
          ? t("TEACHER_LIVE_COMPETITIONS.HOST_DEMO_SUBTITLE")
          : t("TEACHER_LIVE_COMPETITIONS.HOST_SUBTITLE")
      }
      crumbs={[
        {
          label: t("TEACHER_LIVE_COMPETITIONS.HOST_CRUMB_HOME"),
          to: liveCompetitionsHomePath(),
        },
        {
          label: isDemo
            ? t("TEACHER_LIVE_COMPETITIONS.HOST_DEMO_CRUMB")
            : sessionId
              ? t("TEACHER_LIVE_COMPETITIONS.HOST_CRUMB_SESSION", { id: sessionId })
              : t("TEACHER_LIVE_COMPETITIONS.HOST_TITLE"),
        },
      ]}
      headerActions={
        <Typography
          component={RouterLink}
          to={liveCompetitionsHomePath()}
          sx={{
            color: TD_GREEN,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.875rem",
          }}
        >
          {t("TEACHER_LIVE_COMPETITIONS.HOST_EXIT")}
        </Typography>
      }
    >
      {body}
      {board && board.status !== "playing" ? (
        <Box sx={{ mt: 2 }}>
          <Button
            component={RouterLink}
            to={liveCompetitionsHomePath()}
            variant="outlined"
            sx={tdOutlinedButtonSx}
          >
            {t("TEACHER_LIVE_COMPETITIONS.HOST_BACK")}
          </Button>
        </Box>
      ) : null}

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!ending) {
            setConfirmOpen(false);
          }
        }}
        aria-labelledby="host-end-confirm-title"
      >
        <DialogTitle id="host-end-confirm-title">
          {t("TEACHER_LIVE_COMPETITIONS.HOST_END_CONFIRM_TITLE")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("TEACHER_LIVE_COMPETITIONS.HOST_END_CONFIRM_BODY")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={ending}
            data-testid="host-end-cancel"
          >
            {t("TEACHER_LIVE_COMPETITIONS.HOST_END_CANCEL")}
          </Button>
          <Button
            onClick={() => void confirmEnd()}
            disabled={ending}
            color="error"
            variant="contained"
            data-testid="host-end-confirm"
          >
            {ending
              ? t("TEACHER_LIVE_COMPETITIONS.HOST_ENDING")
              : t("TEACHER_LIVE_COMPETITIONS.HOST_END_CONFIRM")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelConfirmOpen}
        onClose={() => {
          if (!cancelling) {
            setCancelConfirmOpen(false);
          }
        }}
        aria-labelledby="host-cancel-lobby-confirm-title"
      >
        <DialogTitle id="host-cancel-lobby-confirm-title">
          {t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_CONFIRM_TITLE")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_CONFIRM_BODY")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCancelConfirmOpen(false)}
            disabled={cancelling}
            data-testid="host-cancel-lobby-dismiss"
          >
            {t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_DISMISS")}
          </Button>
          <Button
            onClick={() => void confirmCancelLobby()}
            disabled={cancelling}
            color="error"
            variant="contained"
            data-testid="host-cancel-lobby-confirm"
          >
            {cancelling
              ? t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_ENDING")
              : t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_CONFIRM")}
          </Button>
        </DialogActions>
      </Dialog>

      <HostPlayerAnswersDrawer
        open={reviewStudentId != null}
        sessionId={sessionId}
        studentId={reviewStudentId}
        isDemo={isDemo}
        onClose={() => setReviewStudentId(null)}
      />
    </TeacherLivePageShell>
  );
}
