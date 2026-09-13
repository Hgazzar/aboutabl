import { describe, expect, it } from 'vitest';
import { parseAssignmentDetailPayload } from 'lib/assignmentDetailApi';
import {
	activityActionLocked,
	activityIsComplete,
	heroCopyKey,
	insertStudentNameAfterGreatWork,
	progressLabel,
	resolveDetailHeroMode,
	unavailableProductFeatures,
} from './assignmentDetailState';

const sampleDetail = {
	assign_id: 12,
	assign_student_id: 3,
	title: 'English Homework: Letter Aa',
	due_at: '2026-04-04T18:00:00+00:00',
	type: 'learning_activities',
	subject_id: 2,
	progress: {
		tasks_completed: 2,
		tasks_total: 3,
		completion_percent: 66.67,
		fully_complete: false,
		last_submitted_at: '2026-04-04T18:17:00+00:00',
		score_percent: null,
	},
	lifecycle: {
		mode: 'homework_hero' as const,
		status: 'active' as const,
		submitted_at: null,
		is_late: false,
		is_overdue: false,
		source: 'assigns_students',
		can_submit: false,
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
			title: 'Book: Unit 1 - Lesson 3',
			sort_order: 0,
			subject_id: 2,
			path: '/learn/2/details/10',
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
			title: 'Quiz: Unit 1 - Lesson 3',
			sort_order: 1,
			subject_id: 2,
			path: '/learn/2/quiz/20',
			submission: null,
		},
	],
	materials: [],
	my_work: [],
	rubric_available: false,
	rubric: null,
	assignment_xp: null,
	redo_allowed: false,
};

describe('assignment lifecycle state mapping', () => {
	it('uses backend progress counts without inventing values', () => {
		const progress = progressLabel(sampleDetail);
		expect(progress.completed).toBe(2);
		expect(progress.total).toBe(3);
		expect(progress.percent).toBe(66.67);
	});

	it('locks actions for completed activities and waiting/graded modes', () => {
		expect(activityIsComplete(sampleDetail.activities[0])).toBe(true);
		expect(activityIsComplete(sampleDetail.activities[1])).toBe(false);
		expect(activityActionLocked('homework_hero', sampleDetail.activities[0])).toBe(true);
		expect(activityActionLocked('homework_hero', sampleDetail.activities[1])).toBe(false);
		expect(activityActionLocked('waiting_on_teacher', sampleDetail.activities[1])).toBe(true);
		expect(activityActionLocked('assignment_graded', sampleDetail.activities[1])).toBe(true);
	});

	it('maps lifecycle modes to heroes; Completed tab never forces Graded', () => {
		expect(heroCopyKey('homework_hero').titleId).toContain('active');
		expect(heroCopyKey('waiting_on_teacher').titleId).toContain('waiting');
		expect(heroCopyKey('assignment_graded').titleId).toContain('graded');

		// Dashboard tab is entry context only — ignore for hero selection.
		expect(resolveDetailHeroMode('homework_hero', 'completed')).toBe('homework_hero');
		expect(resolveDetailHeroMode('waiting_on_teacher', 'completed')).toBe(
			'waiting_on_teacher'
		);
		expect(resolveDetailHeroMode('assignment_graded', 'todo')).toBe('assignment_graded');
		expect(resolveDetailHeroMode('homework_hero', 'past_due')).toBe('homework_hero');

		const features = unavailableProductFeatures(sampleDetail);
		expect(features.showXp).toBe(false);
		expect(features.showRubric).toBe(false);
		expect(features.showMaterials).toBe(false);
		expect(features.showMyWork).toBe(false);
		expect(features.showRedo).toBe(false);
	});

	it('parses API modes and keeps teacher feedback activity-scoped', () => {
		const parsed = parseAssignmentDetailPayload({
			...sampleDetail,
			lifecycle: {
				mode: 'assignment_graded',
				is_late: true,
				is_overdue: false,
				source: 'assign_activity_submissions',
			},
			teacher_feedback_items: [
				{
					assign_activity_id: 2,
					activity_type: 'worksheet',
					activity_title: 'Worksheet',
					teacher_feedback: 'Great work',
					graded_at: '2026-04-04T18:17:00+00:00',
				},
			],
			assignment_xp: 50,
			rubric_available: true,
			redo_allowed: true,
			materials: [
				{
					id: 1,
					assign_id: 12,
					kind: 'link',
					label: 'Ref',
					url: 'https://example.com',
					original_filename: null,
					mime_type: null,
					size_bytes: null,
					duration_ms: null,
					sort_order: 0,
				},
			],
		});

		expect(parsed).not.toBeNull();
		expect(parsed?.lifecycle.mode).toBe('assignment_graded');
		expect(parsed?.lifecycle.is_late).toBe(true);
		expect(parsed?.lifecycle.is_overdue).toBe(false);
		expect(parsed?.teacher_feedback_items).toHaveLength(1);
		expect(parsed?.assignment_xp).toBe(50);
		expect(parsed?.grade).toBeNull();
		expect(unavailableProductFeatures(parsed!).showMaterials).toBe(true);
	});

	it('accepts Phase-1 aliases and never invents graded from completed-only payload', () => {
		const waiting = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			progress: { tasks_completed: 1, tasks_total: 1 },
			lifecycle: { mode: 'awaiting_review', is_late: false },
			activities: [],
		});
		expect(waiting?.lifecycle.mode).toBe('waiting_on_teacher');

		const hero = parseAssignmentDetailPayload({
			assign_id: 1,
			title: 'T',
			progress: { tasks_completed: 1, tasks_total: 1 },
			lifecycle: { mode: 'active' },
			activities: [
				{
					assign_activity_id: 1,
					activity_type: 'ebook',
					activity_id: 1,
					submission: { id: 1, status: 'completed' },
				},
			],
		});
		expect(hero?.lifecycle.mode).toBe('homework_hero');
		expect(hero?.rubric_available).toBe(false);
		expect(hero?.materials).toEqual([]);
	});
});

describe('insertStudentNameAfterGreatWork', () => {
	it('inserts name after Great work then comma and space', () => {
		expect(
			insertStudentNameAfterGreatWork(
				'Great work! Your teacher has graded your assignment.',
				'Alex'
			)
		).toBe('Great work Alex, Your teacher has graded your assignment.');
	});

	it('handles em-dash after Great work', () => {
		expect(
			insertStudentNameAfterGreatWork(
				'Great work — clear effort and strong understanding.',
				'Noor'
			)
		).toBe('Great work Noor, clear effort and strong understanding.');
	});

	it('is a no-op when name is missing', () => {
		expect(insertStudentNameAfterGreatWork('Great work! Keep going.', '')).toBe(
			'Great work! Keep going.'
		);
	});
});
