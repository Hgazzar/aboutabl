import { getRequest, postRequest } from 'lib/requests';
import { parseStudentApiPayload } from 'lib/studentApiResponse';

export type AssignmentActivitySubmission = {
	id: number;
	status: string;
	score: number | null;
	max_score: number | null;
	percent: number | null;
	completeness: number | null;
	submitted_at: string | null;
	graded_at: string | null;
	teacher_feedback: string | null;
};

export type AssignmentActivityRow = {
	assign_activity_id: number;
	assign_id: number;
	activity_type: string;
	activity_id: number;
	source_table: string;
	grading_mode: string;
	title: string;
	sort_order: number;
	subject_id: number;
	path: string | null;
	submission: AssignmentActivitySubmission | null;
};

export type AssignmentLifecycleMode =
	| 'homework_hero'
	| 'waiting_on_teacher'
	| 'assignment_graded';

export type AssignmentTeacherFeedbackItem = {
	assign_activity_id: number;
	activity_type: string;
	activity_title: string;
	teacher_feedback: string;
	graded_at: string | null;
};

/** Phase 3C finalized Assignment Grade (null when absent / not finalized). */
export type AssignmentGradeBadge = {
	key: string;
	label: string;
};

export type AssignmentGradeCriterion = {
	criterion_id: number;
	points: number;
};

export type AssignmentGradePayload = {
	id: number | null;
	assign_id: number | null;
	assign_student_id: number | null;
	status: string;
	final_percent: number | null;
	possible_xp: number | null;
	earned_xp: number | null;
	badge: AssignmentGradeBadge | null;
	teacher_feedback: string | null;
	graded_by: number | null;
	finalized_at: string | null;
	/** Preserved for Phase 4D Rubric View — do not invent labels/weights. */
	criteria: AssignmentGradeCriterion[];
};

export type AssignmentDetailPayload = {
	assign_id: number;
	assign_student_id: number | null;
	title: string;
	due_at: string | null;
	type: string;
	subject_id: number;
	progress: {
		tasks_completed: number;
		tasks_total: number;
		completion_percent: number | null;
		fully_complete: boolean;
		last_submitted_at: string | null;
		score_percent: number | null;
	};
	lifecycle: {
		mode: AssignmentLifecycleMode;
		status: 'active' | 'submitted' | 'graded';
		submitted_at: string | null;
		is_late: boolean;
		is_overdue: boolean;
		source: string;
		can_submit: boolean;
	};
	teacher_feedback_items: AssignmentTeacherFeedbackItem[];
	grade: AssignmentGradePayload | null;
	activities: AssignmentActivityRow[];
	materials: unknown[];
	my_work: unknown[];
	rubric_available: boolean;
	assignment_xp: number | null;
	redo_allowed: boolean;
};

function asNullableNumber(value: unknown): number | null {
	if (value == null || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

function asStringOrNull(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	return s === '' ? null : s;
}

function parseSubmission(raw: unknown): AssignmentActivitySubmission | null {
	if (!raw || typeof raw !== 'object') return null;
	const row = raw as Record<string, unknown>;
	const id = asNullableNumber(row.id);
	const status = asStringOrNull(row.status);
	if (id == null || !status) return null;
	return {
		id,
		status,
		score: asNullableNumber(row.score),
		max_score: asNullableNumber(row.max_score),
		percent: asNullableNumber(row.percent),
		completeness: asNullableNumber(row.completeness),
		submitted_at: asStringOrNull(row.submitted_at),
		graded_at: asStringOrNull(row.graded_at),
		teacher_feedback: asStringOrNull(row.teacher_feedback),
	};
}

function parseActivity(raw: unknown): AssignmentActivityRow | null {
	if (!raw || typeof raw !== 'object') return null;
	const row = raw as Record<string, unknown>;
	const assignActivityId = asNullableNumber(row.assign_activity_id);
	const activityId = asNullableNumber(row.activity_id);
	if (assignActivityId == null || activityId == null) return null;
	return {
		assign_activity_id: assignActivityId,
		assign_id: asNullableNumber(row.assign_id) ?? 0,
		activity_type: String(row.activity_type ?? ''),
		activity_id: activityId,
		source_table: String(row.source_table ?? ''),
		grading_mode: String(row.grading_mode ?? ''),
		title: String(row.title ?? ''),
		sort_order: asNullableNumber(row.sort_order) ?? 0,
		subject_id: asNullableNumber(row.subject_id) ?? 0,
		path: asStringOrNull(row.path),
		submission: parseSubmission(row.submission),
	};
}

function parseLifecycleMode(value: unknown): AssignmentLifecycleMode {
	// Accept current product names + Phase 1 aliases for safety.
	if (value === 'waiting_on_teacher' || value === 'awaiting_review') {
		return 'waiting_on_teacher';
	}
	if (value === 'assignment_graded' || value === 'has_teacher_grades') {
		return 'assignment_graded';
	}
	if (value === 'homework_hero' || value === 'active') {
		return 'homework_hero';
	}
	return 'homework_hero';
}

function parseLifecycleStatus(value: unknown): 'active' | 'submitted' | 'graded' {
	if (value === 'submitted' || value === 'graded' || value === 'active') {
		return value;
	}
	return 'active';
}

function parseGradeBadge(raw: unknown): AssignmentGradeBadge | null {
	if (!raw || typeof raw !== 'object') return null;
	const row = raw as Record<string, unknown>;
	const key = asStringOrNull(row.key);
	const label = asStringOrNull(row.label);
	if (!key || !label) return null;
	return { key, label };
}

function parseGradeCriteria(raw: unknown): AssignmentGradeCriterion[] {
	if (!Array.isArray(raw)) return [];
	const out: AssignmentGradeCriterion[] = [];
	for (const item of raw) {
		if (!item || typeof item !== 'object') continue;
		const row = item as Record<string, unknown>;
		const criterionId = asNullableNumber(row.criterion_id);
		const points = asNullableNumber(row.points);
		if (criterionId == null || points == null) continue;
		out.push({ criterion_id: criterionId, points });
	}
	return out;
}

/** Parse Phase 3C grade object; returns null when absent or not an object. */
export function parseAssignmentGradePayload(raw: unknown): AssignmentGradePayload | null {
	if (!raw || typeof raw !== 'object') return null;
	const row = raw as Record<string, unknown>;
	const status = asStringOrNull(row.status);
	if (!status) return null;

	return {
		id: asNullableNumber(row.id),
		assign_id: asNullableNumber(row.assign_id),
		assign_student_id: asNullableNumber(row.assign_student_id),
		status,
		final_percent: asNullableNumber(row.final_percent),
		possible_xp: asNullableNumber(row.possible_xp),
		earned_xp: asNullableNumber(row.earned_xp),
		badge: parseGradeBadge(row.badge),
		teacher_feedback: asStringOrNull(row.teacher_feedback),
		graded_by: asNullableNumber(row.graded_by),
		finalized_at: asStringOrNull(row.finalized_at),
		criteria: parseGradeCriteria(row.criteria),
	};
}

export function parseAssignmentDetailPayload(raw: unknown): AssignmentDetailPayload | null {
	if (!raw || typeof raw !== 'object') return null;
	const row = raw as Record<string, unknown>;
	const assignId = asNullableNumber(row.assign_id);
	if (assignId == null) return null;

	const progressRaw =
		row.progress && typeof row.progress === 'object'
			? (row.progress as Record<string, unknown>)
			: {};
	const lifecycleRaw =
		row.lifecycle && typeof row.lifecycle === 'object'
			? (row.lifecycle as Record<string, unknown>)
			: {};

	const activities = Array.isArray(row.activities)
		? row.activities.map(parseActivity).filter((a): a is AssignmentActivityRow => a != null)
		: [];

	const feedbackItems = Array.isArray(row.teacher_feedback_items)
		? row.teacher_feedback_items
				.map((item) => {
					if (!item || typeof item !== 'object') return null;
					const f = item as Record<string, unknown>;
					const feedback = asStringOrNull(f.teacher_feedback);
					const activityId = asNullableNumber(f.assign_activity_id);
					if (!feedback || activityId == null) return null;
					return {
						assign_activity_id: activityId,
						activity_type: String(f.activity_type ?? ''),
						activity_title: String(f.activity_title ?? ''),
						teacher_feedback: feedback,
						graded_at: asStringOrNull(f.graded_at),
					};
				})
				.filter((f): f is AssignmentTeacherFeedbackItem => f != null)
		: [];

	const mode = parseLifecycleMode(lifecycleRaw.mode);
	const statusFromApi = parseLifecycleStatus(lifecycleRaw.status);
	const status =
		lifecycleRaw.status != null
			? statusFromApi
			: mode === 'assignment_graded'
				? 'graded'
				: mode === 'waiting_on_teacher'
					? 'submitted'
					: 'active';

	return {
		assign_id: assignId,
		assign_student_id: asNullableNumber(row.assign_student_id),
		title: String(row.title ?? ''),
		due_at: asStringOrNull(row.due_at),
		type: String(row.type ?? ''),
		subject_id: asNullableNumber(row.subject_id) ?? 0,
		progress: {
			tasks_completed: asNullableNumber(progressRaw.tasks_completed) ?? 0,
			tasks_total: asNullableNumber(progressRaw.tasks_total) ?? 0,
			completion_percent: asNullableNumber(progressRaw.completion_percent),
			fully_complete: progressRaw.fully_complete === true,
			last_submitted_at: asStringOrNull(progressRaw.last_submitted_at),
			score_percent: asNullableNumber(progressRaw.score_percent),
		},
		lifecycle: {
			mode,
			status,
			submitted_at: asStringOrNull(lifecycleRaw.submitted_at),
			is_late: lifecycleRaw.is_late === true,
			is_overdue: lifecycleRaw.is_overdue === true,
			source:
				typeof lifecycleRaw.source === 'string' && lifecycleRaw.source
					? lifecycleRaw.source
					: 'assigns_students',
			can_submit: lifecycleRaw.can_submit === true,
		},
		teacher_feedback_items: feedbackItems,
		grade: parseAssignmentGradePayload(row.grade),
		activities,
		materials: Array.isArray(row.materials) ? row.materials : [],
		my_work: Array.isArray(row.my_work) ? row.my_work : [],
		rubric_available: row.rubric_available === true,
		assignment_xp: asNullableNumber(row.assignment_xp),
		redo_allowed: row.redo_allowed === true,
	};
}

export async function fetchAssignmentDetail(assignId: number): Promise<AssignmentDetailPayload> {
	const response = await getRequest(`assigns/${assignId}/learning_activities`);
	const payload = parseStudentApiPayload<unknown>(response, 'data');
	const parsed = parseAssignmentDetailPayload(payload);
	if (!parsed) {
		throw new Error('Invalid assignment detail payload');
	}
	return parsed;
}

export async function submitAssignActivity(assignActivityId: number): Promise<void> {
	const response = await postRequest(`assign-activities/${assignActivityId}/submit`, {});
	if (!response || response.status !== true) {
		throw new Error(String(response?.msg || 'Submit failed'));
	}
}

export async function submitAssignmentParent(
	assignId: number
): Promise<AssignmentDetailPayload> {
	const response = await postRequest(`assigns/${assignId}/submit`, {});
	const payload = parseStudentApiPayload<unknown>(response, 'data');
	const parsed = parseAssignmentDetailPayload(payload);
	if (!parsed) {
		throw new Error(String(response?.msg || 'Assignment submit failed'));
	}
	return parsed;
}
