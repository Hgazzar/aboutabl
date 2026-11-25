import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  Alert,
  Box,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import { RootState } from "@/redux/store";
import { isAdminUser } from "@/utils/authSession";
import { ApiResponseError, buildTemplateUrl } from "@/utils/fetchMethods";
import { commitQuizWorkbook, previewQuizWorkbook } from "./quizWorkbookImportApi";
import {
  ImportResult,
  PreviewPayload,
  QUIZ_WORKBOOK_TEMPLATE_PATH,
  WORKBOOK_HEADERS,
  WorkbookDecision,
  canCommit,
  cellForHeader,
  decisionsPayload,
} from "./quizWorkbookImport";

type QuizWorkbookImportPageProps = {
  activityLessonId?: number;
  onCommitted?: () => void;
};

export default function QuizWorkbookImportPage({
  activityLessonId,
  onCommitted,
}: QuizWorkbookImportPageProps = {}) {
  const { t, i18n } = useTranslation();
  const user = useSelector((state: RootState) => state.login?.user);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const [decisions, setDecisions] = useState<Record<number, WorkbookDecision | "">>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [requestError, setRequestError] = useState("");

  const admin = isAdminUser(user as Record<string, unknown> | null | undefined);
  const embedded = activityLessonId != null;
  const saveEnabled = Boolean(file) && canCommit(preview, decisions) && busy === null;

  const resetForFile = (next: File | null) => {
    setFile(next);
    setPreview(null);
    setPreviewMessage("");
    setDecisions({});
    setResult(null);
    setResultMessage("");
    setRequestError("");
  };

  const onPreview = async () => {
    if (!file || busy) return;
    setBusy("preview");
    setDecisions({});
    setResult(null);
    setResultMessage("");
    setRequestError("");
    try {
      const data = await previewQuizWorkbook(file);
      setPreview(data.preview ?? null);
      setPreviewMessage(data.msg ?? "");
    } catch (error: any) {
      setPreview(null);
      setRequestError(error?.message || t("QUIZ_WORKBOOK.REQUEST_FAILED"));
    } finally {
      setBusy(null);
    }
  };

  const onCommit = async () => {
    if (!file || !preview?.rows || !saveEnabled) return;
    setBusy("commit");
    setRequestError("");
    try {
      const data = await commitQuizWorkbook(
        file,
        decisionsPayload(preview.rows, decisions),
        activityLessonId
      );
      setResult(data.import_result ?? null);
      if (data.import_result?.written) {
        onCommitted?.();
      }
      setResultMessage(data.msg ?? "");
    } catch (error: any) {
      const body = error instanceof ApiResponseError ? error.body : null;
      if (body?.import_result) {
        setResult(body.import_result);
        setResultMessage(body.msg ?? error.message);
      } else {
        setResult(null);
        setRequestError(error?.message || t("QUIZ_WORKBOOK.REQUEST_FAILED"));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box dir={i18n.dir()} sx={embedded ? { px: 2, pt: 0, pb: 2, width: "100%" } : { p: 3 }}>
      <Typography variant={embedded ? "subtitle1" : "h5"} sx={{ mb: 1, fontWeight: 600 }}>
        {t("QUIZ_WORKBOOK.TITLE")}
      </Typography>
      {!admin ? (
        <Alert severity="warning">{t("QUIZ_WORKBOOK.ADMIN_ONLY")}</Alert>
      ) : (
        <Stack spacing={1.5} sx={{ width: "100%" }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <Button
              size="small"
              variant="outlined"
              data-testid="quiz-workbook-template"
              onClick={() =>
                window.open(
                  buildTemplateUrl(process.env.REACT_APP_BASE_URL, QUIZ_WORKBOOK_TEMPLATE_PATH),
                  "_blank"
                )
              }
            >
              {t("QUIZ_WORKBOOK.DOWNLOAD_TEMPLATE")}
            </Button>
            <Button size="small" variant="outlined" component="label">
              {t("QUIZ_WORKBOOK.CHOOSE_FILE")}
              <input
                hidden
                type="file"
                accept=".xlsx,.xls"
                data-testid="quiz-workbook-file"
                onChange={(event) => {
                  resetForFile(event.target.files?.[0] ?? null);
                }}
              />
            </Button>
            <Typography variant="body2" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {file?.name || t("QUIZ_WORKBOOK.NO_FILE")}
            </Typography>
            <Button
              size="small"
              variant="contained"
              disabled={!file || busy !== null}
              onClick={onPreview}
              data-testid="quiz-workbook-preview"
            >
              {t("QUIZ_WORKBOOK.PREVIEW")}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={!saveEnabled}
              onClick={onCommit}
              data-testid="quiz-workbook-commit"
            >
              {t("QUIZ_WORKBOOK.SAVE")}
            </Button>
          </Stack>

          {requestError ? <Alert severity="error">{requestError}</Alert> : null}
          {previewMessage ? <Alert severity={preview?.valid ? "success" : "warning"}>{previewMessage}</Alert> : null}
          {preview?.file_errors?.map((error) => (
            <Alert key={error} severity="error">
              {error}
            </Alert>
          ))}

          {preview?.rows?.length ? (
            <Box sx={{ overflow: "auto", maxHeight: embedded ? 280 : undefined, width: "100%" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("QUIZ_WORKBOOK.ROW")}</TableCell>
                    <TableCell>{t("QUIZ_WORKBOOK.STATUS")}</TableCell>
                    <TableCell>{t("QUIZ_WORKBOOK.ERRORS")}</TableCell>
                    <TableCell>{t("QUIZ_WORKBOOK.DECISION")}</TableCell>
                    {WORKBOOK_HEADERS.map((header) => (
                      <TableCell key={header}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={row.row}>
                      <TableCell>{row.row}</TableCell>
                      <TableCell>{t(`QUIZ_WORKBOOK.STATUS_${row.status}`, row.status)}</TableCell>
                      <TableCell>{(row.errors ?? []).join(" ")}</TableCell>
                      <TableCell>
                        {row.status === "duplicate" ? (
                          <TextField
                            select
                            size="small"
                            value={decisions[row.row] ?? ""}
                            data-testid={`decision-${row.row}`}
                            onChange={(event) =>
                              setDecisions((current) => ({
                                ...current,
                                [row.row]: event.target.value as WorkbookDecision,
                              }))
                            }
                            sx={{ minWidth: 160 }}
                          >
                            <MenuItem value="">{t("QUIZ_WORKBOOK.CHOOSE")}</MenuItem>
                            <MenuItem value="skip">{t("QUIZ_WORKBOOK.SKIP")}</MenuItem>
                            <MenuItem value="create_new">{t("QUIZ_WORKBOOK.CREATE_NEW")}</MenuItem>
                          </TextField>
                        ) : null}
                      </TableCell>
                      {WORKBOOK_HEADERS.map((header, index) => (
                        <TableCell key={`${row.row}-${header}`}>{cellForHeader(row.fields, index)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}

          {result ? (
            <Alert severity={result.written ? "success" : "error"} data-testid="quiz-workbook-result">
              <div>{resultMessage}</div>
              <div>
                {t("QUIZ_WORKBOOK.WRITTEN")}: {String(result.written)}
              </div>
              <div>
                {t("QUIZ_WORKBOOK.CREATED")}:{" "}
                {(result.created ?? []).map((item) => `#${item.question_id}`).join(", ")}
              </div>
              <div>
                {t("QUIZ_WORKBOOK.SKIPPED_ROWS")}: {(result.skipped ?? []).join(", ")}
              </div>
              <div>{(result.file_errors ?? []).join(" ")}</div>
            </Alert>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
