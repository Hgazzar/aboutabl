import type {
	AssignmentActivityRow,
	AssignmentDetailPayload,
	AssignmentLifecycleMode,
} from 'lib/assignmentDetailApi';
import { apiFlagTrue } from 'lib/assignmentDetailApi';
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
		showRubric: detail.rubric_available === true && detail.rubric != null,
		showMaterials: Array.isArray(detail.materials) && detail.materials.length > 0,
		showMyWork: Array.isArray(detail.my_work) && detail.my_work.length > 0,
		// Assignment-level REDO only (header) — backend authoritative.
		showRedo: apiFlagTrue(detail.redo_allowed) || apiFlagTrue(detail.lifecycle.redo_allowed),
	};
}

/**
 * Assignment-level REDO (header).
 * Backend `redo_allowed` is authoritative (already encodes submitted + before deadline + not graded).
 * Do not re-derive deadline on the client.
 */
export function canShowAssignmentRedo(detail: AssignmentDetailPayload): boolean {
	return apiFlagTrue(detail.redo_allowed) || apiFlagTrue(detail.lifecycle.redo_allowed);
}

/** Activity-level REDO — per-activity API flag only. */
export function canShowActivityRedo(activity: AssignmentActivityRow): boolean {
	return apiFlagTrue(activity.redo_allowed);
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

/** Final SUBMIT — backend lifecycle.can_submit is authoritative. */
export function canShowAssignmentSubmit(detail: AssignmentDetailPayload): boolean {
	return apiFlagTrue(detail.lifecycle.can_submit);
}

/**
 * Student Assignment Header — authoritative API fields only.
 * Layout: "{Subject} Homework:" then Assignment title on the next line.
 * Never parse title for Subject; never gate Submit on context_label.
 */
export type AssignmentHeaderDisplay = {
	subjectName: string | null;
	/** homework | waiting | null (graded uses separate status UI) */
	statusKind: 'homework' | 'waiting' | null;
	/** assigns.assigned_name from API `title` — display only, not Subject. */
	assignmentTitle: string | null;
	/** Lesson/Unit when authoritative; optional tertiary line. */
	contextLabel: string | null;
	showSubmit: boolean;
};

export function assignmentHeaderDisplay(
	detail: AssignmentDetailPayload
): AssignmentHeaderDisplay {
	const subjectName =
		typeof detail.subject_name === 'string' && detail.subject_name.trim() !== ''
			? detail.subject_name.trim()
			: null;

	const assignmentTitle =
		typeof detail.title === 'string' && detail.title.trim() !== ''
			? detail.title.trim()
			: null;

	const contextLabel =
		typeof detail.context_label === 'string' && detail.context_label.trim() !== ''
			? detail.context_label.trim()
			: null;

	let statusKind: AssignmentHeaderDisplay['statusKind'] = null;
	if (
		detail.lifecycle.mode === 'waiting_on_teacher' ||
		detail.lifecycle.status === 'submitted'
	) {
		statusKind = 'waiting';
	} else if (
		detail.lifecycle.mode === 'homework_hero' ||
		detail.lifecycle.status === 'active'
	) {
		statusKind = 'homework';
	}

	return {
		subjectName,
		statusKind,
		assignmentTitle,
		contextLabel,
		// Independent of contextLabel — lifecycle.can_submit only.
		showSubmit: canShowAssignmentSubmit(detail),
	};
}

/** Criteria ordered for Rubric Popup (API sort_order ascending, then id). */
export function sortedRubricCriteria(
	rubric: AssignmentDetailPayload['rubric']
): NonNullable<AssignmentDetailPayload['rubric']>['criteria'] {
	if (!rubric) return [];
	return [...rubric.criteria].sort((a, b) => {
		if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
		return a.id - b.id;
	});
}

/** Levels ordered by points descending (4 → 1) using API points only. */
export function sortedRubricLevels(
	rubric: AssignmentDetailPayload['rubric']
): NonNullable<AssignmentDetailPayload['rubric']>['levels'] {
	if (!rubric) return [];
	return [...rubric.levels].sort((a, b) => b.points - a.points);
}

export function rubricLevelDescriptorVisible(descriptor: string | null): boolean {
	return typeof descriptor === 'string' && descriptor.trim() !== '';
}

/**
 * After "Great work" / "أحسنت", insert student name then ", " and keep the rest.
 * e.g. "Great work! Your teacher…" → "Great work Alex, Your teacher…"
 */
export function insertStudentNameAfterGreatWork(
	text: string,
	studentName: string | null | undefined
): string {
	const name = typeof studentName === 'string' ? studentName.trim() : '';
	if (!name || !text) return text;

	const alreadyNamed = new RegExp(
		`(?:Great work|أحسنت)\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[,،]`,
		'i'
	);
	if (alreadyNamed.test(text)) return text;

	if (/Great work/i.test(text)) {
		return text.replace(/Great work(?:\s*[—–\-!])?\s*/i, `Great work ${name}, `);
	}

	if (/أحسنت/.test(text)) {
		return text.replace(/أحسنت(?:\s*[—–\-!])?\s*/, `أحسنت ${name}، `);
	}

	return text;
}
