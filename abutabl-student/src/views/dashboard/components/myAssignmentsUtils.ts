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

/** Assignment-card CTA — list is View-only (SUBMIT / REDO live on Assignment Detail). */
export type AssignmentListAction = 'view';

export function getSubjectIndicatorColor(subjectId?: number | null): string {
	if (subjectId == null || subjectId <= 0) {
		return SUBJECT_INDICATOR_COLORS[0];
	}
	return SUBJECT_INDICATOR_COLORS[subjectId % SUBJECT_INDICATOR_COLORS.length];
}

/** My Assignments View — same detail route for To Do / Past Due / Completed. */
export function assignmentPath(item: DashboardAssignmentItem): string {
	if (!item.assign_id) {
		return '/todo';
	}
	return `/todo/assign/${item.assign_id}`;
}

/**
 * List card action is always View → open Assignment Detail.
 * Parent SUBMIT and REDO stay on the detail page only (not on the list card).
 */
export function resolveAssignmentListAction(
	_item?: Pick<DashboardAssignmentItem, 'can_submit' | 'redo_allowed'>
): AssignmentListAction {
	return 'view';
}
