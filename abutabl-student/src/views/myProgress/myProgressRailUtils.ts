import type { MyProgressStreak } from 'lib/myProgressApi';
import type { DashboardPayload } from 'lib/dashboardApi';

/** Map My Progress streak rail → dashboard LearningStreakWidget contract. */
export function toDashboardStreakShape(streak: MyProgressStreak): DashboardPayload['streak'] {
	return {
		available: streak.available,
		current_streak: streak.current_streak,
		longest_streak: streak.longest_streak,
		active_days: streak.current_streak,
		weekly_activity: streak.weekly_days.filter((d) => d.completed).length,
		today_completed: streak.today_completed,
		weekly_days: streak.weekly_days,
	};
}
