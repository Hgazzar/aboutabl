import { describe, expect, it } from 'vitest';
import {
	assignmentPath,
	getSubjectIndicatorColor,
	resolveAssignmentListAction,
} from './myAssignmentsUtils';

describe('myAssignmentsUtils', () => {
	it('maps View to assign detail route', () => {
		expect(
			assignmentPath({
				assign_id: 12,
				assign_student_id: 3,
				title: 'LA bundle',
				type: 'learning_activities',
			})
		).toBe('/todo/assign/12');
	});

	it('returns stable subject stripe colors', () => {
		expect(getSubjectIndicatorColor(null)).toBe('#FFB300');
	});
});

describe('resolveAssignmentListAction', () => {
	it('always returns View — SUBMIT / REDO are Detail-only', () => {
		expect(
			resolveAssignmentListAction({ can_submit: false, redo_allowed: false })
		).toBe('view');
		expect(
			resolveAssignmentListAction({ can_submit: true, redo_allowed: false })
		).toBe('view');
		expect(
			resolveAssignmentListAction({ can_submit: false, redo_allowed: true })
		).toBe('view');
	});
});
