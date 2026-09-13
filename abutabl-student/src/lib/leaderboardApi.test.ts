import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as requests from 'lib/requests';
import {
	fetchStudentLeaderboard,
	normalizeLeaderboardPayload,
} from 'lib/leaderboardApi';

describe('leaderboardApi', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches school + week by default', async () => {
		const getRequest = vi.spyOn(requests, 'getRequest').mockResolvedValue({
			status: true,
			leaderboard: {
				current_user_summary: {
					student_id: 1,
					name: 'Ahmed',
					photo_url: null,
					rank: 4,
					rank_delta: -2,
					total_xp: 2450,
					range_xp: 150,
					current_streak: 3,
				},
				tabs: { active_scope: 'school', active_range: 'week' },
				items: [
					{
						rank: 1,
						student_id: 12,
						name: 'Sara',
						photo_url: null,
						xp: 150,
						is_current: false,
					},
				],
			},
		});

		const payload = await fetchStudentLeaderboard();

		expect(getRequest).toHaveBeenCalledWith(
			'leaderboard',
			{ scope: 'school', range: 'week' },
			undefined,
			undefined
		);
		expect(payload.tabs.active_scope).toBe('school');
		expect(payload.tabs.active_range).toBe('week');
		expect(payload.current_user_summary.rank).toBe(4);
		expect(payload.items).toHaveLength(1);
		expect(payload.items[0].xp).toBe(150);
	});

	it.each([
		['school', 'week'],
		['class', 'week'],
		['school', 'month'],
		['school', 'all_time'],
	] as const)('sends scope=%s range=%s', async (scope, range) => {
		const getRequest = vi.spyOn(requests, 'getRequest').mockResolvedValue({
			status: true,
			leaderboard: {
				current_user_summary: {
					student_id: 1,
					name: 'A',
					photo_url: null,
					rank: null,
					rank_delta: range === 'all_time' ? null : 0,
					total_xp: 0,
					range_xp: 0,
					current_streak: 0,
				},
				tabs: { active_scope: scope, active_range: range },
				items: [],
			},
		});

		const payload = await fetchStudentLeaderboard({ scope, range });

		expect(getRequest).toHaveBeenCalledWith(
			'leaderboard',
			{ scope, range },
			undefined,
			undefined
		);
		expect(payload.tabs.active_scope).toBe(scope);
		expect(payload.tabs.active_range).toBe(range);
		if (range === 'all_time') {
			expect(payload.current_user_summary.rank_delta).toBeNull();
		}
	});

	it('preserves API item order without sorting', () => {
		const payload = normalizeLeaderboardPayload({
			current_user_summary: {
				student_id: 1,
				name: 'A',
				photo_url: null,
				rank: 2,
				rank_delta: null,
				total_xp: 10,
				range_xp: 1,
				current_streak: 0,
			},
			tabs: { active_scope: 'school', active_range: 'week' },
			items: [
				{ rank: 2, student_id: 2, name: 'B', photo_url: null, xp: 50, is_current: false },
				{ rank: 1, student_id: 1, name: 'A', photo_url: null, xp: 100, is_current: true },
			],
		});

		expect(payload.items.map((i) => i.student_id)).toEqual([2, 1]);
		expect(payload.items.map((i) => i.rank)).toEqual([2, 1]);
	});

	it('represents empty items without inventing rows', () => {
		const payload = normalizeLeaderboardPayload({
			current_user_summary: {
				student_id: 1,
				name: 'A',
				photo_url: null,
				rank: null,
				rank_delta: null,
				total_xp: 0,
				range_xp: 0,
				current_streak: 0,
			},
			tabs: { active_scope: 'class', active_range: 'week' },
			items: [],
		});

		expect(payload.items).toEqual([]);
	});

	it('maps current_user_summary fields safely', () => {
		const payload = normalizeLeaderboardPayload({
			current_user_summary: {
				student_id: 104,
				name: 'Ahmed',
				photo_url: 'https://example.com/a.png',
				rank: 4,
				rank_delta: -2,
				total_xp: 2450,
				range_xp: 150,
				level: 10,
				current_streak: 344,
			},
			tabs: { active_scope: 'school', active_range: 'week' },
			items: [],
		});

		expect(payload.current_user_summary).toEqual({
			student_id: 104,
			name: 'Ahmed',
			photo_url: 'https://example.com/a.png',
			rank: 4,
			rank_delta: -2,
			total_xp: 2450,
			range_xp: 150,
			level: 10,
			current_streak: 344,
		});
	});
});
