import { describe, expect, it } from 'vitest';
import type { MyProgressPayload } from 'lib/myProgressApi';
import {
	assertNoFigmaMockFallback,
	bookMetricVisibility,
	heroDisplayName,
	isXpRankingRailVisible,
	resolveMyProgressViewState,
	statisticsVisibleCards,
} from './myProgressPageState';

function samplePayload(overrides: Partial<MyProgressPayload> = {}): MyProgressPayload {
	return {
		hero: {
			name: 'Ahmed',
			level: 10,
			level_badge_label: 'builder',
			total_xp: 100,
			next_level_threshold: 300,
			xp_to_next: 200,
			track: {
				start_level: 9,
				current_level: 10,
				achiever_level: 12,
				fill_percent: 20,
			},
			levels_away_from_achiever: 2,
			weekly_xp: 10,
			previous_weekly_xp: 5,
		},
		statistics: {
			total_xp: 100,
			current_rank: 4,
			rank_scope: 'school',
			rank_range: 'all_time',
			current_streak: 3,
		},
		books: [
			{
				subject_id: 1,
				title: 'Letters',
				description: null,
				photo: null,
				stars: { decorative: true },
				units_completed: 1,
				units_total: 2,
				progress_percent: 50,
				xp_this_week: 10,
				accuracy_percent: null,
				activities_completed: null,
				activities_available: false,
				next_goal: {
					available: true,
					title: 'Next',
					lesson_title: 'Lesson 1',
					reward_xp: 30,
					reward_xp_kind: 'potential',
					cta_path: '/learn/1/details/9',
				},
			},
		],
		achievements: [],
		streak: {
			available: true,
			current_streak: 3,
			longest_streak: 5,
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
					student_id: 2,
					name: 'Sara',
					photo_url: null,
					xp: 500,
					is_current: false,
				},
			],
		},
		...overrides,
	};
}

describe('myProgressPageState', () => {
	it('resolves loading / error / empty / ready', () => {
		expect(resolveMyProgressViewState({ loading: true, error: null, data: null })).toBe(
			'loading'
		);
		expect(resolveMyProgressViewState({ loading: false, error: 'x', data: null })).toBe('error');
		expect(
			resolveMyProgressViewState({
				loading: false,
				error: null,
				data: samplePayload({ books: [] }),
			})
		).toBe('empty-books');
		expect(
			resolveMyProgressViewState({ loading: false, error: null, data: samplePayload() })
		).toBe('ready');
	});

	it('hero uses fallback when name blank', () => {
		expect(heroDisplayName(samplePayload().hero, 'Explorer')).toBe('Ahmed');
		expect(
			heroDisplayName({ ...samplePayload().hero, name: '  ' }, 'Explorer')
		).toBe('Explorer');
	});

	it('hides rank card when current_rank is null', () => {
		expect(statisticsVisibleCards(samplePayload().statistics)).toEqual(['xp', 'rank', 'streak']);
		expect(
			statisticsVisibleCards({ ...samplePayload().statistics, current_rank: null })
		).toEqual(['xp', 'streak']);
	});

	it('hides accuracy/activities and keeps continue CTA visibility rules', () => {
		const book = samplePayload().books[0];
		expect(bookMetricVisibility(book)).toEqual({
			accuracy: false,
			activities: false,
			continueLearning: true,
		});
		// Deferred: fabricated/sneaked counts must still stay hidden without activities_available.
		expect(
			bookMetricVisibility({
				...book,
				activities_available: false,
				activities_completed: 8,
			}).activities
		).toBe(false);
		expect(
			bookMetricVisibility({
				...book,
				accuracy_percent: 85,
				activities_available: true,
				activities_completed: 8,
				next_goal: { ...book.next_goal, available: false, cta_path: null },
			})
		).toEqual({
			accuracy: true,
			activities: true,
			continueLearning: false,
		});
	});

	it('xp ranking rail requires XP leaderboard payload', () => {
		expect(isXpRankingRailVisible(samplePayload())).toBe(true);
		expect(
			isXpRankingRailVisible(
				samplePayload({
					xp_ranking: { available: false, scope: 'school', range: 'all_time', items: [] },
				})
			)
		).toBe(false);
	});

	it('does not treat Figma screenshot numbers as empty-payload defaults', () => {
		expect(assertNoFigmaMockFallback(samplePayload())).toBe(true);
		expect(
			assertNoFigmaMockFallback(
				samplePayload({
					hero: { ...samplePayload().hero, name: '', total_xp: 2450 },
				})
			)
		).toBe(false);
	});
});
