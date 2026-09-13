import { describe, expect, it } from 'vitest';
import { parseStudentApiPayload } from 'lib/studentApiResponse';
import { parseAssignmentDetailPayload } from 'lib/assignmentDetailApi';
import {
	assignmentHeaderDisplay,
	canShowActivityRedo,
	canShowAssignmentRedo,
	canShowAssignmentSubmit,
} from './assignmentDetailState';

function detail(overrides: Record<string, unknown> = {}) {
	const base = {
		assign_id: 12,
		assign_student_id: 3,
		title: 'Practice Pack',
		due_at: '2026-04-04T18:00:00+00:00',
		type: 'learning_activities',
		subject_id: 2,
		subject_name: 'English',
		unit_id: null,
		unit_name: null,
		lesson_id: null,
		lesson_name: null,
		context_label: null,
		progress: {
			tasks_completed: 1,
			tasks_total: 2,
			completion_percent: 50,
			fully_complete: false,
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
			can_submit: false,
			redo_allowed: false,
		},
		teacher_feedback_items: [],
		grade: null,
		activities: [
			{
				assign_activity_id: 1,
				assign_id: 12,
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
					submitted_at: '2026-04-01T10:00:00+00:00',
					graded_at: '2026-04-01T10:00:00+00:00',
					teacher_feedback: null,
				},
			},
			{
				assign_activity_id: 2,
				assign_id: 12,
				activity_type: 'quiz',
				activity_id: 20,
				source_table: 'quizes',
				grading_mode: 'automatic_accuracy',
				title: 'Quiz',
				sort_order: 1,
				subject_id: 2,
				path: '/learn/2/quiz/20',
				redo_allowed: false,
				submission: null,
			},
		],
		materials: [],
		my_work: [],
		rubric_available: false,
		rubric: null,
		assignment_xp: null,
		redo_allowed: false,
		...overrides,
	};
	return parseAssignmentDetailPayload(base)!;
}

describe('Assignment Header actions lineage', () => {
	it('1) Active + incomplete → Submit hidden', () => {
		const parsed = detail();
		expect(canShowAssignmentSubmit(parsed)).toBe(false);
		expect(assignmentHeaderDisplay(parsed).showSubmit).toBe(false);
		expect(assignmentHeaderDisplay(parsed).statusKind).toBe('homework');
	});

	it('2) Active + complete → Submit visible', () => {
		const parsed = detail({
			progress: {
				tasks_completed: 2,
				tasks_total: 2,
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
		expect(canShowAssignmentSubmit(parsed)).toBe(true);
		expect(assignmentHeaderDisplay(parsed).showSubmit).toBe(true);
		expect(canShowAssignmentRedo(parsed)).toBe(false);
	});

	it('3) Submitted + redo_allowed=true → Waiting + Assignment REDO + no Submit', () => {
		const parsed = detail({
			redo_allowed: true,
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-04-04T19:00:00+00:00',
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: true,
			},
			activities: [
				{
					assign_activity_id: 1,
					assign_id: 12,
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
						submitted_at: null,
						graded_at: null,
						teacher_feedback: null,
					},
				},
			],
		});
		expect(assignmentHeaderDisplay(parsed).statusKind).toBe('waiting');
		expect(canShowAssignmentRedo(parsed)).toBe(true);
		expect(canShowAssignmentSubmit(parsed)).toBe(false);
		expect(canShowActivityRedo(parsed.activities[0])).toBe(false);
	});

	it('4) Submitted + redo_allowed=false → Waiting + no REDO + no Submit', () => {
		const parsed = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-04-04T19:00:00+00:00',
				is_late: true,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
		});
		expect(assignmentHeaderDisplay(parsed).statusKind).toBe('waiting');
		expect(canShowAssignmentRedo(parsed)).toBe(false);
		expect(canShowAssignmentSubmit(parsed)).toBe(false);
	});

	it('5) Graded → Submit hidden + REDO hidden', () => {
		const parsed = detail({
			redo_allowed: false,
			lifecycle: {
				mode: 'assignment_graded',
				status: 'graded',
				submitted_at: '2026-04-04T19:00:00+00:00',
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: false,
			},
		});
		expect(canShowAssignmentSubmit(parsed)).toBe(false);
		expect(canShowAssignmentRedo(parsed)).toBe(false);
	});

	it('6) Activity REDO independent of Assignment REDO', () => {
		const parsed = detail();
		expect(canShowActivityRedo(parsed.activities[0])).toBe(true);
		expect(canShowActivityRedo(parsed.activities[1])).toBe(false);
		expect(canShowAssignmentRedo(parsed)).toBe(false);
	});

	it('7) After Assignment REDO (submitted→active) Header returns to active', () => {
		const afterRedo = detail({
			redo_allowed: false,
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
			progress: {
				tasks_completed: 2,
				tasks_total: 2,
				completion_percent: 100,
				fully_complete: true,
				last_submitted_at: null,
				score_percent: null,
			},
		});
		expect(assignmentHeaderDisplay(afterRedo).statusKind).toBe('homework');
		expect(canShowAssignmentSubmit(afterRedo)).toBe(true);
		expect(canShowAssignmentRedo(afterRedo)).toBe(false);
	});

	it('8) After re-submit → Waiting + Assignment REDO when backend allows', () => {
		const afterResubmit = detail({
			redo_allowed: true,
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-04-05T10:00:00+00:00',
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
				redo_allowed: true,
			},
		});
		expect(assignmentHeaderDisplay(afterResubmit).statusKind).toBe('waiting');
		expect(canShowAssignmentRedo(afterResubmit)).toBe(true);
		expect(canShowAssignmentSubmit(afterResubmit)).toBe(false);
	});

	it('accepts truthy API flag coercion for can_submit / redo_allowed', () => {
		const http = {
			status: true,
			data: {
				assign_id: 9,
				assign_student_id: 1,
				title: 'T',
				due_at: null,
				type: 'learning_activities',
				subject_id: 1,
				subject_name: 'English',
				unit_id: null,
				unit_name: null,
				lesson_id: null,
				lesson_name: null,
				context_label: null,
				progress: {
					tasks_completed: 1,
					tasks_total: 1,
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
					can_submit: 1,
					redo_allowed: 0,
				},
				teacher_feedback_items: [],
				grade: null,
				activities: [],
				materials: [],
				my_work: [],
				rubric_available: false,
				rubric: null,
				assignment_xp: null,
				redo_allowed: 0,
			},
		};
		const parsed = parseAssignmentDetailPayload(
			parseStudentApiPayload(http, 'data')
		)!;
		expect(canShowAssignmentSubmit(parsed)).toBe(true);
	});
});
