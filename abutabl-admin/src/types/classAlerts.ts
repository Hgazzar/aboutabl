export type ClassAlertSeverity = "warning" | "info";

export type ClassAlertType = "performance" | "deadline" | string;

export type ClassAlertItem = {
  alert_key: string;
  type: ClassAlertType;
  severity: ClassAlertSeverity;
  title: string;
  message: string;
  relative_time: string | null;
  created_at: string | null;
  payload?: Record<string, unknown>;
  dismissible?: boolean;
};

export type ClassAlertsResponse = {
  status: boolean;
  source: string;
  class_id: number;
  meta: {
    total: number;
    dismissed_total: number;
  };
  items: ClassAlertItem[];
};
