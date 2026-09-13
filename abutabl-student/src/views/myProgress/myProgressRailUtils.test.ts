import { describe, expect, it } from 'vitest';
import { toDashboardStreakShape } from './myProgressRailUtils';

describe('myProgressRailUtils', () => {
	it('maps InsightMetricsReader streak rail into LearningStreakWidget shape', () => {
		const mapped = toDashboardStreakShape({
			available: true,
			current_streak: 12,
			longest_streak: 20,
			today_completed: true,
			weekly_days: [
				{ label: 'M', date: '2026-09-01', completed: true, is_today: false },
			],
		});

		expect(mapped.available).toBe(true);
		expect(mapped.current_streak).toBe(12);
		expect(mapped.today_completed).toBe(true);
		expect(mapped.weekly_days).toHaveLength(1);
	});
});
