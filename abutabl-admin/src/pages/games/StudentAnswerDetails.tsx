import {
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { getRequest } from "@/utils/fetchMethods";
import { InteractiveGamesPageShell } from "./InteractiveGamesPageShell";
import { igCircularProgressSx, igOutlinedButtonSx } from "./interactiveGamesTokens";

export default function StudentAnswerDetails() {
  const { id, studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<any[]>([]);
  const [gameName, setGameName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [ansRes, gameRes]: any[] = await Promise.all([
          getRequest({}, `/api/interactive-games/${id}/students/${studentId}/answers`),
          getRequest({}, `/api/interactive-games/${id}`),
        ]);
        if (ansRes?.status && ansRes.data) {
          setAnswers(ansRes.data.student_answers || []);
        }
        if (gameRes?.status && gameRes.game) {
          setGameName(gameRes.game.name || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, studentId]);

  const crumbs = useMemo(
    () => [
      { label: "Live games", to: "/games" },
      { label: gameName || `Game #${id}`, to: `/games/${id}/waiting` },
      { label: "Results", to: `/games/${id}/facts` },
      { label: `Student ${studentId}` },
    ],
    [gameName, id, studentId]
  );

  return (
    <InteractiveGamesPageShell
      title={`Student ${studentId} — answers`}
      subtitle={gameName ? `Game: ${gameName}` : undefined}
      crumbs={loading ? [{ label: "Live games", to: "/games" }, { label: "…" }] : crumbs}
      headerActions={
        <Button component={Link} to={`/games/${id}/facts`} variant="outlined" size="small" sx={igOutlinedButtonSx}>
          Back to leaderboard
        </Button>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={igCircularProgressSx} />
        </Box>
      ) : !answers.length ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No answers recorded for this student today.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 600 }}>Question ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Answer</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Correct
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {answers.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.interactive_game_question_id}</TableCell>
                  <TableCell>{a.answer}</TableCell>
                  <TableCell align="right">{a.correct ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </InteractiveGamesPageShell>
  );
}
