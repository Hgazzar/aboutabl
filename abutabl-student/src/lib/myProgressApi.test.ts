import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as requests from 'lib/requests';
import { fetchStudentMyProgress, normalizeMyProgressPayload } from 'lib/myProgressApi';

describe('myProgressApi', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches my-progress and normalizes payload', async () => {
		const getRequest = vi.spyOn(requests, 'getRequest').mockResolvedValue({
			status: true,
			my_progress: {
				hero: {
					name: 'Ahmed',
					level: 10,
					level_badge_label: 'builder',
					total_xp: 2450,
					next_level_threshold: 3000,
					xp_to_next: 550,
					track: {
						start_level: 9,
						current_level: 10,
						achiever_level: 12,
						fill_percent: 40,
					},
					levels_away_from_achiever: 2,
					weekly_xp: 1500,
					previous_weekly_xp: 900,
				},
				statistics: {
					total_xp: 2450,
					current_rank: 4,
					rank_scope: 'school',
					rank_range: 'all_time',
					current_streak: 12,
				},
				books: [
					{
						subject_id: 10,
						title: 'Letters',
						description: 'Desc',
						photo: null,
						stars: { decorative: true },
						units_completed: 7,
						units_total: 12,
						progress_percent: 58.33,
						xp_this_week: 120,
						accuracy_percent: 98,
						activities_completed: null,
						activities_available: false,
						next_goal: {
							available: true,
							title: 'Letter Ss',
							lesson_title: 'Lesson 7',
							reward_xp: 30,
							reward_xp_kind: 'potential',
							cta_path: '/learn/10/details/99',
						},
					},
				],
				achievements: [
					{
						key: 'first_steps',
						title: 'First Steps',
						description: 'Done',
						icon: 'achievement-builder',
						progress: 100,
						earned: true,
						earned_at: null,
					},
				],
				streak: {
					available: true,
					current_streak: 12,
					longest_streak: 20,
					today_completed: false,
					weekly_days: [],
				},
				xp_ranking: {
					available: true,
					scope: 'school',
					range: 'all_time',
					items: [
						{
							rank: 1,
							student_id: 9,
							name: 'Sara',
							photo_url: null,
							xp: 900,
							is_current: false,
						},
					],
				},
			},
		});

		const payload = await fetchStudentMyProgress();

		expect(getRequest).toHaveBeenCalledWith('my-progress', undefined, undefined, undefined);
		expect(payload.hero.name).toBe('Ahmed');
		expect(payload.statistics.current_rank).toBe(4);
		expect(payload.books).toHaveLength(1);
		expect(payload.books[0].accuracy_percent).toBe(98);
		expect(payload.books[0].activities_available).toBe(false);
		expect(payload.achievements).toHaveLength(1);
		expect(payload.streak.current_streak).toBe(12);
		expect(payload.xp_ranking.scope).toBe('school');
		expect(payload.xp_ranking.range).toBe('all_time');
	});

	it('keeps null accuracy and hides untrusted activities', () => {
		const payload = normalizeMyProgressPayload({
			hero: { name: 'A', level: 1 } as never,
			statistics: { total_xp: 0, current_rank: null, current_streak: 0 } as never,
			books: [
				{
					subject_id: 1,
					title: 'Math',
					accuracy_percent: null,
					activities_completed: 8,
					activities_available: false,
					next_goal: { available: false },
				} as never,
			],
			achievements: [],
		});

		expect(payload.books[0].accuracy_percent).toBeNull();
		expect(payload.books[0].activities_available).toBe(false);
		expect(payload.books[0].activities_completed).toBeNull();
		expect(payload.statistics.current_rank).toBeNull();
	});

	it('never keeps a fabricated activities count when activities_available is false', () => {
		const payload = normalizeMyProgressPayload({
			hero: { name: 'A', level: 1 } as never,
			statistics: { total_xp: 0, current_rank: null, current_streak: 0 } as never,
			books: [
				{
					subject_id: 9,
					title: 'Letters',
					activities_completed: 0,
					activities_available: false,
					next_goal: { available: false },
				} as never,
			],
			achievements: [],
		});

		expect(payload.books[0].activities_available).toBe(false);
		expect(payload.books[0].activities_completed).toBeNull();
	});
});
