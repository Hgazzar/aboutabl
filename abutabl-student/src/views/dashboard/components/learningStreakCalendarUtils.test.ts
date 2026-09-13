import { describe, expect, it } from 'vitest';
import {
	WEEKDAY_LABELS,
	buildCalendarGrid,
	canNavigateToNextMonth,
	daysInMonth,
	firstWeekdayOffset,
	shiftMonth,
} from './learningStreakCalendarUtils';

describe('learningStreakCalendarUtils', () => {
	it('computes monday-based first weekday offset', () => {
		expect(firstWeekdayOffset(2026, 4)).toBe(2);
	});

	it('returns days in month', () => {
		expect(daysInMonth(2026, 4)).toBe(30);
		expect(daysInMonth(2026, 2)).toBe(28);
	});

	it('builds a padded calendar grid from backend days', () => {
		const grid = buildCalendarGrid(2026, 4, [
			{ date: '2026-04-01', status: 'completed' },
			{ date: '2026-04-02', status: 'today_pending' },
			{ date: '2026-04-03', status: 'future' },
		]);

		expect(grid.length % 7).toBe(0);
		expect(grid.filter((cell) => cell.day === 1)[0]?.status).toBe('completed');
		expect(grid.filter((cell) => cell.day === 2)[0]?.status).toBe('today_pending');
		expect(grid.filter((cell) => cell.day === 3)[0]?.status).toBe('future');
	});

	it('shifts month navigation', () => {
		expect(shiftMonth(2026, 1, 1)).toEqual({ year: 2026, month: 2 });
		expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
	});

	it('allows next month only before current month', () => {
		const now = new Date(2026, 3, 2);
		expect(canNavigateToNextMonth(2026, 3, now)).toBe(true);
		expect(canNavigateToNextMonth(2026, 4, now)).toBe(false);
	});

	it('exposes seven weekday labels', () => {
		expect(WEEKDAY_LABELS).toHaveLength(7);
	});
});
