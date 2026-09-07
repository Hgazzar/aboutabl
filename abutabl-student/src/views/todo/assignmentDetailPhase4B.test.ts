import { describe, expect, it } from 'vitest';
import { parseAssignmentDetailPayload } from 'lib/assignmentDetailApi';
import {
	canShowAssignmentSubmit,
	gradedXpDisplay,
	heroCopyKey,
	resolveDetailHeroMode,
	unavailableProductFeatures,
} from './assignmentDetailState';

describe('assignment Phase 4B grade contract', () => {
	it('preserves Phase 3C grade fields from the API', () => {
		const parsed = parseAssignmentDetailPayload({
			assign_id: 23,
			title: 'English Homework: Letter Aa',
			progress: { tasks_completed: 2, tasks_total: 3, completion_percent: 66.67 },
			lifecycle: {
				mode: 'assignment_graded',
				status: 'graded',
				submitted_at: '2026-04-04T18:17:00+00:00',
				can_submit: false,
				source: 'assigns_students',
			},
			assignment_xp: 30,
			grade: {
				id: 9,
				assign_id: 23,
				assign_student_id: 44,
				status: 'finalized',
				final_percent: 60,
				possible_xp: 50,
				earned_xp: 30,
				badge: { key: 'fair', label: 'Fair' },
				teacher_feedback: 'Great work, Ahmed.',
				graded_by: 179,
				finalized_at: '2026-04-04T18:17:00+00:00',
				criteria: [
					{ criterion_id: 1, points: 2 },
					{ criterion_id: 2, points: 3 },
				],
			},
			activities: [],
		});

		expect(parsed).not.toBeNull();
		expect(parsed?.grade).not.toBeNull();
		expect(parsed?.grade?.status).toBe('finalized');
		expect(parsed?.grade?.final_percent).toBe(60);
		expect(parsed?.grade?.badge).toEqual({ key: 'fair', label: 'Fair' });
		expect(parsed?.grade?.possible_xp).toBe(50);
		expect(parsed?.grade?.earned_xp).toBe(30);
		expect(parsed?.grade?.teacher_feedback).toBe('Great work, Ahmed.');
		expect(parsed?.grade?.finalized_at).toContain('2026-04-04');
		expect(parsed?.grade?.criteria).toEqual([
			{ criterion_id: 1, points: 2 },
			{ criterion_id: 2, points: 3 },
		]);
		expect(parsed?.assignment_xp).toBe(30);
	});

	it('keeps null XP/grade when API omits them (no invention)', () => {
		const parsed = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			lifecycle: { mode: 'assignment_graded', status: 'graded', can_submit: false },
			activities: [],
		});
		expect(parsed?.grade).toBeNull();
		expect(parsed?.assignment_xp).toBeNull();
		expect(gradedXpDisplay(parsed?.grade ?? null)).toBeNull();
		expect(unavailableProductFeatures(parsed!).showXp).toBe(false);
	});

	it('maps assignment_graded to graded hero; homework/waiting unchanged; tab ignored', () => {
		expect(heroCopyKey('assignment_graded').titleId).toContain('graded');
		expect(heroCopyKey('homework_hero').titleId).toContain('active');
		expect(heroCopyKey('waiting_on_teacher').titleId).toContain('waiting');

		expect(resolveDetailHeroMode('assignment_graded', 'todo')).toBe('assignment_graded');
		expect(resolveDetailHeroMode('homework_hero', 'completed')).toBe('homework_hero');
		expect(resolveDetailHeroMode('waiting_on_teacher', 'completed')).toBe(
			'waiting_on_teacher'
		);

		const active = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				can_submit: true,
				source: 'assigns_students',
			},
			activities: [],
		});
		expect(canShowAssignmentSubmit(active!)).toBe(true);
		expect(active?.grade).toBeNull();

		const waiting = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				can_submit: false,
				source: 'assigns_students',
			},
			activities: [],
		});
		expect(canShowAssignmentSubmit(waiting!)).toBe(false);
		expect(waiting?.grade).toBeNull();
	});

	it('formats XP only from API earned/possible (no client calculation)', () => {
		expect(
			gradedXpDisplay({
				id: 1,
				assign_id: 1,
				assign_student_id: 1,
				status: 'finalized',
				final_percent: 60,
				possible_xp: 50,
				earned_xp: 30,
				badge: null,
				teacher_feedback: null,
				graded_by: null,
				finalized_at: null,
				criteria: [],
			})
		).toEqual({ earned: 30, possible: 50 });

		expect(
			gradedXpDisplay({
				id: 1,
				assign_id: 1,
				assign_student_id: 1,
				status: 'finalized',
				final_percent: null,
				possible_xp: 50,
				earned_xp: null,
				badge: null,
				teacher_feedback: null,
				graded_by: null,
				finalized_at: null,
				criteria: [],
			})
		).toBeNull();
	});
});
