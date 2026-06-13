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
import { igCircularProgressSx, igOutlinedButtonSx, igTextButtonSx } from "./interactiveGamesTokens";

export default function Facts() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [gameName, setGameName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getRequest({}, `/api/interactive-games/${id}/facts`);
        if (res?.status && res.data) {
          setRows(res.data.leaderboard || []);
          setGameName(res.data.game?.name || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const crumbs = useMemo(
    () => [
      { label: "Live games", to: "/games" },
      { label: gameName || `Game #${id}`, to: `/games/${id}/waiting` },
      { label: "Results" },
    ],
    [gameName, id]
  );

  return (
    <InteractiveGamesPageShell
      title={`Results — ${gameName || `Game #${id}`}`}
      subtitle="Leaderboard for this session. Open a student to review their answers."
      crumbs={loading ? [{ label: "Live games", to: "/games" }, { label: "…" }] : crumbs}
      headerActions={
        <Button component={Link} to="/games" variant="outlined" size="small" sx={igOutlinedButtonSx}>
          All games
        </Button>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={igCircularProgressSx} />
        </Box>
      ) : !rows.length ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No results for this game yet.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Total correct
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.student_id} hover>
                  <TableCell>{r.student_id}</TableCell>
                  <TableCell align="right">{r.total_answer}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="text" component={Link} to={`/games/${id}/students/${r.student_id}`} sx={igTextButtonSx}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </InteractiveGamesPageShell>
  );
}
