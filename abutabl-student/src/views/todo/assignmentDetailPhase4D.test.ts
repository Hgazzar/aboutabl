import { describe, expect, it } from 'vitest';
import { parseAssignmentDetailPayload } from 'lib/assignmentDetailApi';
import {
	rubricLevelDescriptorVisible,
	sortedRubricCriteria,
	sortedRubricLevels,
	unavailableProductFeatures,
} from './assignmentDetailState';

const rubricFixture = {
	id: 10,
	title: 'Your First Video',
	points_possible: 50,
	criteria: [
		{ id: 3, label: 'Camera angles', weight: 33.34, max_points: 4, sort_order: 2 },
		{ id: 1, label: '2 min long', weight: 33.33, max_points: 4, sort_order: 0 },
		{ id: 2, label: 'You appear', weight: 33.33, max_points: 4, sort_order: 1 },
	],
	levels: [
		{ points: 1, key: 'poor', label: 'Poor', descriptor: null },
		{ points: 4, key: 'excellent', label: 'Excellent', descriptor: null },
		{ points: 2, key: 'fair', label: 'Fair', descriptor: null },
		{ points: 3, key: 'good', label: 'Good', descriptor: null },
	],
};

function detailWith(overrides: Record<string, unknown> = {}) {
	return parseAssignmentDetailPayload({
		assign_id: 23,
		title: 'English Homework: Letter Aa',
		progress: { tasks_completed: 2, tasks_total: 3, completion_percent: 66.67 },
		lifecycle: {
			mode: 'homework_hero',
			status: 'active',
			can_submit: false,
			source: 'assigns_students',
		},
		activities: [],
		rubric_available: true,
		rubric: rubricFixture,
		...overrides,
	});
}

describe('assignment Phase 4D student rubric', () => {
	it('hides Rubric Card when rubric_available is false', () => {
		const parsed = detailWith({ rubric_available: false, rubric: null });
		expect(parsed).not.toBeNull();
		expect(parsed!.rubric_available).toBe(false);
		expect(parsed!.rubric).toBeNull();
		expect(unavailableProductFeatures(parsed!).showRubric).toBe(false);
	});

	it('shows Rubric Card when rubric_available and rubric definition exist', () => {
		const parsed = detailWith();
		expect(parsed).not.toBeNull();
		expect(parsed!.rubric_available).toBe(true);
		expect(parsed!.rubric?.title).toBe('Your First Video');
		expect(parsed!.rubric?.points_possible).toBe(50);
		expect(unavailableProductFeatures(parsed!).showRubric).toBe(true);
	});

	it('does not show Rubric Card when available flag is true but rubric payload is missing', () => {
		const parsed = detailWith({ rubric: null });
		expect(parsed!.rubric_available).toBe(true);
		expect(parsed!.rubric).toBeNull();
		expect(unavailableProductFeatures(parsed!).showRubric).toBe(false);
	});

	it('preserves criteria weights/labels and sorts by sort_order', () => {
		const parsed = detailWith();
		const sorted = sortedRubricCriteria(parsed!.rubric);
		expect(sorted.map((c) => c.id)).toEqual([1, 2, 3]);
		expect(sorted[0].label).toBe('2 min long');
		expect(sorted[0].weight).toBe(33.33);
		expect(sorted[0].max_points).toBe(4);
	});

	it('orders levels by API points descending without inventing labels', () => {
		const parsed = detailWith();
		const levels = sortedRubricLevels(parsed!.rubric);
		expect(levels.map((l) => l.points)).toEqual([4, 3, 2, 1]);
		expect(levels.map((l) => l.key)).toEqual(['excellent', 'good', 'fair', 'poor']);
		expect(levels.map((l) => l.label)).toEqual(['Excellent', 'Good', 'Fair', 'Poor']);
	});

	it('treats null/empty descriptors as not visible (no invented copy)', () => {
		expect(rubricLevelDescriptorVisible(null)).toBe(false);
		expect(rubricLevelDescriptorVisible('')).toBe(false);
		expect(rubricLevelDescriptorVisible('   ')).toBe(false);
		expect(rubricLevelDescriptorVisible('Well done!')).toBe(true);
	});

	it('keeps rubric available across active / submitted / graded lifecycle modes', () => {
		for (const lifecycle of [
			{ mode: 'homework_hero', status: 'active' },
			{ mode: 'waiting_on_teacher', status: 'submitted' },
			{ mode: 'assignment_graded', status: 'graded' },
		]) {
			const parsed = detailWith({ lifecycle: { ...lifecycle, can_submit: false } });
			expect(unavailableProductFeatures(parsed!).showRubric).toBe(true);
			expect(parsed!.lifecycle.mode).toBe(lifecycle.mode);
		}
	});

	it('preserves AR level labels from API without frontend remapping', () => {
		const parsed = detailWith({
			rubric: {
				...rubricFixture,
				levels: [
					{ points: 4, key: 'excellent', label: 'ممتاز', descriptor: null },
					{ points: 3, key: 'good', label: 'جيد', descriptor: null },
					{ points: 2, key: 'fair', label: 'مقبول', descriptor: null },
					{ points: 1, key: 'poor', label: 'ضعيف', descriptor: null },
				],
			},
		});
		const levels = sortedRubricLevels(parsed!.rubric);
		expect(levels.map((l) => l.label)).toEqual(['ممتاز', 'جيد', 'مقبول', 'ضعيف']);
		expect(levels.map((l) => l.key)).toEqual(['excellent', 'good', 'fair', 'poor']);
	});

	it('does not change graded lifecycle when rubric is present', () => {
		const parsed = detailWith({
			lifecycle: {
				mode: 'assignment_graded',
				status: 'graded',
				can_submit: false,
				submitted_at: '2026-04-04T18:17:00+00:00',
			},
			grade: {
				id: 9,
				status: 'finalized',
				final_percent: 60,
				badge: { key: 'fair', label: 'Fair' },
				criteria: [],
			},
		});
		expect(parsed!.lifecycle.mode).toBe('assignment_graded');
		expect(parsed!.lifecycle.can_submit).toBe(false);
		expect(parsed!.grade?.final_percent).toBe(60);
		expect(unavailableProductFeatures(parsed!).showRubric).toBe(true);
	});
});
