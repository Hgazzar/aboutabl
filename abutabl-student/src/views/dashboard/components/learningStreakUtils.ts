import type { DashboardPayload, DashboardStreakDay } from 'lib/dashboardApi';

export type DashboardStreakPayload = DashboardPayload['streak'];

export function isLearningStreakActive(streak: DashboardStreakPayload): boolean {
	return streak.available === true && streak.current_streak > 0;
}

export function shouldShowStreakCount(streak: DashboardStreakPayload): boolean {
	return isLearningStreakActive(streak);
}

export function streakMessageId(streak: DashboardStreakPayload): string {
	if (!streak.available || streak.current_streak <= 0) {
		return 'dashboard-streak-empty';
	}

	return streak.today_completed ? 'dashboard-streak-done-today' : 'dashboard-streak-extend';
}

export function normalizeWeeklyDays(
	days: DashboardStreakDay[] | undefined
): DashboardStreakDay[] {
	if (!days || days.length === 0) {
		return defaultWeeklyDays();
	}

	return days.slice(0, 7);
}

function defaultWeeklyDays(): DashboardStreakDay[] {
	const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

	return labels.map((label) => ({
		label,
		date: '',
		completed: false,
		is_today: false,
	}));
}
