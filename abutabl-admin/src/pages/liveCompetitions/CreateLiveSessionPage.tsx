import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createLiveCompetitionSession,
  fetchAvailableLiveCompetitions,
  parseLiveGameDurationMinutes,
  type TeacherAvailableLiveGame,
} from "@/api/liveCompetitionsTeacherApi";
import { getRequest } from "@/utils/fetchMethods";
import { notify } from "@/utils/notify";
import {
  type TeacherClassOverviewItem,
  type TeacherClassesOverviewResponse,
} from "@/types/teacherClasses";
import { TeacherLivePageShell } from "./TeacherLivePageShell";
import { tdCircularProgressSx } from "./teacherLiveTokens";
import {
  liveCompetitionSessionPath,
  liveCompetitionsHomePath,
} from "./paths";

const BRAND = "#23B8A2";
const BRAND_FOCUS = "rgba(35, 184, 162, 0.18)";
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60] as const;

function snapDurationMinutes(minutes: number): number {
  if ((DURATION_OPTIONS as readonly number[]).includes(minutes)) {
    return minutes;
  }
  return DURATION_OPTIONS.reduce((best, current) =>
    Math.abs(current - minutes) < Math.abs(best - minutes) ? current : best
  );
}

export default function CreateLiveSessionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const liveGameId = Number(searchParams.get("liveGameId") || 0);

  const [game, setGame] = useState<TeacherAvailableLiveGame | null>(null);
  const [classes, setClasses] = useState<TeacherClassOverviewItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!liveGameId) {
      setError("Select a live game first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [gamesRes, classesRes] = await Promise.all([
        fetchAvailableLiveCompetitions(),
        getRequest(
          {},
          "/api/dashboard/teacher/classes"
        ) as Promise<TeacherClassesOverviewResponse>,
      ]);

      const found =
        gamesRes?.status && Array.isArray(gamesRes.games)
          ? gamesRes.games.find((g) => g.id === liveGameId) || null
          : null;
      setGame(found);
      if (found) {
        setDurationMinutes(
          snapDurationMinutes(parseLiveGameDurationMinutes(found.time))
        );
      }

      if (!found) {
        setError("That live game is not available for your schools.");
      }

      if (classesRes?.status && Array.isArray(classesRes.classes)) {
        setClasses(classesRes.classes.filter((c) => c.is_active !== false));
      } else {
        setClasses([]);
      }
    } catch (err: unknown) {
      setGame(null);
      setClasses([]);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load game or class list."
      );
    } finally {
      setLoading(false);
    }
  }, [liveGameId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.class_id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const handleCreate = async () => {
    if (!liveGameId || !selectedClassId || creating) {
      return;
    }

    setCreating(true);
    setError("");
    try {
      const res = await createLiveCompetitionSession({
        live_game_id: liveGameId,
        class_id: selectedClassId,
        duration_minutes: durationMinutes,
      });

      if (!res?.status || !res.session?.id) {
        throw new Error(res?.msg || "Session was not created.");
      }

      notify("Lobby created. Invitations were sent to the class.", "success");
      navigate(liveCompetitionSessionPath(res.session.id), {
        state: {
          gameName: game?.name,
          gameType: game?.type,
          className: selectedClass?.name || selectedClass?.class_name,
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not create the session.";
      setError(message);
      notify(message, "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <TeacherLivePageShell
      title={t("TEACHER_LIVE_COMPETITIONS.CREATE_TITLE")}
      subtitle={
        game
          ? t("TEACHER_LIVE_COMPETITIONS.CREATE_SUBTITLE_WITH_GAME", {
              name: game.name,
            })
          : t("TEACHER_LIVE_COMPETITIONS.CREATE_SUBTITLE")
      }
      crumbs={[
        {
          label: t("TEACHER_LIVE_COMPETITIONS.HOME_TITLE"),
          to: liveCompetitionsHomePath(),
        },
        { label: t("TEACHER_LIVE_COMPETITIONS.CREATE_CRUMB") },
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
        <div className="space-y-5">
          {game ? (
            <p className="text-sm text-[#6B7280]">
              {t("TEACHER_LIVE_COMPETITIONS.CREATE_GAME_META", {
                id: game.id,
                type: game.type || "—",
                count: game.questions_count ?? 0,
              })}
            </p>
          ) : null}

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] sm:p-5">
            <h2 className="text-[1.0625rem] font-bold leading-tight text-[#038E7B]">
              {t("TEACHER_LIVE_COMPETITIONS.CREATE_DURATION_TITLE")}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              {t("TEACHER_LIVE_COMPETITIONS.CREATE_DURATION_HINT")}
            </p>

            <div className="relative mt-4 max-w-xs">
              <select
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(Number(event.target.value))
                }
                disabled={creating || !game}
                data-testid="session-duration-select"
                aria-label={t("TEACHER_LIVE_COMPETITIONS.CREATE_DURATION_TITLE")}
                className="w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-[#F3F4F6] py-2.5 pl-4 pr-10 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#23B8A2] focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND_FOCUS}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {DURATION_OPTIONS.map((mins) => (
                  <option key={mins} value={mins}>
                    {t("TEACHER_LIVE_COMPETITIONS.CREATE_DURATION_OPTION", {
                      minutes: mins,
                    })}
                  </option>
                ))}
              </select>
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 20,
                  color: "#9CA3AF",
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] sm:p-5">
            <h2 className="text-[1.0625rem] font-bold leading-tight text-[#038E7B]">
              {t("TEACHER_LIVE_COMPETITIONS.CREATE_CLASSES_TITLE")}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              {t("TEACHER_LIVE_COMPETITIONS.CREATE_CLASSES_HINT")}
            </p>

            {classes.length === 0 ? (
              <p className="mt-4 py-2 text-sm text-[#6B7280]">
                {t("TEACHER_LIVE_COMPETITIONS.CREATE_CLASSES_EMPTY")}
              </p>
            ) : (
              <div
                className="mt-4 grid gap-3 sm:grid-cols-2"
                data-testid="class-selection-list"
              >
                {classes.map((item) => {
                  const selected = item.class_id === selectedClassId;
                  const title = item.name || item.class_name || `Class #${item.class_id}`;
                  return (
                    <button
                      key={item.class_id}
                      type="button"
                      disabled={creating}
                      onClick={() => setSelectedClassId(item.class_id)}
                      data-testid={`class-option-${item.class_id}`}
                      className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? "border-[#23B8A2] bg-[#E6F8F5]"
                          : "border-[#E5E7EB] bg-white hover:border-[#23B8A2]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[1.0625rem] font-bold leading-tight text-[#111827]">
                          {title}
                        </span>
                        <span className="mt-1 block text-sm text-[#6B7280]">
                          {item.grade_name}
                          {typeof item.student_count === "number"
                            ? ` · ${item.student_count} ${t(
                                "TEACHER_LIVE_COMPETITIONS.CREATE_STUDENTS"
                              )}`
                            : ""}
                        </span>
                      </span>
                      {selected ? (
                        <span className="shrink-0 rounded-full bg-[#E6F8F5] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">
                          {t("TEACHER_LIVE_COMPETITIONS.CREATE_SELECTED")}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!selectedClassId || !game || creating}
              onClick={() => void handleCreate()}
              data-testid="create-session-button"
              className="inline-flex items-center justify-center rounded-[10px] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: BRAND }}
            >
              {creating
                ? t("TEACHER_LIVE_COMPETITIONS.CREATE_SUBMITTING")
                : t("TEACHER_LIVE_COMPETITIONS.CREATE_SUBMIT")}
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={() => navigate(liveCompetitionsHomePath())}
              className="text-sm font-semibold text-[#6B7280] transition hover:text-[#111827] disabled:opacity-50"
            >
              {t("TEACHER_LIVE_COMPETITIONS.CREATE_BACK")}
            </button>
          </div>
        </div>
      )}
    </TeacherLivePageShell>
  );
}
