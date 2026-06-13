import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRequest, postRequest } from "@/utils/fetchMethods";
import { InteractiveGamesPageShell } from "./InteractiveGamesPageShell";
import { igCircularProgressSx, igContainedButtonSx, igOutlinedButtonSx } from "./interactiveGamesTokens";

export default function Waiting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getRequest({}, `/api/interactive-games/${id}`);
        if (res?.status && res.game) {
          setName(res.game.name || "");
          setType(res.game.type || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const start = async () => {
    setStarting(true);
    try {
      await postRequest({}, `/api/interactive-games/${id}/start`);
      navigate(`/games/${id}/statistics`);
    } finally {
      setStarting(false);
    }
  };

  const crumbs = [
    { label: "Live games", to: "/games" },
    { label: name || `Game #${id}` },
  ];

  return (
    <InteractiveGamesPageShell
      title="Waiting room"
      subtitle="Confirm students are connected, then start the round. Live events and the leaderboard will open on the next screens."
      crumbs={loading ? [{ label: "Live games", to: "/games" }, { label: "…" }] : crumbs}
      headerActions={
        <Button variant="outlined" size="small" sx={igOutlinedButtonSx} onClick={() => navigate("/games")}>
          All games
        </Button>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={igCircularProgressSx} />
        </Box>
      ) : (
        <Box sx={{ maxWidth: 560 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {name || `Game #${id}`}
          </Typography>
          {type ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textTransform: "capitalize" }}>
              Type: {type}
            </Typography>
          ) : (
            <Box mb={3} />
          )}
          <Button
            variant="contained"
            size="large"
            disabled={starting}
            onClick={start}
            sx={{ ...igContainedButtonSx, fontWeight: 600, px: 3, py: 1.25 }}
          >
            {starting ? "Starting…" : "Start round (live stats)"}
          </Button>
        </Box>
      )}
    </InteractiveGamesPageShell>
  );
}
