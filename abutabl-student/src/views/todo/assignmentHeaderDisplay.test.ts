import { describe, expect, it } from 'vitest';
import { parseAssignmentDetailPayload } from 'lib/assignmentDetailApi';
import {
	assignmentHeaderDisplay,
	canShowAssignmentSubmit,
} from './assignmentDetailState';

const baseDetail = {
	assign_id: 12,
	assign_student_id: 3,
	title: 'Letter Aa Practice Pack',
	due_at: '2026-04-04T18:00:00+00:00',
	type: 'learning_activities',
	subject_id: 2,
	subject_name: 'English',
	unit_id: 5,
	unit_name: 'Unit 1',
	lesson_id: 9,
	lesson_name: 'Letter Aa',
	context_label: 'Letter Aa',
	progress: {
		tasks_completed: 3,
		tasks_total: 3,
		completion_percent: 100,
		fully_complete: true,
		last_submitted_at: null,
		score_percent: null,
	},
	lifecycle: {
		mode: 'homework_hero' as const,
		status: 'active' as const,
		submitted_at: null,
		is_late: false,
		is_overdue: false,
		source: 'assigns_students',
		can_submit: true,
	},
	teacher_feedback_items: [],
	grade: null,
	activities: [],
	materials: [],
	my_work: [],
	rubric_available: false,
	rubric: null,
	assignment_xp: null,
	redo_allowed: false,
};

describe('assignment header display', () => {
	it('title line uses subject_name; next line uses assignment title', () => {
		const parsed = parseAssignmentDetailPayload(baseDetail);
		expect(parsed).not.toBeNull();
		const header = assignmentHeaderDisplay(parsed!);
		expect(header.subjectName).toBe('English');
		expect(header.assignmentTitle).toBe('Letter Aa Practice Pack');
		expect(header.statusKind).toBe('homework');
		expect(header.contextLabel).toBe('Letter Aa');
		expect(header.showSubmit).toBe(true);
		expect(header.subjectName).not.toBe(header.assignmentTitle);
	});

	it('Active + no Lesson/Unit → Subject + Homework + Assignment title + SUBMIT', () => {
		const parsed = parseAssignmentDetailPayload({
			...baseDetail,
			subject_name: 'Science',
			title: 'Volcano Worksheet Pack',
			context_label: null,
			lesson_id: null,
			lesson_name: null,
			unit_id: null,
			unit_name: null,
			lifecycle: {
				...baseDetail.lifecycle,
				can_submit: true,
			},
		})!;
		const header = assignmentHeaderDisplay(parsed);
		expect(header.subjectName).toBe('Science');
		expect(header.statusKind).toBe('homework');
		expect(header.assignmentTitle).toBe('Volcano Worksheet Pack');
		expect(header.contextLabel).toBeNull();
		expect(header.showSubmit).toBe(true);
		expect(canShowAssignmentSubmit(parsed)).toBe(true);
	});

	it('Submitted → Waiting beside subject + no Submit', () => {
		const parsed = parseAssignmentDetailPayload({
			...baseDetail,
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-04-04T19:00:00+00:00',
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
			},
		})!;
		const header = assignmentHeaderDisplay(parsed);
		expect(header.subjectName).toBe('English');
		expect(header.assignmentTitle).toBe('Letter Aa Practice Pack');
		expect(header.statusKind).toBe('waiting');
		expect(header.showSubmit).toBe(false);
	});

	it('never uses assignment title as Subject', () => {
		const parsed = parseAssignmentDetailPayload({
			...baseDetail,
			subject_name: null,
			title: 'Do Not Use As Subject',
		});
		const header = assignmentHeaderDisplay(parsed!);
		expect(header.subjectName).toBeNull();
		expect(header.assignmentTitle).toBe('Do Not Use As Subject');
	});

	it('refresh preserves Waiting state from API', () => {
		const raw = {
			...baseDetail,
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				submitted_at: '2026-04-04T19:00:00+00:00',
				is_late: false,
				is_overdue: false,
				source: 'assigns_students',
				can_submit: false,
			},
		};
		const first = assignmentHeaderDisplay(parseAssignmentDetailPayload(raw)!);
		const second = assignmentHeaderDisplay(parseAssignmentDetailPayload(raw)!);
		expect(first.statusKind).toBe('waiting');
		expect(second.statusKind).toBe('waiting');
		expect(first.assignmentTitle).toBe('Letter Aa Practice Pack');
		expect(first.showSubmit).toBe(false);
	});
});
