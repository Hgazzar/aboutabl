import { useCallback, useEffect, useRef, useState } from "react";
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
import { Link as RouterLink, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  beginLiveCompetitionSession,
  cancelLiveCompetitionLobby,
  fetchAvailableLiveCompetitions,
  fetchLiveCompetitionLobby,
  fetchLiveCompetitionSessionStudents,
  isLiveCompetitionLobbyConflict,
  type LiveCompetitionEligibleStudent,
  type LiveCompetitionSessionSummary,
} from "@/api/liveCompetitionsTeacherApi";
import { getRequest } from "@/utils/fetchMethods";
import { notify } from "@/utils/notify";
import {
  type TeacherClassOverviewItem,
  type TeacherClassesOverviewResponse,
} from "@/types/teacherClasses";
import { TeacherLivePageShell } from "./TeacherLivePageShell";
import {
  TD_GREEN,
  tdCircularProgressSx,
} from "./teacherLiveTokens";
import styles from "./liveCompetitions.module.css";
import {
  liveCompetitionHostPath,
  liveCompetitionsHomePath,
} from "./paths";

/** Near-instant lobby refresh while waiting for joins (no websocket yet). */
export const LOBBY_POLL_MS = 1000;

type LocationState = {
  gameName?: string;
  gameType?: string;
  className?: string;
};

type ParticipationTotals = {
  invited_total?: number;
  joined_total?: number;
  pending_total?: number;
};

type ParticipationView = {
  labelKey: string;
  badgeClass: string;
};

function studentLabel(student: LiveCompetitionEligibleStudent): string {
  return student.name || student.name_ar || `Student #${student.id}`;
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

/** Map backend participation fields only — never invent join from eligibility. */
export function participationViewForStudent(
  student: LiveCompetitionEligibleStudent
): ParticipationView {
  if (student.joined === true) {
    return { labelKey: "TEACHER_LIVE_COMPETITIONS.STATUS_JOINED", badgeClass: styles.statusJoined };
  }
  if (student.invite_status === "pending") {
    return {
      labelKey: "TEACHER_LIVE_COMPETITIONS.STATUS_WAITING",
      badgeClass: styles.statusWaiting,
    };
  }
  if (student.invite_status === "accepted") {
    return {
      labelKey: "TEACHER_LIVE_COMPETITIONS.STATUS_ACCEPTED_NO_PLAYER",
      badgeClass: styles.statusAccepted,
    };
  }
  if (student.invite_status === "revoked") {
    return {
      labelKey: "TEACHER_LIVE_COMPETITIONS.STATUS_REVOKED",
      badgeClass: styles.statusOther,
    };
  }
  if (student.invite_status === "expired") {
    return {
      labelKey: "TEACHER_LIVE_COMPETITIONS.STATUS_EXPIRED",
      badgeClass: styles.statusOther,
    };
  }
  return {
    labelKey: "TEACHER_LIVE_COMPETITIONS.STATUS_UNKNOWN",
    badgeClass: styles.statusOther,
  };
}

export default function LiveSessionLobbyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: sessionIdParam } = useParams();
  const sessionId = Number(sessionIdParam || 0);
  const locationState = (location.state || {}) as LocationState;

  const [session, setSession] = useState<LiveCompetitionSessionSummary | null>(null);
  const [students, setStudents] = useState<LiveCompetitionEligibleStudent[]>([]);
  const [totals, setTotals] = useState<ParticipationTotals>({});
  const [gameName, setGameName] = useState(locationState.gameName || "");
  const [gameType, setGameType] = useState(locationState.gameType || "");
  const [className, setClassName] = useState(locationState.className || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [beginning, setBeginning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beginningRef = useRef(false);
  const cancellingRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const goToHostPlaceholder = useCallback(
    (id: number) => {
      stopPolling();
      navigate(liveCompetitionHostPath(id), { replace: true });
    },
    [navigate, stopPolling]
  );

  const applyLobby = useCallback(
    (
      nextSession: LiveCompetitionSessionSummary,
      nextStudents: LiveCompetitionEligibleStudent[],
      nextTotals?: ParticipationTotals
    ) => {
      setSession(nextSession);
      setStudents(nextStudents);
      if (nextTotals) {
        setTotals(nextTotals);
      }
      if (String(nextSession.status) !== "lobby") {
        goToHostPlaceholder(nextSession.id);
      }
    },
    [goToHostPlaceholder]
  );

  const loadLobby = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!sessionId) {
        setError("Invalid session.");
        setLoading(false);
        return;
      }

      if (!opts?.silent) {
        setLoading(true);
      }

      try {
        const [res, studentsRes] = await Promise.all([
          fetchLiveCompetitionLobby(sessionId),
          fetchLiveCompetitionSessionStudents(sessionId).catch(() => null),
        ]);
        if (!res?.status || !res.lobby?.session) {
          throw new Error(res?.msg || "Lobby could not be loaded.");
        }
        const fromStudentsEndpoint =
          studentsRes?.status && Array.isArray(studentsRes.students)
            ? studentsRes.students
            : null;
        applyLobby(
          res.lobby.session,
          fromStudentsEndpoint ??
            (Array.isArray(res.lobby.eligible_students)
              ? res.lobby.eligible_students
              : []),
          {
            invited_total: res.lobby.invited_total,
            joined_total: res.lobby.joined_total,
            pending_total: res.lobby.pending_total,
          }
        );
        setError("");
      } catch (err: unknown) {
        if (isLiveCompetitionLobbyConflict(err)) {
          goToHostPlaceholder(sessionId);
          return;
        }
        setError(
          err instanceof Error ? err.message : "Lobby could not be loaded."
        );
      } finally {
        if (!opts?.silent) {
          setLoading(false);
        }
      }
    },
    [applyLobby, goToHostPlaceholder, sessionId]
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;
    const liveGameId = session.live_game_id;
    const classId = session.class_id;

    (async () => {
      try {
        const needsGame = !gameName;
        const needsClass = !className;
        if (!needsGame && !needsClass) {
          return;
        }

        const [gamesRes, classesRes] = await Promise.all([
          needsGame
            ? fetchAvailableLiveCompetitions().catch(() => null)
            : Promise.resolve(null),
          needsClass
            ? (getRequest({}, "/api/dashboard/teacher/classes").catch(
                () => null
              ) as Promise<TeacherClassesOverviewResponse | null>)
            : Promise.resolve(null),
        ]);
        if (cancelled) {
          return;
        }
        if (needsGame && gamesRes?.status && Array.isArray(gamesRes.games)) {
          const match = gamesRes.games.find((g) => g.id === liveGameId);
          if (match) {
            setGameName(match.name);
            setGameType(match.type || "");
          }
        }
        if (needsClass && classesRes?.status && Array.isArray(classesRes.classes)) {
          const match = classesRes.classes.find(
            (c: TeacherClassOverviewItem) => c.class_id === classId
          );
          if (match) {
            setClassName(match.name || match.class_name);
          }
        }
      } catch {
        /* labels are optional */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [className, gameName, session]);

  useEffect(() => {
    void loadLobby();
  }, [loadLobby]);

  useEffect(() => {
    stopPolling();
    if (!sessionId || session?.status !== "lobby" || beginning) {
      return;
    }

    const refreshNow = () => {
      void loadLobby({ silent: true });
    };

    pollTimerRef.current = setInterval(refreshNow, LOBBY_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshNow();
      }
    };
    window.addEventListener("focus", refreshNow);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopPolling();
      window.removeEventListener("focus", refreshNow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [beginning, loadLobby, session?.status, sessionId, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleBegin = async () => {
    if (!sessionId || beginningRef.current || beginning || cancellingRef.current) {
      return;
    }
    beginningRef.current = true;
    setBeginning(true);
    setError("");
    stopPolling();

    try {
      const res = await beginLiveCompetitionSession(sessionId);
      if (!res?.status || !res.session) {
        throw new Error(res?.msg || "Could not begin the session.");
      }
      notify("Session started.", "success");
      goToHostPlaceholder(sessionId);
    } catch (err: unknown) {
      if (isLiveCompetitionLobbyConflict(err)) {
        notify("Session already started.", "success");
        goToHostPlaceholder(sessionId);
        return;
      }
      const message =
        err instanceof Error ? err.message : "Could not begin the session.";
      setError(message);
      notify(message, "error");
      beginningRef.current = false;
      setBeginning(false);
      void loadLobby({ silent: true });
    }
  };

  const confirmCancelLobby = async () => {
    if (!sessionId || cancellingRef.current || beginningRef.current) {
      return;
    }
    cancellingRef.current = true;
    setCancelling(true);
    setCancelConfirmOpen(false);
    setError("");
    stopPolling();

    try {
      const res = await cancelLiveCompetitionLobby(sessionId);
      if (!res?.status || !res.host) {
        throw new Error(
          res?.msg || t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_ERROR")
        );
      }
      notify(t("TEACHER_LIVE_COMPETITIONS.HOST_CANCELLED_TITLE"), "success");
      navigate(liveCompetitionsHomePath());
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_ERROR");
      setError(message);
      notify(message, "error");
      cancellingRef.current = false;
      setCancelling(false);
      void loadLobby({ silent: true });
    }
  };

  const titleGame = gameName || (session ? `Game #${session.live_game_id}` : "Live session");
  const titleClass = className || (session ? `Class #${session.class_id}` : "");

  return (
    <TeacherLivePageShell
      title="Teacher lobby"
      subtitle="Waiting for participants. Class invitations were created by the server — begin when you are ready."
      crumbs={[
        { label: "Live competitions", to: liveCompetitionsHomePath() },
        { label: session ? `Session #${session.id}` : "Lobby" },
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
          Exit
        </Typography>
      }
    >
      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {loading && !session ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={tdCircularProgressSx} />
        </Box>
      ) : session ? (
        <div className={styles.stage} data-testid="teacher-lobby-stage">
          <div className={styles.topbar}>
            <div className={styles.brand}>
              <span>{titleGame}</span>
              {gameType ? <span className={styles.pill}>{gameType}</span> : null}
              {titleClass ? <span className={styles.pill}>{titleClass}</span> : null}
            </div>
            <div className={styles.pill} data-testid="lobby-room-code">
              CODE {session.code}
            </div>
            <div className={styles.pill} data-testid="lobby-status">
              {session.status}
            </div>
          </div>

          {session.status === "lobby" ? (
            <>
              <div className={styles.lobbyActions}>
                <button
                  type="button"
                  className={styles.startTab}
                  disabled={beginning || cancelling}
                  onClick={() => void handleBegin()}
                  data-testid="begin-session-button"
                >
                  {beginning ? "Starting…" : "Begin"}
                </button>
                <button
                  type="button"
                  className={styles.cancelLobbyBtn}
                  disabled={beginning || cancelling}
                  onClick={() => setCancelConfirmOpen(true)}
                  data-testid="cancel-lobby-button"
                >
                  {cancelling
                    ? t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_ENDING")
                    : t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY")}
                </button>
              </div>

              <div className={styles.waitCopy}>
                <div className={styles.waitCopyTitle}>
                  {t("TEACHER_LIVE_COMPETITIONS.WAITING_TITLE")}
                </div>
                <div className={styles.waitCopyMeta} data-testid="lobby-invite-count">
                  {typeof totals.joined_total === "number" &&
                  typeof totals.pending_total === "number" &&
                  typeof totals.invited_total === "number"
                    ? t("TEACHER_LIVE_COMPETITIONS.TOTALS", {
                        joined: totals.joined_total,
                        pending: totals.pending_total,
                        invited: totals.invited_total,
                      })
                    : t("TEACHER_LIVE_COMPETITIONS.TOTALS", {
                        joined: students.filter((s) => s.joined === true).length,
                        pending: students.filter((s) => s.invite_status === "pending").length,
                        invited: students.filter((s) => s.invite_status != null).length,
                      })}
                </div>
              </div>

              <div className={styles.studentGrid} data-testid="lobby-student-grid">
                {students.map((student) => {
                  const src = photoUrl(student.photo);
                  const label = studentLabel(student);
                  const participation = participationViewForStudent(student);
                  return (
                    <div
                      key={student.id}
                      className={styles.playerChip}
                      data-testid={`lobby-student-${student.id}`}
                      data-joined={student.joined === true ? "true" : "false"}
                      data-invite-status={student.invite_status ?? ""}
                    >
                      {src ? (
                        <img className={styles.avatarImg} src={src} alt="" />
                      ) : (
                        <div className={styles.avatarFallback}>
                          {label.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <strong>{label}</strong>
                      <span
                        className={`${styles.statusBadge} ${participation.badgeClass}`}
                        data-testid={`lobby-student-status-${student.id}`}
                      >
                        {t(participation.labelKey)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className={styles.hint}>{t("TEACHER_LIVE_COMPETITIONS.PARTICIPATION_HINT")}</p>
            </>
          ) : (
            <div className={styles.waitCopy}>
              <div className={styles.waitCopyTitle}>Session is no longer in lobby</div>
              <div className={styles.waitCopyMeta}>Opening the host destination…</div>
            </div>
          )}
        </div>
      ) : null}

      <Dialog
        open={cancelConfirmOpen}
        onClose={() => {
          if (!cancelling) {
            setCancelConfirmOpen(false);
          }
        }}
        aria-labelledby="cancel-lobby-confirm-title"
      >
        <DialogTitle id="cancel-lobby-confirm-title">
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
            data-testid="cancel-lobby-dismiss"
          >
            {t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_DISMISS")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmCancelLobby()}
            disabled={cancelling}
            data-testid="cancel-lobby-confirm"
          >
            {t("TEACHER_LIVE_COMPETITIONS.HOST_CANCEL_LOBBY_CONFIRM")}
          </Button>
        </DialogActions>
      </Dialog>
    </TeacherLivePageShell>
  );
}
