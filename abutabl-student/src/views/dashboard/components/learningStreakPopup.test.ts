import { describe, expect, it } from 'vitest';
import type { StreakCalendarDay } from 'lib/streakApi';
import {
	WEEKDAY_LABELS,
	buildCalendarGrid,
	canNavigateToNextMonth,
} from './learningStreakCalendarUtils';

function april2026Days(): StreakCalendarDay[] {
	const days: StreakCalendarDay[] = [];
	for (let day = 1; day <= 30; day++) {
		const date = `2026-04-${String(day).padStart(2, '0')}`;
		let status: StreakCalendarDay['status'] = 'future';
		if (day === 1) status = 'completed';
		if (day === 2) status = 'today_pending';
		if (day >= 3 && day <= 29) status = 'future';
		if (day === 30) status = 'future';
		days.push({ date, status });
	}
	return days;
}

describe('LearningStreakPopup calendar rendering data', () => {
	it('renders multiple calendar days from backend payload only', () => {
		const grid = buildCalendarGrid(2026, 4, april2026Days());
		const numberedCells = grid.filter((cell) => cell.day !== null);

		expect(numberedCells).toHaveLength(30);
		expect(numberedCells[0]).toMatchObject({ day: 1, status: 'completed' });
		expect(numberedCells[1]).toMatchObject({ day: 2, status: 'today_pending' });
		expect(numberedCells[2]).toMatchObject({ day: 3, status: 'future' });
	});

	it('aligns weekday headers to a monday-start grid', () => {
		expect(WEEKDAY_LABELS).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
		const grid = buildCalendarGrid(2026, 4, april2026Days());
		expect(grid[0]).toEqual({ day: null, date: null, status: null });
		expect(grid[1]).toEqual({ day: null, date: null, status: null });
		expect(grid[2]?.day).toBe(1);
	});

	it('disables next month navigation on the current month', () => {
		const now = new Date(2026, 3, 2);
		expect(canNavigateToNextMonth(2026, 4, now)).toBe(false);
		expect(canNavigateToNextMonth(2026, 3, now)).toBe(true);
	});
});
