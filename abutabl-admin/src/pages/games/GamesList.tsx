import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getRequest } from "@/utils/fetchMethods";
import { InteractiveGamesPageShell } from "./InteractiveGamesPageShell";
import { IG_GREEN, igChipOutlinedSx, igCircularProgressSx } from "./interactiveGamesTokens";

type Game = {
  id: number;
  name: string;
  logo?: string;
  type: string;
};

export default function GamesList() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getRequest({}, "/api/interactive-games");
        if (res?.status && Array.isArray(res.games)) {
          setGames(res.games);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <InteractiveGamesPageShell
      title="Live games"
      subtitle="Run classroom sessions, view live activity, and open results — pick a game to go to the waiting room."
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={igCircularProgressSx} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {games.map((game) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={game.id}>
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
                  <CardActionArea onClick={() => navigate(`/games/${game.id}/waiting`)} sx={{ height: "100%", alignItems: "stretch" }}>
                    {game.logo ? (
                      <CardMedia
                        component="img"
                        height="160"
                        image={
                          game.logo.startsWith("http")
                            ? game.logo
                            : `${window.location.origin}/${game.logo.replace(/^\//, "")}`
                        }
                        alt={game.name}
                        sx={{ objectFit: "contain", bgcolor: "grey.100" }}
                      />
                    ) : (
                      <Box
                        height={160}
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
                      <Chip size="small" label={game.type} variant="outlined" sx={{ textTransform: "capitalize", ...igChipOutlinedSx }} />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          {!games.length && (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              No interactive games yet. Seed <code>interactive_games</code> in the database (see backend docs).
            </Typography>
          )}
        </>
      )}
    </InteractiveGamesPageShell>
  );
}
