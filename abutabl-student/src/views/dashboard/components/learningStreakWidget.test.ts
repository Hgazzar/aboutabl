import { describe, expect, it } from 'vitest';
import type { DashboardPayload } from 'lib/dashboardApi';
import {
	isLearningStreakActive,
	normalizeWeeklyDays,
	shouldShowStreakCount,
	streakMessageId,
} from './learningStreakUtils';

const sampleStreak = (
	overrides: Partial<DashboardPayload['streak']> = {}
): DashboardPayload['streak'] => ({
	available: true,
	current_streak: 3,
	longest_streak: 5,
	active_days: 4,
	weekly_activity: 6,
	today_completed: false,
	weekly_days: [
		{ label: 'M', date: '2026-08-24', completed: true, is_today: false },
		{ label: 'T', date: '2026-08-25', completed: true, is_today: false },
		{ label: 'W', date: '2026-08-26', completed: false, is_today: true },
		{ label: 'T', date: '2026-08-27', completed: false, is_today: false },
		{ label: 'F', date: '2026-08-28', completed: false, is_today: false },
		{ label: 'S', date: '2026-08-29', completed: false, is_today: false },
		{ label: 'S', date: '2026-08-30', completed: false, is_today: false },
	],
	...overrides,
});

describe('learningStreakUtils', () => {
	it('treats available streaks with count > 0 as active', () => {
		expect(isLearningStreakActive(sampleStreak())).toBe(true);
	});

	it('treats unavailable or zero streak as inactive', () => {
		expect(isLearningStreakActive(sampleStreak({ available: false }))).toBe(false);
		expect(isLearningStreakActive(sampleStreak({ current_streak: 0 }))).toBe(false);
	});

	it('picks extend message when today is not completed', () => {
		expect(streakMessageId(sampleStreak({ today_completed: false }))).toBe(
			'dashboard-streak-extend'
		);
	});

	it('picks done-today message when today is completed', () => {
		expect(streakMessageId(sampleStreak({ today_completed: true }))).toBe(
			'dashboard-streak-done-today'
		);
	});

	it('shows streak count only when streak is active', () => {
		expect(shouldShowStreakCount(sampleStreak())).toBe(true);
		expect(shouldShowStreakCount(sampleStreak({ current_streak: 0 }))).toBe(false);
		expect(shouldShowStreakCount(sampleStreak({ available: false }))).toBe(false);
	});

	it('falls back to empty message when streak is inactive', () => {
		expect(streakMessageId(sampleStreak({ current_streak: 0 }))).toBe(
			'dashboard-streak-empty'
		);
	});

	it('normalizes weekly days to seven entries', () => {
		const days = normalizeWeeklyDays(sampleStreak().weekly_days);
		expect(days).toHaveLength(7);
	});

	it('returns default week labels when weekly_days missing', () => {
		const days = normalizeWeeklyDays(undefined);
		expect(days).toHaveLength(7);
		expect(days.map((day) => day.label)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
	});
});
