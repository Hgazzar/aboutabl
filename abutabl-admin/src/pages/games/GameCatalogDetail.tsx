import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { getRequest, postRequest, putRequest } from "@/utils/fetchMethods";
import { useLoginUser } from "@/hooks/useLoginUser";
import { InteractiveGamesPageShell } from "./InteractiveGamesPageShell";
import { canManageLiveCatalog } from "./liveGamesEntry";
import {
  igCircularProgressSx,
  igContainedButtonSx,
  igOutlinedButtonSx,
} from "./interactiveGamesTokens";

type Question = {
  id: number;
  sort_order: number;
  question: string;
  answer_type: string;
  correct_answer: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  image?: string | null;
  voice_url?: string | null;
};

type SchoolOption = { id: number; name?: string; name_ar?: string };

type Game = {
  id: number;
  name: string;
  type?: string;
  time?: string;
  level?: number | null;
  is_published?: boolean;
  school_ids?: number[];
  questions?: Question[];
  selectable_for_new_competition?: boolean;
};

export default function GameCatalogDetail() {
  const { id } = useParams();
  const loginUser = useLoginUser();
  const showCatalog = canManageLiveCatalog(loginUser);
  const [game, setGame] = useState<Game | null>(null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    if (!showCatalog) {
      setGame(null);
      setLoading(false);
      setError("The live games catalog is available to admins only.");
      return;
    }
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [gameRes, schoolRes]: any[] = await Promise.all([
        getRequest({}, `/api/live-competitions/${id}`),
        getRequest({ paginate: 0 }, "/api/school/list"),
      ]);
      if (gameRes?.status && gameRes.game) {
        setGame(gameRes.game);
        setSelected((gameRes.game.school_ids || []).map((value: number) => Number(value)));
      } else {
        setGame(null);
        setError(gameRes?.msg || "Game not found.");
      }
      if (schoolRes?.status && Array.isArray(schoolRes.schools)) {
        setSchools(schoolRes.schools);
      } else if (schoolRes?.status && Array.isArray(schoolRes.schools?.data)) {
        setSchools(schoolRes.schools.data);
      }
    } catch (err: any) {
      setGame(null);
      setError(err?.message || "Could not load the catalog game.");
    } finally {
      setLoading(false);
    }
  }, [id, showCatalog]);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePublish = async () => {
    if (!game) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const path = game.is_published
        ? `/api/live-competitions/${game.id}/unpublish`
        : `/api/live-competitions/${game.id}/publish`;
      const res: any = await postRequest({}, path);
      if (res?.status && res.game) {
        setGame(res.game);
        setSuccess(res.msg || "Updated.");
      } else {
        setError(res?.msg || "Could not update publish state.");
      }
    } catch (err: any) {
      setError(err?.message || "Could not update publish state.");
    } finally {
      setSaving(false);
    }
  };

  const saveSchools = async () => {
    if (!game) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res: any = await putRequest(
        { school_ids: selected },
        `/api/live-competitions/${game.id}/schools`
      );
      if (res?.status && res.game) {
        setGame(res.game);
        setSelected((res.game.school_ids || []).map((value: number) => Number(value)));
        setSuccess(res.msg || "School entitlements updated.");
      } else {
        setError(res?.msg || "Could not update school entitlements.");
      }
    } catch (err: any) {
      setError(err?.message || "Could not update school entitlements.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSchool = (schoolId: number) => {
    setSelected((current) =>
      current.includes(schoolId)
        ? current.filter((value) => value !== schoolId)
        : [...current, schoolId]
    );
  };

  return (
    <InteractiveGamesPageShell
      title={game?.name || "Live game"}
      subtitle="Publish does not grant school access. An empty entitlement list authorizes no schools."
      crumbs={[
        { label: "Live games", to: "/games" },
        { label: game?.name || "Details" },
      ]}
      headerActions={
        game ? (
          <Button
            variant="contained"
            sx={igContainedButtonSx}
            disabled={saving}
            onClick={togglePublish}
          >
            {game.is_published ? "Unpublish" : "Publish"}
          </Button>
        ) : null
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={igCircularProgressSx} />
        </Box>
      ) : (
        <>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          ) : null}
          {game ? (
            <>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
                <Chip label={game.type || "type"} />
                <Chip label={game.time || "time"} />
                <Chip label={game.is_published ? "Published" : "Unpublished"} />
                <Chip
                  label={
                    game.selectable_for_new_competition
                      ? "Selectable for competitions"
                      : "Not selectable for competitions"
                  }
                />
              </Box>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Questions
              </Typography>
              <Table size="small" sx={{ mb: 4 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Question</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Correct</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(game.questions || []).map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>{question.sort_order}</TableCell>
                      <TableCell>{question.question}</TableCell>
                      <TableCell>{question.answer_type}</TableCell>
                      <TableCell>{question.correct_answer}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!(game.questions || []).length ? (
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  This game has no questions.
                </Typography>
              ) : null}

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                School entitlements
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Only checked schools may use a published game. Leaving this empty authorizes nobody.
              </Typography>
              <FormGroup sx={{ mb: 2, maxHeight: 320, overflow: "auto" }}>
                {schools.map((school) => (
                  <FormControlLabel
                    key={school.id}
                    control={
                      <Checkbox
                        checked={selected.includes(Number(school.id))}
                        onChange={() => toggleSchool(Number(school.id))}
                      />
                    }
                    label={school.name || school.name_ar || `School ${school.id}`}
                  />
                ))}
              </FormGroup>
              {!schools.length ? (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  No schools were returned from the school list.
                </Typography>
              ) : null}
              <Button variant="outlined" sx={igOutlinedButtonSx} disabled={saving} onClick={saveSchools}>
                Save entitlements
              </Button>
            </>
          ) : null}
        </>
      )}
    </InteractiveGamesPageShell>
  );
}
