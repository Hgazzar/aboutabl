import { Box, Button, Divider, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createAdminEcho } from "@/utils/echo";
import { pushLiveEvent, InteractiveLiveEvent } from "@/redux/reducers/interactiveGamesReducer";
import { getRequest } from "@/utils/fetchMethods";
import { InteractiveGamesPageShell } from "./InteractiveGamesPageShell";
import { igContainedButtonSx } from "./interactiveGamesTokens";

export default function StatisticsList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [events, setEvents] = useState<InteractiveLiveEvent[]>([]);
  const [gameName, setGameName] = useState("");

  const gameId = useMemo(() => Number(id), [id]);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getRequest({}, `/api/interactive-games/${id}`);
        if (res?.status && res.game) {
          setGameName(res.game.name || "");
        }
      } catch {
        setGameName("");
      }
    })();
  }, [id]);

  useEffect(() => {
    const echo = createAdminEcho();
    const channel = echo.private(`student-online.${gameId}`);
    channel.listen(".interactive-game.status", (payload: InteractiveLiveEvent) => {
      setEvents((prev) => [...prev, payload]);
      dispatch(pushLiveEvent(payload));
    });
    return () => {
      echo.leave(`private-student-online.${gameId}`);
      echo.disconnect();
    };
  }, [gameId, dispatch]);

  const crumbs = [
    { label: "Live games", to: "/games" },
    { label: gameName || `Game #${id}`, to: `/games/${id}/waiting` },
    { label: "Live activity" },
  ];

  return (
    <InteractiveGamesPageShell
      title="Live activity"
      subtitle={
        <>
          Real-time channel:{" "}
          <Typography component="span" variant="body2" sx={{ fontFamily: "monospace", bgcolor: "grey.100", px: 0.75, borderRadius: 0.5 }}>
            private-student-online.{gameId}
          </Typography>
        </>
      }
      crumbs={crumbs}
      headerActions={
        <Button variant="contained" sx={igContainedButtonSx} onClick={() => navigate(`/games/${id}/facts`)}>
          View results
        </Button>
      }
    >
      <List dense disablePadding>
        {events.map((e, idx) => (
          <Box key={`${e.actor_id}-${idx}`}>
            {idx > 0 ? <Divider component="li" /> : null}
            <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
              <ListItemText
                primaryTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
                secondaryTypographyProps={{ variant: "body2" }}
                primary={`${e.name || "User"} (${e.actor_type})`}
                secondary={`Status: ${String(e.status)}`}
              />
            </ListItem>
          </Box>
        ))}
      </List>
      {!events.length && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          Waiting for student events… Start the round from the waiting room if you have not already.
        </Typography>
      )}
    </InteractiveGamesPageShell>
  );
}
