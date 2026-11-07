import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { downloadAuthenticatedFile, postRequest } from "@/utils/fetchMethods";
import {
  igContainedButtonSx,
  igOutlinedButtonSx,
  igCircularProgressSx,
} from "./interactiveGamesTokens";

type PreviewError = {
  sheet?: string;
  row?: number | null;
  field?: string;
  message: string;
};

type PreviewResponse = {
  status?: boolean;
  msg?: string;
  valid?: boolean;
  errors?: PreviewError[];
  game?: Record<string, unknown> | null;
  questions?: Array<Record<string, unknown>>;
  preview_token?: string | null;
};

type Props = {
  onImported: () => void;
};

export default function GameCatalogImport({ onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetFeedback = () => {
    setError("");
    setSuccess("");
  };

  const downloadTemplate = async () => {
    resetFeedback();
    try {
      await downloadAuthenticatedFile(
        "/api/live-competitions/template",
        "Live Competitions Template.xlsx"
      );
    } catch (err: any) {
      setError(err?.message || "Could not download the template.");
    }
  };

  const runPreview = async () => {
    if (!file) {
      setError("Choose an Excel workbook first.");
      return;
    }
    resetFeedback();
    setLoading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res: PreviewResponse = await postRequest(
        body,
        "/api/live-competitions/import/preview"
      );
      setPreview(res);
      if (!res?.valid) {
        setError(res?.msg || "Workbook failed validation.");
      }
    } catch (err: any) {
      setPreview(null);
      setError(err?.message || "Preview failed.");
    } finally {
      setLoading(false);
    }
  };

  const runConfirm = async () => {
    if (!file || !preview?.valid || !preview.preview_token) {
      setError("Preview a valid workbook before confirming.");
      return;
    }
    resetFeedback();
    setConfirming(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("preview_token", preview.preview_token);
      const res: any = await postRequest(body, "/api/live-competitions/import/confirm");
      if (res?.status) {
        setSuccess(res.msg || "Game imported as unpublished.");
        setPreview(null);
        setFile(null);
        onImported();
      } else {
        setError(res?.msg || "Import confirmation failed.");
      }
    } catch (err: any) {
      setError(err?.message || "Import confirmation failed.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Import from Excel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Preview validates the workbook without writing catalog rows. Confirm re-checks the same file and creates an unpublished game with no school entitlements.
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        <Button variant="outlined" sx={igOutlinedButtonSx} onClick={downloadTemplate}>
          Download template
        </Button>
        <Button variant="outlined" component="label" sx={igOutlinedButtonSx}>
          Choose workbook
          <input
            hidden
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              resetFeedback();
            }}
          />
        </Button>
        <Button
          variant="contained"
          sx={igContainedButtonSx}
          disabled={!file || loading}
          onClick={runPreview}
        >
          Preview
        </Button>
        <Button
          variant="contained"
          sx={igContainedButtonSx}
          disabled={!preview?.valid || confirming}
          onClick={runConfirm}
        >
          Confirm import
        </Button>
        {file ? (
          <Chip label={file.name} size="small" />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No file selected
          </Typography>
        )}
      </Box>
      {(loading || confirming) && (
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <CircularProgress size={20} sx={igCircularProgressSx} />
          <Typography variant="body2">{confirming ? "Importing…" : "Validating…"}</Typography>
        </Box>
      )}
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
      {preview?.errors?.length ? (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Sheet</TableCell>
              <TableCell>Row</TableCell>
              <TableCell>Field</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {preview.errors.map((item, index) => (
              <TableRow key={`${item.sheet}-${item.row}-${item.field}-${index}`}>
                <TableCell>{item.sheet || "—"}</TableCell>
                <TableCell>{item.row ?? "—"}</TableCell>
                <TableCell>{item.field || "—"}</TableCell>
                <TableCell>{item.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
      {preview?.valid && preview.game ? (
        <Alert severity="info" sx={{ mb: 0 }}>
          Ready to import “{String(preview.game.name || "")}” with {preview.questions?.length || 0} question(s), unpublished.
        </Alert>
      ) : null}
    </Box>
  );
}
