export type TeacherAlertType = "overdue_assignments" | "low_performance";

export type TeacherAlertCategory = "assignments" | "quizzes" | "performance";

export type TeacherAlertProgressLabel = "below_average" | "average";

export type TeacherAlertItem = {
  student_id: number;
  name: string;
  photo_url: string | null;
  class: {
    id: number;
    label: string;
    grade_name: string;
    class_name: string;
  };
  alert: {
    type: TeacherAlertType;
    category: TeacherAlertCategory;
    reason: string;
    count: number;
  };
  progress: {
    percent: number;
    label: TeacherAlertProgressLabel;
  };
};

export type TeacherAlertsResponse = {
  status: boolean;
  meta: {
    total: number;
  };
  alerts: TeacherAlertItem[];
};
