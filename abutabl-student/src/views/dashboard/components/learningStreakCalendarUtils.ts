import type { StreakCalendarDay, StreakCalendarDayStatus } from 'lib/streakApi';

export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** Monday-based offset for the first day of a month (0 = Monday). */
export function firstWeekdayOffset(year: number, month: number): number {
	const jsDay = new Date(year, month - 1, 1).getDay();
	return (jsDay + 6) % 7;
}

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

export type CalendarGridCell = {
	day: number | null;
	date: string | null;
	status: StreakCalendarDayStatus | null;
};

export function buildCalendarGrid(
	year: number,
	month: number,
	days: StreakCalendarDay[]
): CalendarGridCell[] {
	const statusByDate = new Map(days.map((entry) => [entry.date, entry.status]));
	const offset = firstWeekdayOffset(year, month);
	const totalDays = daysInMonth(year, month);
	const cells: CalendarGridCell[] = [];

	for (let i = 0; i < offset; i++) {
		cells.push({ day: null, date: null, status: null });
	}

	for (let day = 1; day <= totalDays; day++) {
		const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		cells.push({
			day,
			date,
			status: statusByDate.get(date) ?? null,
		});
	}

	while (cells.length % 7 !== 0) {
		cells.push({ day: null, date: null, status: null });
	}

	return cells;
}

export function canNavigateToNextMonth(year: number, month: number, now = new Date()): boolean {
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	if (year < currentYear) {
		return true;
	}

	if (year === currentYear) {
		return month < currentMonth;
	}

	return false;
}

export function shiftMonth(year: number, month: number, delta: -1 | 1): { year: number; month: number } {
	const date = new Date(year, month - 1 + delta, 1);
	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1,
	};
}
