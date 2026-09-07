import { describe, expect, it } from 'vitest';
import {
	assignmentPath,
	getSubjectIndicatorColor,
} from './myAssignmentsUtils';

describe('myAssignmentsUtils', () => {
	it('maps learning activities to assign detail route', () => {
		expect(
			assignmentPath({
				assign_id: 12,
				assign_student_id: 3,
				title: 'LA bundle',
				type: 'learning_activities',
			})
		).toBe('/todo/assign/12');
	});

	it('appends assign_student_id for quiz assignments', () => {
		expect(
			assignmentPath({
				assign_id: 5,
				assign_student_id: 99,
				title: 'Quiz',
				type: 'quizes',
				type_id: 7,
				subject_id: 2,
			})
		).toBe('/learn/2/quiz/7?assign_student_id=99');
	});

	it('returns stable subject stripe colors', () => {
		expect(getSubjectIndicatorColor(1)).toBe(getSubjectIndicatorColor(1));
		expect(getSubjectIndicatorColor(null)).toBe('#FFB300');
	});
});
