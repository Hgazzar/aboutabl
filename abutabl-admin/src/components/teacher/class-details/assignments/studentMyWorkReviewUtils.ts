import type { LearningActivitiesReviewMyWorkItem } from "@/api/classAssignmentsApi";

export function sortedReviewMyWorkItems(
  items: LearningActivitiesReviewMyWorkItem[] | null | undefined
): LearningActivitiesReviewMyWorkItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  return [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.id - b.id;
  });
}

export function formatReviewMyWorkSize(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) {
    return null;
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value >= 10 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}

export function formatReviewMyWorkDuration(
  durationMs: number | null | undefined
): string | null {
  if (durationMs == null || !Number.isFinite(durationMs) || durationMs <= 0) {
    return null;
  }
  const totalSec = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** My Work must never be treated as an assign_activity. */
export function isMyWorkAnActivity(): false {
  return false;
}

/**
 * Review payload already embeds my_work per student — no extra API calls.
 * Returns the same array reference from the student row (no fetch).
 */
export function myWorkFromReviewStudentRow(
  studentRow: { my_work?: LearningActivitiesReviewMyWorkItem[] } | null | undefined
): LearningActivitiesReviewMyWorkItem[] {
  return Array.isArray(studentRow?.my_work) ? studentRow!.my_work! : [];
}
