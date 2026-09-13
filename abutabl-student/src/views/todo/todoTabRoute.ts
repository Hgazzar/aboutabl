import type { AssignTab } from 'views/dashboard/components/myAssignmentsUtils';

const TODO_TAB_PARAM = 'tab';

export function parseTodoTabParam(value: string | null | undefined): AssignTab {
	if (value === 'past_due' || value === 'completed') {
		return value;
	}

	return 'todo';
}

export function todoTabSearchParam(tab: AssignTab): string | null {
	if (tab === 'todo') {
		return null;
	}

	return tab;
}

export function readTodoTabFromSearchParams(searchParams: URLSearchParams): AssignTab {
	return parseTodoTabParam(searchParams.get(TODO_TAB_PARAM));
}

export function applyTodoTabToSearchParams(
	searchParams: URLSearchParams,
	tab: AssignTab
): URLSearchParams {
	const next = new URLSearchParams(searchParams);
	const value = todoTabSearchParam(tab);

	if (value) {
		next.set(TODO_TAB_PARAM, value);
	} else {
		next.delete(TODO_TAB_PARAM);
	}

	return next;
}
