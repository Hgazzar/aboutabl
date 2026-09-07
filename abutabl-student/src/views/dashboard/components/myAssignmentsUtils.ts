import type { DashboardAssignmentItem } from 'lib/dashboardApi';

/** Figma subject stripe colors (English / Science examples in `assCards`). */
const SUBJECT_INDICATOR_COLORS = [
	'#FFB300',
	'#BA68C8',
	'#4FC3F7',
	'#81C784',
	'#FF8A65',
	'#9575CD',
] as const;

export type AssignTab = 'todo' | 'past_due' | 'completed';

export function getSubjectIndicatorColor(subjectId?: number | null): string {
	if (subjectId == null || subjectId <= 0) {
		return SUBJECT_INDICATOR_COLORS[0];
	}
	return SUBJECT_INDICATOR_COLORS[subjectId % SUBJECT_INDICATOR_COLORS.length];
}

export function assignmentPath(item: DashboardAssignmentItem): string {
	const sid = item.subject_id;
	if (item.type === 'learning_activities') {
		return `/todo/assign/${item.assign_id}`;
	}
	if (!sid) return '/todo';
	switch (item.type) {
		case 'subjects':
			return `/learn/${sid}`;
		case 'quizes': {
			if (!item.type_id) return `/learn/${sid}`;
			const assignQs =
				item.assign_student_id > 0
					? `?assign_student_id=${item.assign_student_id}`
					: '';
			return `/learn/${sid}/quiz/${item.type_id}${assignQs}`;
		}
		case 'games':
			return item.type_id ? `/learn/${sid}/detailsGame/${item.type_id}` : `/learn/${sid}`;
		default:
			return `/learn/${sid}`;
	}
}
