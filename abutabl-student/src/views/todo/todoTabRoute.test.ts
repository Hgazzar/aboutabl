import { describe, expect, it } from 'vitest';
import {
	applyTodoTabToSearchParams,
	parseTodoTabParam,
	readTodoTabFromSearchParams,
} from './todoTabRoute';

describe('todoTabRoute', () => {
	it('defaults to todo when tab param is missing or invalid', () => {
		expect(parseTodoTabParam(null)).toBe('todo');
		expect(parseTodoTabParam('unknown')).toBe('todo');
	});

	it('reads past_due and completed from the URL', () => {
		expect(parseTodoTabParam('past_due')).toBe('past_due');
		expect(parseTodoTabParam('completed')).toBe('completed');
	});

	it('persists the active tab in search params', () => {
		const pastDue = applyTodoTabToSearchParams(new URLSearchParams(), 'past_due');
		expect(pastDue.get('tab')).toBe('past_due');
		expect(readTodoTabFromSearchParams(pastDue)).toBe('past_due');

		const todo = applyTodoTabToSearchParams(pastDue, 'todo');
		expect(todo.get('tab')).toBeNull();
		expect(readTodoTabFromSearchParams(todo)).toBe('todo');
	});
});
