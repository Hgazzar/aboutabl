import { describe, expect, it } from 'vitest';
import { parseAssignmentDetailPayload } from 'lib/assignmentDetailApi';
import {
	activityActionLocked,
	canShowAssignmentSubmit,
	heroCopyKey,
	resolveDetailHeroMode,
} from './assignmentDetailState';

describe('assignment Phase 2 parent lifecycle', () => {
	it('enables SUBMIT only when API can_submit is true on homework_hero', () => {
		const ready = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			progress: { tasks_completed: 1, tasks_total: 1, fully_complete: true },
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				can_submit: true,
				is_overdue: false,
				is_late: false,
				submitted_at: null,
				source: 'assigns_students',
			},
			activities: [],
		});
		expect(canShowAssignmentSubmit(ready!)).toBe(true);

		const notReady = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			progress: { tasks_completed: 0, tasks_total: 1, fully_complete: false },
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				can_submit: false,
				source: 'assigns_students',
			},
			activities: [],
		});
		expect(canShowAssignmentSubmit(notReady!)).toBe(false);
	});

	it('maps parent submitted/graded to Waiting/Graded heroes; Completed tab ignored', () => {
		const waiting = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			progress: { tasks_completed: 1, tasks_total: 1 },
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-04-04T18:17:00+00:00',
				is_late: true,
				can_submit: false,
				source: 'assigns_students',
			},
			activities: [],
		});
		expect(waiting?.lifecycle.mode).toBe('waiting_on_teacher');
		expect(waiting?.lifecycle.submitted_at).toContain('2026-04-04');
		expect(heroCopyKey(waiting!.lifecycle.mode).titleId).toContain('waiting');
		expect(resolveDetailHeroMode(waiting!.lifecycle.mode, 'completed')).toBe(
			'waiting_on_teacher'
		);
		expect(canShowAssignmentSubmit(waiting!)).toBe(false);
		expect(activityActionLocked('waiting_on_teacher', {
			assign_activity_id: 1,
			assign_id: 1,
			activity_type: 'quiz',
			activity_id: 1,
			source_table: 'quizes',
			grading_mode: 'automatic_accuracy',
			title: 'Q',
			sort_order: 0,
			subject_id: 1,
			path: null,
			submission: null,
		})).toBe(true);

		const graded = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			progress: { tasks_completed: 1, tasks_total: 1 },
			lifecycle: {
				mode: 'assignment_graded',
				status: 'graded',
				can_submit: false,
				source: 'assigns_students',
			},
			activities: [],
		});
		expect(graded?.lifecycle.status).toBe('graded');
		expect(heroCopyKey(graded!.lifecycle.mode).titleId).toContain('graded');
		expect(resolveDetailHeroMode(graded!.lifecycle.mode, 'completed')).toBe(
			'assignment_graded'
		);
	});

	it('preserves assignment_xp when API provides it; keeps null when omitted', () => {
		const withXp = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			lifecycle: { mode: 'assignment_graded', status: 'graded', can_submit: false },
			assignment_xp: 50,
			rubric_available: true,
			activities: [],
		});
		expect(withXp?.assignment_xp).toBe(50);
		expect(withXp?.rubric_available).toBe(true);
		expect(withXp?.lifecycle.can_submit).toBe(false);

		const withoutXp = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			lifecycle: { mode: 'assignment_graded', status: 'graded', can_submit: false },
			activities: [],
		});
		expect(withoutXp?.assignment_xp).toBeNull();
	});
});
