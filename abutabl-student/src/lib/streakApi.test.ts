import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as requests from 'lib/requests';
import { fetchStreakCalendar } from 'lib/streakApi';

describe('streakApi', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches month calendar from dedicated endpoint', async () => {
		const getRequest = vi.spyOn(requests, 'getRequest').mockResolvedValue({
			status: true,
			streak_calendar: {
				year: 2026,
				month: 4,
				days: [
					{ date: '2026-04-01', status: 'completed' },
					{ date: '2026-04-02', status: 'today_pending' },
				],
			},
		});

		const payload = await fetchStreakCalendar(2026, 4);

		expect(getRequest).toHaveBeenCalledWith(
			'/student/streak/calendar',
			{ year: 2026, month: 4 },
			undefined,
			undefined
		);
		expect(payload.year).toBe(2026);
		expect(payload.month).toBe(4);
		expect(payload.days[0]).toEqual({ date: '2026-04-01', status: 'completed' });
	});

	it('does not invent activity when API returns missed and future statuses', async () => {
		vi.spyOn(requests, 'getRequest').mockResolvedValue({
			status: true,
			streak_calendar: {
				year: 2026,
				month: 4,
				days: [
					{ date: '2026-04-01', status: 'missed' },
					{ date: '2026-04-30', status: 'future' },
				],
			},
		});

		const payload = await fetchStreakCalendar(2026, 4);
		expect(payload.days).toEqual([
			{ date: '2026-04-01', status: 'missed' },
			{ date: '2026-04-30', status: 'future' },
		]);
	});
});
