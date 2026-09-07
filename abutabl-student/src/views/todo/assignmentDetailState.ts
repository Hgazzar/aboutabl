import type {
	AssignmentActivityRow,
	AssignmentDetailPayload,
	AssignmentLifecycleMode,
} from 'lib/assignmentDetailApi';
import type { AssignTab } from 'views/dashboard/components/myAssignmentsUtils';

/** Activity statuses that count as done for action UI (mirrors MultiActivityMetrics). */
const COMPLETED_STATUSES = new Set(['completed', 'graded', 'submitted']);

export function activityIsComplete(activity: AssignmentActivityRow): boolean {
	const status = activity.submission?.status;
	return typeof status === 'string' && COMPLETED_STATUSES.has(status);
}

export function activityActionLocked(
	mode: AssignmentLifecycleMode,
	activity: AssignmentActivityRow
): boolean {
	// Waiting / Graded: student cannot continue editing the same submission cycle.
	if (mode === 'waiting_on_teacher' || mode === 'assignment_graded') return true;
	if (activityIsComplete(activity)) return true;
	return false;
}

/**
 * Hero/state MUST come from Assignment Detail API lifecycle.mode — never from the
 * dashboard tab (To Do / Past Due / Completed). Completed ≠ Graded.
 */
export function resolveDetailHeroMode(
	apiMode: AssignmentLifecycleMode,
	_dashboardTab?: AssignTab | null
): AssignmentLifecycleMode {
	void _dashboardTab;
	return apiMode;
}

export function formatDueLabel(dueAt: string | null, locale: string): string | null {
	if (!dueAt) return null;
	const date = new Date(dueAt);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat(locale.startsWith('ar') ? 'ar' : 'en', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(date);
}

export function formatSubmittedLabel(
	submittedAt: string | null,
	locale: string
): string | null {
	if (!submittedAt) return null;
	const date = new Date(submittedAt);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat(locale.startsWith('ar') ? 'ar' : 'en', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

export function heroCopyKey(mode: AssignmentLifecycleMode): {
	titleId: string;
	subtitleId: string;
} {
	if (mode === 'waiting_on_teacher') {
		return {
			titleId: 'assign-detail-hero-waiting-title',
			subtitleId: 'assign-detail-hero-waiting-subtitle',
		};
	}
	if (mode === 'assignment_graded') {
		return {
			titleId: 'assign-detail-hero-graded-title',
			subtitleId: 'assign-detail-hero-graded-subtitle',
		};
	}
	return {
		titleId: 'assign-detail-hero-active-title',
		subtitleId: 'assign-detail-hero-active-subtitle',
	};
}

/** Never invent XP / rubric / materials / redo from missing backend fields. */
export function unavailableProductFeatures(detail: AssignmentDetailPayload): {
	showXp: boolean;
	showRubric: boolean;
	showMaterials: boolean;
	showMyWork: boolean;
	showRedo: boolean;
} {
	const gradeXp =
		detail.grade?.earned_xp != null || detail.grade?.possible_xp != null;
	return {
		showXp: detail.assignment_xp != null || gradeXp,
		showRubric: detail.rubric_available === true,
		showMaterials: Array.isArray(detail.materials) && detail.materials.length > 0,
		showMyWork: Array.isArray(detail.my_work) && detail.my_work.length > 0,
		showRedo: detail.redo_allowed === true,
	};
}

/**
 * Graded XP display from API only — never compute ratios client-side beyond
 * formatting provided earned/possible values.
 */
export function gradedXpDisplay(
	grade: AssignmentDetailPayload['grade']
): { earned: number; possible: number | null } | null {
	if (!grade) return null;
	if (grade.earned_xp == null && grade.possible_xp == null) return null;
	if (grade.earned_xp == null) return null;
	return {
		earned: grade.earned_xp,
		possible: grade.possible_xp,
	};
}

export function progressLabel(
	detail: Pick<AssignmentDetailPayload, 'progress'>
): { completed: number; total: number; percent: number } {
	const completed = detail.progress.tasks_completed;
	const total = detail.progress.tasks_total;
	const percent =
		detail.progress.completion_percent != null
			? detail.progress.completion_percent
			: total > 0
				? Math.round((completed / total) * 100)
				: 0;
	return { completed, total, percent };
}

/** Final SUBMIT enabled only when API says can_submit (parent active + activities complete). */
export function canShowAssignmentSubmit(detail: AssignmentDetailPayload): boolean {
	return (
		detail.lifecycle.mode === 'homework_hero' &&
		detail.lifecycle.status === 'active' &&
		detail.lifecycle.can_submit === true
	);
}
