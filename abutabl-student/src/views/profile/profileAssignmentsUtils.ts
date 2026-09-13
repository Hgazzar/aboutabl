import type { DashboardAssignmentItem, DashboardPayload } from 'lib/dashboardApi';
import type { AssignTab } from 'views/dashboard/components/myAssignmentsUtils';

export type ProfileAssignmentsTabs = DashboardPayload['assignments']['tabs'];

export function formatProfileAssignmentLabel(item: Pick<DashboardAssignmentItem, 'title' | 'due_label'>): string {
	const title = String(item.title ?? '').trim();
	const dueLabel = String(item.due_label ?? '').trim();

	if (title && dueLabel) {
		return `${title} - ${dueLabel}`;
	}

	return title || dueLabel;
}

export function assignmentsForTab(
	tabs: ProfileAssignmentsTabs | undefined,
	tab: AssignTab
): DashboardAssignmentItem[] {
	return tabs?.[tab] ?? [];
}

export function profileAssignmentsTotalCount(tabs: ProfileAssignmentsTabs | undefined): number {
	if (!tabs) {
		return 0;
	}

	return tabs.todo.length + tabs.past_due.length + tabs.completed.length;
}

export function hasProfileAssignments(tabs: ProfileAssignmentsTabs | undefined): boolean {
	return profileAssignmentsTotalCount(tabs) > 0;
}
