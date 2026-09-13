import { describe, expect, it } from 'vitest';
import type { MyProgressBook } from 'lib/myProgressApi';
import {
	bookProgressPercent,
	bookThemeAtIndex,
	formatAccuracyValue,
	formatActivitiesValue,
	formatHeroXpRatio,
	formatStatSchoolRank,
	formatStatStreakDays,
	formatStatTotalXp,
	formatUnitsProgress,
	formatUnitsProgressLabel,
	formatWeeklyXpValue,
	shouldShowAccuracy,
	shouldShowActivities,
	shouldShowContinueCta,
	bookStarsFilled,
	badgeStarsFilled,
	formatHeroBadgeTitle,
	formatNextGoalTitle,
} from './myProgressUtils';

function sampleBook(overrides: Partial<MyProgressBook> = {}): MyProgressBook {
	return {
		subject_id: 1,
		title: 'Book',
		description: null,
		photo: null,
		stars: { decorative: true },
		units_completed: 1,
		units_total: 4,
		progress_percent: 25,
		xp_this_week: 10,
		accuracy_percent: null,
		activities_completed: null,
		activities_available: false,
		next_goal: {
			available: false,
			title: null,
			lesson_title: null,
			reward_xp: null,
			reward_xp_kind: null,
			cta_path: null,
		},
		...overrides,
	};
}

describe('myProgressUtils', () => {
	it('cycles book themes', () => {
		expect(bookThemeAtIndex(0)).toBe('lavender');
		expect(bookThemeAtIndex(1)).toBe('cream');
		expect(bookThemeAtIndex(4)).toBe('lavender');
	});

	it('formats units and hero xp ratio', () => {
		expect(formatUnitsProgress(7, 12)).toBe('7 / 12');
		expect(formatUnitsProgressLabel(7, 12)).toBe('7 / 12 Units');
		expect(formatHeroXpRatio({ total_xp: 2450, next_level_threshold: 3000 })).toBe(
			'2450 / 3000 XP'
		);
		expect(formatHeroXpRatio({ total_xp: 100, next_level_threshold: null })).toBe('100 XP');
	});

	it('formats book metrics without mislabeling units or accuracy as XP', () => {
		expect(formatWeeklyXpValue(120)).toBe('+120XP');
		expect(formatAccuracyValue(85)).toBe('85%');
		expect(formatActivitiesValue(8)).toBe('8 Activities');
		expect(formatStatTotalXp(2450)).toBe('2450 Total XP');
		expect(formatStatSchoolRank(4)).toBe('#4 School Rank');
		expect(formatStatStreakDays(244)).toBe('244 Days');
	});

	it('hides null accuracy and unavailable activities', () => {
		expect(shouldShowAccuracy(sampleBook())).toBe(false);
		expect(shouldShowAccuracy(sampleBook({ accuracy_percent: 90 }))).toBe(true);
		expect(shouldShowActivities(sampleBook())).toBe(false);
		// Deferred metric: never treat unavailable payload as displayable, even if a number sneaks in.
		expect(
			shouldShowActivities(
				sampleBook({ activities_available: false, activities_completed: 8 })
			)
		).toBe(false);
		expect(
			shouldShowActivities(
				sampleBook({ activities_available: false, activities_completed: 0 })
			)
		).toBe(false);
		expect(
			shouldShowActivities(
				sampleBook({ activities_available: true, activities_completed: 8 })
			)
		).toBe(true);
	});

	it('does not invent a client-side activities count when deferred', () => {
		const book = sampleBook({
			activities_available: false,
			activities_completed: null,
		});
		expect(shouldShowActivities(book)).toBe(false);
		expect(book.activities_completed).toBeNull();
		// formatActivitiesValue exists only for trusted API values — must not be used as fallback for null.
		expect(book.activities_available).toBe(false);
	});

	it('shows continue CTA only with available path', () => {
		expect(shouldShowContinueCta(sampleBook())).toBe(false);
		expect(
			shouldShowContinueCta(
				sampleBook({
					next_goal: {
						available: true,
						title: 'Next',
						lesson_title: 'Lesson 7',
						reward_xp: 30,
						reward_xp_kind: 'potential',
						cta_path: '/learn/1/details/2',
					},
				})
			)
		).toBe(true);
	});

	it('derives progress percent from units when missing', () => {
		expect(bookProgressPercent(sampleBook({ progress_percent: null, units_completed: 1, units_total: 4 }))).toBe(
			25
		);
		expect(bookProgressPercent(sampleBook({ progress_percent: 58.3 }))).toBe(58.3);
	});

	it('fills book stars from real progress instead of a placeholder count', () => {
		expect(bookStarsFilled(sampleBook({ progress_percent: 0, units_completed: 0, units_total: 4 }))).toBe(0);
		expect(bookStarsFilled(sampleBook({ progress_percent: 25, units_completed: 1, units_total: 4 }))).toBe(1);
		expect(bookStarsFilled(sampleBook({ progress_percent: 50, units_completed: 2, units_total: 4 }))).toBe(2);
		expect(bookStarsFilled(sampleBook({ progress_percent: 100, units_completed: 4, units_total: 4 }))).toBe(4);
		expect(bookStarsFilled(sampleBook({ progress_percent: null, units_completed: 3, units_total: 4 }))).toBe(3);
	});

	it('fills achievement rail stars from earned API items only', () => {
		expect(badgeStarsFilled([])).toBe(0);
		expect(
			badgeStarsFilled([
				{ key: 'a', title: 'A', description: '', icon: '', progress: 100, earned: true, earned_at: null },
				{ key: 'b', title: 'B', description: '', icon: '', progress: 50, earned: false, earned_at: null },
			])
		).toBe(1);
		expect(
			badgeStarsFilled(
				[
					{ key: 'a', title: 'A', description: '', icon: '', progress: 100, earned: true, earned_at: null },
					{ key: 'b', title: 'B', description: '', icon: '', progress: 100, earned: true, earned_at: null },
					{ key: 'c', title: 'C', description: '', icon: '', progress: 100, earned: true, earned_at: null },
					{ key: 'd', title: 'D', description: '', icon: '', progress: 100, earned: true, earned_at: null },
					{ key: 'e', title: 'E', description: '', icon: '', progress: 100, earned: true, earned_at: null },
				],
				4
			)
		).toBe(4);
	});

	it('formats hero badge title from API label', () => {
		expect(formatHeroBadgeTitle('builder')).toBe('Builder');
		expect(formatHeroBadgeTitle('Achiever')).toBe('Achiever');
		expect(formatHeroBadgeTitle('')).toBe('');
	});

	it('formats next-goal title from real lesson + content names', () => {
		expect(
			formatNextGoalTitle(
				{
					available: true,
					lesson_title: 'Lesson 7',
					title: 'Letter Ss',
				},
				(lesson, content) => `Complete ${lesson}: ${content}`
			)
		).toBe('Complete Lesson 7: Letter Ss');
		expect(
			formatNextGoalTitle(
				{ available: true, lesson_title: null, title: 'Intro PDF' },
				(lesson, content) => `Complete ${lesson}: ${content}`
			)
		).toBe('Intro PDF');
		expect(
			formatNextGoalTitle(
				{ available: false, lesson_title: 'Lesson 7', title: 'Letter Ss' },
				(lesson, content) => `Complete ${lesson}: ${content}`
			)
		).toBeNull();
	});
});
