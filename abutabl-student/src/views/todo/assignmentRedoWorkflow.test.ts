import { describe, expect, it, vi } from 'vitest';
import { parseAssignmentDetailPayload } from 'lib/assignmentDetailApi';
import {
	assignmentHeaderDisplay,
	canShowActivityRedo,
	canShowAssignmentRedo,
	canShowAssignmentSubmit,
} from './assignmentDetailState';
import { isMyWorkLockedFromDetail } from './assignmentMyWorkState';
import {
	ASSIGNMENT_REDO_BUSY_ID,
	activitiesUnchangedByLocalReset,
	executeAssignmentRedo,
	shouldBlockAssignmentRedoClick,
} from './assignmentRedoWorkflow';

function detail(overrides: Record<string, unknown> = {}) {
	const base = {
		assign_id: 433,
		assign_student_id: 3,
		title: 'Practice Pack',
		due_at: '2026-12-31T18:00:00+00:00',
		type: 'learning_activities',
		subject_id: 2,
		subject_name: 'English',
		unit_id: null,
		unit_name: null,
		lesson_id: null,
		lesson_name: null,
		context_label: null,
		progress: {
			tasks_completed: 2,
			tasks_total: 3,
			completion_percent: 67,
			fully_complete: false,
			last_submitted_at: '2026-09-07T20:00:00+00:00',
			score_percent: null,
		},
		lifecycle: {
			mode: 'waiting_on_teacher',
			status: 'submitted',
			submitted_at: '2026-09-07T20:00:00+00:00',
			is_late: false,
			is_overdue: false,
			source: 'assigns_students',
			can_submit: false,
			redo_allowed: true,
		},
		teacher_feedback_items: [],
		grade: null,
		activities: [
			{
				assign_activity_id: 1,
				assign_id: 433,
				activity_type: 'ebook',
				activity_id: 10,
				source_table: 'lessons_contents',
				grading_mode: 'automatic_completeness',
				title: 'Book',
				sort_order: 0,
				subject_id: 2,
				path: '/learn/2/details/10',
				redo_allowed: false,
				submission: {
					id: 1,
					status: 'completed',
					score: null,
					max_score: null,
					percent: 100,
					completeness: 100,
					submitted_at: '2026-09-01T10:00:00+00:00',
					graded_at: '2026-09-01T10:00:00+00:00',
					teacher_feedback: null,
				},
			},
			{
				assign_activity_id: 2,
				assign_id: 433,
				activity_type: 'quiz',
				activity_id: 20,
				source_table: 'quizes',
				grading_mode: 'automatic_accuracy',
				title: 'Quiz',
				sort_order: 1,
				subject_id: 2,
				path: '/learn/2/quiz/20',
				redo_allowed: false,
				submission: {
					id: 2,
					status: 'completed',
					score: 8,
					max_score: 10,
					percent: 80,
					completeness: 100,
					submitted_at: '2026-09-01T11:00:00+00:00',
					graded_at: '2026-09-01T11:00:00+00:00',
					teacher_feedback: null,
				},
			},
			{
				assign_activity_id: 3,
				assign_id: 433,
				activity_type: 'worksheet',
				activity_id: 30,
				source_table: 'worksheets',
				grading_mode: 'teacher_manual',
				title: 'Sheet',
				sort_order: 2,
				subject_id: 2,
				path: null,
				redo_allowed: false,
				submission: null,
			},
		],
		materials: [],
		my_work: [],
		rubric_available: false,
		rubric: null,
		assignment_xp: null,
		redo_allowed: true,
		...overrides,
	};
	return parseAssignmentDetailPayload(base)!;
}

describe('Assignment REDO workflow', () => {
	it('1) Submitted + redo_allowed=true → REDO visible', () => {
		const parsed = detail();
		expect(canShowAssignmentRedo(parsed)).toBe(true);
		expect(assignmentHeaderDisplay(parsed).statusKind).toBe('waiting');
	});

	it('2) Submitted + redo_allowed=false → REDO hidden', () => {
		const parsed = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-09-07T20:00:00+00:00',
				is_late: true,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
		});
		expect(canShowAssignmentRedo(parsed)).toBe(false);
		expect(assignmentHeaderDisplay(parsed).statusKind).toBe('waiting');
	});

	it('3) Graded → REDO hidden', () => {
		const parsed = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'assignment_graded',
				status: 'graded',
				submitted_at: '2026-09-07T20:00:00+00:00',
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
		});
		expect(canShowAssignmentRedo(parsed)).toBe(false);
		expect(canShowAssignmentSubmit(parsed)).toBe(false);
	});

	it('4) REDO click calls Assignment REDO API exactly once', async () => {
		const submitted = detail();
		const after = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				submitted_at: null,
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
			progress: {
				...submitted.progress,
				last_submitted_at: null,
			},
		});
		const redo = vi.fn().mockResolvedValue(after);
		const refresh = vi.fn().mockResolvedValue(after);

		const result = await executeAssignmentRedo({
			assignId: submitted.assign_id,
			redo,
			refresh,
		});

		expect(redo).toHaveBeenCalledTimes(1);
		expect(redo).toHaveBeenCalledWith(433);
		expect(result.ok).toBe(true);
	});

	it('5) During request → button blocked (busy token)', () => {
		expect(
			shouldBlockAssignmentRedoClick({
				canShow: true,
				busyId: ASSIGNMENT_REDO_BUSY_ID,
			})
		).toBe(true);
		expect(
			shouldBlockAssignmentRedoClick({
				canShow: true,
				busyId: null,
			})
		).toBe(false);
		expect(
			shouldBlockAssignmentRedoClick({
				canShow: false,
				busyId: null,
			})
		).toBe(true);
	});

	it('6–9) Successful REDO refreshes Detail → active, Waiting/REDO gone', async () => {
		const submitted = detail();
		const after = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				submitted_at: null,
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
			progress: {
				tasks_completed: 2,
				tasks_total: 3,
				completion_percent: 67,
				fully_complete: false,
				last_submitted_at: null,
				score_percent: null,
			},
			activities: submitted.activities.map((a) => ({
				...a,
				redo_allowed: a.submission?.status === 'completed',
			})),
		});
		const redo = vi.fn().mockResolvedValue(after);
		const refresh = vi.fn().mockResolvedValue(after);

		const result = await executeAssignmentRedo({
			assignId: submitted.assign_id,
			redo,
			refresh,
		});

		expect(refresh).toHaveBeenCalledTimes(1);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.detail.lifecycle.status).toBe('active');
		expect(assignmentHeaderDisplay(result.detail).statusKind).toBe('homework');
		expect(canShowAssignmentRedo(result.detail)).toBe(false);
		expect(canShowAssignmentSubmit(result.detail)).toBe(false);
	});

	it('10) Existing activities are NOT locally reset after Assignment REDO', async () => {
		const submitted = detail();
		const after = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				submitted_at: null,
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
			activities: submitted.activities,
		});
		const result = await executeAssignmentRedo({
			assignId: submitted.assign_id,
			redo: async () => after,
			refresh: async () => after,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(
			activitiesUnchangedByLocalReset(submitted.activities, result.detail.activities)
		).toBe(true);
		expect(result.detail.activities[0].submission?.status).toBe('completed');
		expect(result.detail.activities[1].submission?.status).toBe('completed');
		expect(result.detail.activities[2].submission).toBeNull();
	});

	it('11) My Work becomes editable via parent-status lock after REDO', () => {
		const submitted = detail();
		expect(isMyWorkLockedFromDetail(submitted)).toBe(true);

		const after = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				submitted_at: null,
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
		});
		expect(isMyWorkLockedFromDetail(after)).toBe(false);
	});

	it('12) Existing Submit logic reused after REDO (backend can_submit)', () => {
		const incompleteActive = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				submitted_at: null,
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
		});
		expect(canShowAssignmentSubmit(incompleteActive)).toBe(false);

		const completeActive = detail({
			redo_allowed: false,
			progress: {
				tasks_completed: 3,
				tasks_total: 3,
				completion_percent: 100,
				fully_complete: true,
				last_submitted_at: null,
				score_percent: null,
			},
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				submitted_at: null,
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: true,
				redo_allowed: false,
			},
		});
		expect(canShowAssignmentSubmit(completeActive)).toBe(true);
	});

	it('13) Submit after REDO returns Waiting + REDO when backend allows', () => {
		const resubmitted = detail({
			redo_allowed: true,
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-09-08T12:00:00+00:00',
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: true,
			},
		});
		expect(assignmentHeaderDisplay(resubmitted).statusKind).toBe('waiting');
		expect(canShowAssignmentRedo(resubmitted)).toBe(true);
		expect(canShowAssignmentSubmit(resubmitted)).toBe(false);
	});

	it('14) EN/AR redo labels stay on translation keys', async () => {
		const en = await import('../../translations/EN/translation.json');
		const ar = await import('../../translations/AR/translation.json');
		expect(en.default['assign-detail-redo-assignment']).toBe('REDO');
		expect(ar.default['assign-detail-redo-assignment']).toBe('إعادة');
	});

	it('15) RTL: header display helpers remain locale-agnostic (statusKind)', () => {
		const parsed = detail();
		const header = assignmentHeaderDisplay(parsed);
		expect(header.statusKind).toBe('waiting');
		expect(canShowAssignmentRedo(parsed)).toBe(true);
		expect(header.showSubmit).toBe(false);
	});

	it('Activity REDO remains independent after parent is active', () => {
		const after = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				submitted_at: null,
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
			activities: [
				{
					assign_activity_id: 1,
					assign_id: 433,
					activity_type: 'ebook',
					activity_id: 10,
					source_table: 'lessons_contents',
					grading_mode: 'automatic_completeness',
					title: 'Book',
					sort_order: 0,
					subject_id: 2,
					path: '/learn/2/details/10',
					redo_allowed: true,
					submission: {
						id: 1,
						status: 'completed',
						score: null,
						max_score: null,
						percent: 100,
						completeness: 100,
						submitted_at: null,
						graded_at: null,
						teacher_feedback: null,
					},
				},
			],
		});
		expect(canShowAssignmentRedo(after)).toBe(false);
		expect(canShowActivityRedo(after.activities[0])).toBe(true);
	});

	it('On REDO rejection: refresh Detail so button can hide', async () => {
		const locked = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-09-07T20:00:00+00:00',
				is_late: true,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
		});
		const redo = vi.fn().mockRejectedValue(new Error('deadline passed'));
		const refresh = vi.fn().mockResolvedValue(locked);

		const result = await executeAssignmentRedo({
			assignId: 433,
			redo,
			refresh,
		});

		expect(result.ok).toBe(false);
		expect(refresh).toHaveBeenCalledTimes(1);
		expect(result.detail).toEqual(locked);
		expect(canShowAssignmentRedo(result.detail!)).toBe(false);
	});

	it('On successful POST, falls back to redo payload if refresh GET fails', async () => {
		const after = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				submitted_at: null,
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
		});
		const redo = vi.fn().mockResolvedValue(after);
		const refresh = vi.fn().mockRejectedValue(new Error('network'));
		const result = await executeAssignmentRedo({
			assignId: 433,
			redo,
			refresh,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.detail.lifecycle.status).toBe('active');
		expect(canShowAssignmentRedo(result.detail)).toBe(false);
	});
});
