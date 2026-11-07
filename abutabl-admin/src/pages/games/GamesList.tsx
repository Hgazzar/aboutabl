import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { getRequest } from "@/utils/fetchMethods";
import { useLoginUser } from "@/hooks/useLoginUser";
import { InteractiveGamesPageShell } from "./InteractiveGamesPageShell";
import {
  IG_GREEN,
  igChipOutlinedSx,
  igCircularProgressSx,
} from "./interactiveGamesTokens";
import GameCatalogImport from "./GameCatalogImport";
import {
  canManageLiveCatalog,
  liveCatalogDetailPath,
  teacherLiveCompetitionsPath,
} from "./liveGamesEntry";

type CatalogGame = {
  id: number;
  name: string;
  logo?: string | null;
  type?: string;
  time?: string;
  is_published?: boolean;
  questions_count?: number;
  entitled_school_count?: number;
  selectable_for_new_competition?: boolean;
};

/**
 * Admin Live Competitions catalog only.
 * Non-admins are redirected to teacher Live Competitions (/live-games).
 * Legacy Interactive Games UI has been retired from the active product.
 */
export default function GamesList() {
  const loginUser = useLoginUser();
  const showCatalog = canManageLiveCatalog(loginUser);

  if (!showCatalog) {
    return <Navigate to={teacherLiveCompetitionsPath()} replace />;
  }

  return <AdminLiveGamesPage />;
}

function AdminLiveGamesPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res: any = await getRequest({}, "/api/live-competitions");
      if (res?.status && Array.isArray(res.games)) {
        setGames(res.games);
      } else if (res?.status && Array.isArray(res.games?.data)) {
        setGames(res.games.data);
      } else {
        setGames([]);
      }
    } catch (err: any) {
      setGames([]);
      setError(err?.message || "Live competitions catalog is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <InteractiveGamesPageShell
      title="Live games catalog"
      subtitle="Import, publish, and entitle Live competition catalog games. Teachers start classroom sessions from Live Games."
    >
      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Catalog
      </Typography>
      <Box sx={{ mb: 3 }}>
        <GameCatalogImport onImported={load} />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={igCircularProgressSx} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} data-testid="live-games-catalog">
            {games.map((game) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`catalog-${game.id}`}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: "#091E4224",
                    borderRadius: 1,
                    height: "100%",
                    transition: "box-shadow 0.15s ease",
                    "&:hover": { boxShadow: "0 4px 12px rgba(9,30,66,0.12)" },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(liveCatalogDetailPath(game.id))}
                    sx={{ height: "100%", alignItems: "stretch" }}
                  >
                    {game.logo ? (
                      <Box
                        height={120}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor="grey.100"
                        sx={{ px: 2 }}
                      >
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {game.logo}
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        height={120}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor="grey.100"
                        sx={{ typography: "h4", color: IG_GREEN, fontWeight: 700 }}
                      >
                        {(game.name || "?").charAt(0).toUpperCase()}
                      </Box>
                    )}
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                        {game.name}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        <Chip
                          size="small"
                          label={game.type || "type"}
                          variant="outlined"
                          sx={{ textTransform: "capitalize", ...igChipOutlinedSx }}
                        />
                        <Chip
                          size="small"
                          label={game.is_published ? "Published" : "Unpublished"}
                          color={game.is_published ? "success" : "default"}
                        />
                        <Chip
                          size="small"
                          label={`${game.questions_count ?? 0} questions`}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={`${game.entitled_school_count ?? 0} schools`}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          {!games.length && !error ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              No live competition games yet. Download the template, upload media in File
              Management, then preview and confirm an import.
            </Typography>
          ) : null}
        </>
      )}
    </InteractiveGamesPageShell>
  );
}
