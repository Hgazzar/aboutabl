import { useCallback, useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ReplayIcon from "@mui/icons-material/Replay";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { deleteRequest, getRequest, postRequest } from "@/utils/fetchMethods";
import {
  ClassAlertItem,
  ClassAlertsResponse,
  ClassAlertSeverity,
} from "@/types/classAlerts";

export type ClassAlertsProps = {
  classId: number;
};

const severityStyles: Record<
  ClassAlertSeverity,
  { card: string; title: string; message: string }
> = {
  warning: {
    card: "bg-[#FBF5E9]",
    title: "text-[#8B6914]",
    message: "text-[#A67C1A]",
  },
  info: {
    card: "bg-[#EAF3FB]",
    title: "text-[#2B6CB0]",
    message: "text-[#3B82C4]",
  },
};

export const ClassAlerts = ({ classId }: ClassAlertsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ClassAlertItem[]>([]);
  const [dismissedTotal, setDismissedTotal] = useState(0);
  const [resetting, setResetting] = useState(false);
  const toastIdRef = useRef<string | number | null>(null);

  const applyPayload = (response: ClassAlertsResponse | null) => {
    if (!response?.status) {
      setItems([]);
      setDismissedTotal(0);
      return;
    }

    setItems(Array.isArray(response.items) ? response.items : []);
    setDismissedTotal(Number(response.meta?.dismissed_total ?? 0));
  };

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = (await getRequest(
        {},
        `/api/dashboard/teacher/classes/${classId}/alerts`
      )) as ClassAlertsResponse;

      applyPayload(response);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_LOAD_ERROR");
      setError(message);
      setItems([]);
      setDismissedTotal(0);
    } finally {
      setLoading(false);
    }
  }, [classId, t]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleResetHidden = async () => {
    setResetting(true);

    try {
      const response = (await postRequest(
        {},
        `/api/dashboard/teacher/classes/${classId}/alerts/reset-dismissals`
      )) as ClassAlertsResponse;

      applyPayload(response);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_RESET_ERROR");
      toast.error(message);
    } finally {
      setResetting(false);
    }
  };

  const handleUndo = async (alertKey: string, snapshot: ClassAlertItem[]) => {
    try {
      const response = (await deleteRequest(
        {},
        `/api/dashboard/teacher/classes/${classId}/alerts/${encodeURIComponent(alertKey)}`
      )) as ClassAlertsResponse;

      applyPayload(response);
    } catch {
      setItems(snapshot);
      toast.error(t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_UNDO_ERROR"));
    }
  };

  const showDismissToast = (alertKey: string, snapshot: ClassAlertItem[]) => {
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
    }

    toastIdRef.current = toast(
      ({ closeToast }) => (
        <div className="flex items-center justify-between gap-3 pr-1">
          <span className="text-sm text-[#111827]">
            {t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_DISMISSED")}
          </span>
          <button
            type="button"
            className="shrink-0 rounded-md bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#00796B] transition-colors hover:bg-[#E0F2F1]"
            onClick={() => {
              closeToast?.();
              void handleUndo(alertKey, snapshot);
            }}
          >
            {t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_UNDO")}
          </button>
        </div>
      ),
      {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        closeButton: false,
      }
    );
  };

  const handleDismiss = async (alert: ClassAlertItem) => {
    if (alert.dismissible === false) {
      return;
    }

    const snapshot = items;
    setItems((prev) => prev.filter((item) => item.alert_key !== alert.alert_key));
    setDismissedTotal((prev) => prev + 1);
    showDismissToast(alert.alert_key, snapshot);

    try {
      const response = (await postRequest(
        { alert_key: alert.alert_key },
        `/api/dashboard/teacher/classes/${classId}/alerts/dismiss`
      )) as ClassAlertsResponse;

      applyPayload(response);
    } catch {
      setItems(snapshot);
      setDismissedTotal((prev) => Math.max(0, prev - 1));
      toast.error(t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_DISMISS_ERROR"));
    }
  };

  const total = items.length;

  return (
    <section className="bg-[#F7F9FA] px-6 pb-8 pt-0 md:px-8">
      <article className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#111827] md:text-[1.0625rem]">
              {t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_TITLE")}
            </h2>

            {total > 0 ? (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-[11px] font-bold leading-none text-white">
                {total}
              </span>
            ) : null}
          </div>

          {dismissedTotal > 0 ? (
            <button
              type="button"
              onClick={() => void handleResetHidden()}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#374151] disabled:opacity-60"
            >
              {resetting ? (
                <CircularProgress size={14} sx={{ color: "#6B7280" }} />
              ) : (
                <ReplayIcon sx={{ fontSize: 16 }} />
              )}
              {t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_RESET_HIDDEN")}
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex min-h-[140px] items-center justify-center">
            <CircularProgress size={28} sx={{ color: "#00A78E" }} />
          </div>
        ) : error ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <p className="text-center text-sm text-[#B91C1C]">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-8">
            <p className="text-center text-sm text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_EMPTY")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((alert) => {
              const styles = severityStyles[alert.severity] ?? severityStyles.info;

              return (
                <div
                  key={alert.alert_key}
                  className={`rounded-xl px-4 py-3.5 sm:px-5 ${styles.card}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className={`text-sm font-bold leading-snug sm:text-[0.9375rem] ${styles.title}`}>
                          {alert.title}
                        </h3>

                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                          {alert.relative_time ? (
                            <span className="whitespace-nowrap text-xs text-[#9CA3AF]">
                              {alert.relative_time}
                            </span>
                          ) : null}

                          {alert.dismissible !== false ? (
                            <button
                              type="button"
                              onClick={() => void handleDismiss(alert)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#9CA3AF] transition-colors hover:bg-black/5 hover:text-[#6B7280]"
                              aria-label={t("TEACHER_CLASS_DETAILS.CLASS_ALERTS_DISMISS")}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <p className={`mt-1.5 text-sm leading-relaxed ${styles.message}`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
};

export default ClassAlerts;
