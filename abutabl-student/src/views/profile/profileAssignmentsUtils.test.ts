import { describe, expect, it } from 'vitest';
import type { DashboardAssignmentItem } from 'lib/dashboardApi';
import { assignmentPath } from 'views/dashboard/components/myAssignmentsUtils';
import {
	assignmentsForTab,
	formatProfileAssignmentLabel,
	hasProfileAssignments,
	profileAssignmentsTotalCount,
} from './profileAssignmentsUtils';

const sampleItem = (overrides: Partial<DashboardAssignmentItem> = {}): DashboardAssignmentItem => ({
	assign_id: 12,
	assign_student_id: 34,
	title: 'English Homework',
	type: 'subjects',
	subject_id: 2,
	due_label: 'Due Today',
	...overrides,
});

const sampleTabs = {
	todo: [sampleItem()],
	past_due: [
		sampleItem({
			assign_id: 13,
			assign_student_id: 35,
			title: 'Science Worksheet',
			subject_id: 3,
			due_label: 'Due in 10 Days',
		}),
	],
	completed: [],
};

describe('profileAssignmentsUtils', () => {
	it('formats assignment title and due label for display', () => {
		expect(formatProfileAssignmentLabel(sampleItem())).toBe('English Homework - Due Today');
	});

	it('returns assignments for the active tab', () => {
		expect(assignmentsForTab(sampleTabs, 'todo')).toHaveLength(1);
		expect(assignmentsForTab(sampleTabs, 'past_due')[0]?.title).toBe('Science Worksheet');
		expect(assignmentsForTab(sampleTabs, 'completed')).toEqual([]);
	});

	it('detects when the API returns zero assignments overall', () => {
		expect(hasProfileAssignments(sampleTabs)).toBe(true);
		expect(
			hasProfileAssignments({
				todo: [],
				past_due: [],
				completed: [],
			})
		).toBe(false);
		expect(profileAssignmentsTotalCount(sampleTabs)).toBe(2);
	});

	it('builds view paths from real assignment ids without fake data', () => {
		expect(assignmentPath(sampleItem())).toBe('/todo/assign/12');
		expect(assignmentPath(sampleItem({ type: 'learning_activities' }))).toBe(
			'/todo/assign/12'
		);
		expect(assignmentPath(sampleItem())).not.toContain('English Homework');
	});
});
