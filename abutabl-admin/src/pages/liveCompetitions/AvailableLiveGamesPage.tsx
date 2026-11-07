import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchAvailableLiveCompetitions,
  fetchLiveCompetitionLobbySessions,
  type LiveCompetitionSessionSummary,
  type TeacherAvailableLiveGame,
} from "@/api/liveCompetitionsTeacherApi";
import { TeacherLivePageShell } from "./TeacherLivePageShell";
import {
  tdChipOutlinedSx,
  tdCircularProgressSx,
} from "./teacherLiveTokens";
import styles from "./liveCompetitions.module.css";
import {
  liveCompetitionCreatePath,
  liveCompetitionHostDemoPath,
  liveCompetitionRecoveryPath,
} from "./paths";
import {
  LIVE_GAME_TYPES,
  liveGameTypeBlurbKey,
  liveGameTypeLabelKey,
  normalizeLiveGameType,
  type LiveGameTypeKey,
} from "./liveGameTypes";

export default function AvailableLiveGamesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [games, setGames] = useState<TeacherAvailableLiveGame[]>([]);
  const [sessions, setSessions] = useState<LiveCompetitionSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState<LiveGameTypeKey | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [gamesRes, sessionsRes] = await Promise.all([
        fetchAvailableLiveCompetitions(),
        fetchLiveCompetitionLobbySessions().catch(() => ({
          status: false,
          sessions: [],
        })),
      ]);

      if (gamesRes?.status && Array.isArray(gamesRes.games)) {
        setGames(gamesRes.games);
      } else {
        setGames([]);
        if (gamesRes?.msg) {
          setError(gamesRes.msg);
        }
      }

      if (sessionsRes?.status && Array.isArray(sessionsRes.sessions)) {
        setSessions(sessionsRes.sessions);
      } else {
        setSessions([]);
      }
    } catch (err: unknown) {
      setGames([]);
      setSessions([]);
      setError(
        err instanceof Error
          ? err.message
          : "Available live competitions could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const gamesByType = useMemo(() => {
    const map: Record<LiveGameTypeKey, TeacherAvailableLiveGame[]> = {
      classic: [],
      hacking: [],
      gold_quest: [],
    };
    games.forEach((game) => {
      const type = normalizeLiveGameType(game.type);
      if (type) {
        map[type].push(game);
      }
    });
    return map;
  }, [games]);

  const selectedGames = selectedType ? gamesByType[selectedType] : [];

  const handlePickType = (type: LiveGameTypeKey) => {
    const matches = gamesByType[type];
    if (matches.length === 0) {
      return;
    }
    if (matches.length === 1) {
      navigate(liveCompetitionCreatePath(matches[0].id));
      return;
    }
    setSelectedType(type);
  };

  return (
    <TeacherLivePageShell
      title={t("TEACHER_LIVE_COMPETITIONS.HOME_TITLE")}
      subtitle={
        selectedType
          ? t("TEACHER_LIVE_COMPETITIONS.HOME_PICK_GAME")
          : t("TEACHER_LIVE_COMPETITIONS.HOME_PICK_TYPE")
      }
      crumbs={[
        { label: t("TEACHER_LIVE_COMPETITIONS.HOME_TITLE") },
        ...(selectedType
          ? [{ label: t(liveGameTypeLabelKey(selectedType)) }]
          : []),
      ]}
    >
      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={tdCircularProgressSx} />
        </Box>
      ) : (
        <>
          {!selectedType ? (
            <>
              <div
                className={styles.typePickerGrid}
                data-testid="live-game-type-picker"
              >
                {LIVE_GAME_TYPES.map((type) => {
                  const count = gamesByType[type].length;
                  const available = count > 0;
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.typeTile} ${styles[`typeTile_${type}`]}`}
                      onClick={() => handlePickType(type)}
                      disabled={!available}
                      data-testid={`live-game-type-${type}`}
                      data-available={available ? "1" : "0"}
                      aria-label={t(liveGameTypeLabelKey(type))}
                    >
                      <div
                        className={styles.typeTileArt}
                        aria-hidden="true"
                        data-type={type}
                      >
                        {type === "classic" ? (
                          <img
                            className={styles.typeTileArtImg}
                            src={require("./assets/classic-bg.jpg")}
                            alt=""
                          />
                        ) : null}
                        {type === "gold_quest" ? (
                          <img
                            className={styles.typeTileArtImg}
                            src={require("./assets/goldquest-bg.jpg")}
                            alt=""
                          />
                        ) : null}
                        {type === "hacking" ? (
                          <pre className={styles.typeTileTerminal}>
                            {`> PASSWORD PROTOCOLS\n> initializing...\n> cracking hash...\n> access restricted_`}
                          </pre>
                        ) : null}
                      </div>
                      <div className={styles.typeTileBody}>
                        <h3>{t(liveGameTypeLabelKey(type))}</h3>
                        <p>{t(liveGameTypeBlurbKey(type))}</p>
                        {!available ? (
                          <span className={styles.typeTileUnavailable}>
                            {t("TEACHER_LIVE_COMPETITIONS.TYPE_UNAVAILABLE")}
                          </span>
                        ) : count > 1 ? (
                          <span className={styles.typeTileMeta}>
                            {t("TEACHER_LIVE_COMPETITIONS.TYPE_GAME_COUNT", {
                              count,
                            })}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {games.length === 0 && !error ? (
                <Typography sx={{ mt: 2, color: "#6B7280", fontSize: "0.875rem" }}>
                  {t("TEACHER_LIVE_COMPETITIONS.HOME_EMPTY")}
                </Typography>
              ) : null}
            </>
          ) : (
            <Box>
              <button
                type="button"
                className={styles.backLink}
                onClick={() => setSelectedType(null)}
                data-testid="live-game-type-back"
              >
                {t("TEACHER_LIVE_COMPETITIONS.HOME_BACK_TYPES")}
              </button>
              <div className={styles.gameCardGrid}>
                {selectedGames.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    className={styles.gameCard}
                    onClick={() => navigate(liveCompetitionCreatePath(game.id))}
                    data-testid={`available-game-${game.id}`}
                  >
                    <div className={styles.gameCardMedia}>
                      {(game.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.gameCardBody}>
                      <h3>{game.name}</h3>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {game.type ? (
                          <Chip
                            size="small"
                            label={game.type}
                            variant="outlined"
                            sx={{
                              textTransform: "capitalize",
                              ...tdChipOutlinedSx,
                            }}
                          />
                        ) : null}
                        <Chip
                          size="small"
                          label={`${game.questions_count ?? 0} questions`}
                          variant="outlined"
                        />
                        {game.time ? (
                          <Chip
                            size="small"
                            label={game.time}
                            variant="outlined"
                          />
                        ) : null}
                      </Box>
                    </div>
                  </button>
                ))}
              </div>
            </Box>
          )}

          <Box sx={{ mt: 5 }}>
            <h2 className={styles.sectionTitle}>
              {t("TEACHER_LIVE_COMPETITIONS.HOME_DEMO_TITLE")}
            </h2>
            <p className={styles.sectionHint}>
              {t("TEACHER_LIVE_COMPETITIONS.HOME_DEMO_HINT")}
            </p>
            <div className={styles.sessionList}>
              <RouterLink
                className={styles.sessionRow}
                to={liveCompetitionHostDemoPath("playing")}
                data-testid="host-demo-playing"
              >
                <span className={styles.sessionRowMain}>
                  <strong>
                    {t("TEACHER_LIVE_COMPETITIONS.HOME_DEMO_PLAYING")}
                  </strong>
                  <span className={styles.sessionMeta}>
                    {t("TEACHER_LIVE_COMPETITIONS.HOME_DEMO_PLAYING_META")}
                  </span>
                </span>
                <span className={styles.sessionEnter}>
                  {t("TEACHER_LIVE_COMPETITIONS.HOME_DEMO_OPEN")}
                </span>
              </RouterLink>
              <RouterLink
                className={styles.sessionRow}
                to={liveCompetitionHostDemoPath("ended")}
                data-testid="host-demo-ended"
              >
                <span className={styles.sessionRowMain}>
                  <strong>
                    {t("TEACHER_LIVE_COMPETITIONS.HOME_DEMO_ENDED")}
                  </strong>
                  <span className={styles.sessionMeta}>
                    {t("TEACHER_LIVE_COMPETITIONS.HOME_DEMO_ENDED_META")}
                  </span>
                </span>
                <span className={styles.sessionEnter}>
                  {t("TEACHER_LIVE_COMPETITIONS.HOME_DEMO_OPEN")}
                </span>
              </RouterLink>
            </div>
          </Box>

          {sessions.length > 0 ? (
            <Box sx={{ mt: 5 }}>
              <h2 className={styles.sectionTitle}>
                {t("TEACHER_LIVE_COMPETITIONS.HOME_ACTIVE_SESSIONS")}
              </h2>
              <p className={styles.sectionHint}>
                {t("TEACHER_LIVE_COMPETITIONS.HOME_ACTIVE_SESSIONS_HINT")}
              </p>
              <div
                className={styles.sessionList}
                data-testid="recoverable-sessions"
              >
                {sessions.map((session) => {
                  const classLabel = [session.grade_name, session.class_name]
                    .filter(Boolean)
                    .join(" · ");
                  const joined = session.joined_player_count ?? 0;
                  const invited = session.invited_total ?? 0;
                  const statusLabel =
                    session.status === "lobby"
                      ? t("TEACHER_LIVE_COMPETITIONS.HOME_STATUS_LOBBY")
                      : t("TEACHER_LIVE_COMPETITIONS.HOME_STATUS_PLAYING");
                  return (
                    <RouterLink
                      key={session.id}
                      className={styles.sessionRow}
                      to={liveCompetitionRecoveryPath(session)}
                      data-testid={`recover-session-${session.id}`}
                      data-session-status={session.status}
                    >
                      <span className={styles.sessionRowMain}>
                        <strong>
                          {session.game_name ||
                            t("TEACHER_LIVE_COMPETITIONS.HOME_SESSION_LABEL", {
                              id: session.id,
                            })}
                        </strong>
                        <span className={styles.sessionMeta}>
                          {[
                            statusLabel,
                            classLabel || null,
                            t("TEACHER_LIVE_COMPETITIONS.HOME_SESSION_COUNTS", {
                              joined,
                              invited,
                            }),
                            t("TEACHER_LIVE_COMPETITIONS.HOST_CODE", {
                              code: session.code,
                            }),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className={styles.sessionEnter}>
                        {session.status === "lobby"
                          ? t("TEACHER_LIVE_COMPETITIONS.HOME_ENTER_LOBBY")
                          : t("TEACHER_LIVE_COMPETITIONS.HOME_ENTER_HOST")}
                      </span>
                    </RouterLink>
                  );
                })}
              </div>
            </Box>
          ) : null}
        </>
      )}
    </TeacherLivePageShell>
  );
}
