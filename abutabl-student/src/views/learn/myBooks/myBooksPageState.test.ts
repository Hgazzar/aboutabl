import { describe, expect, it } from 'vitest';
import type { MyProgressBook } from 'lib/myProgressApi';
import {
	adventureThemeAtIndex,
	MY_BOOKS_FALLBACK_PATH,
	resolveMyBooksContinuePath,
	resolveMyBooksHeroBook,
	resolveMyBooksHeroLessonLabel,
	subjectOverviewPath,
} from './myBooksPageState';

function book(partial: Partial<MyProgressBook> & { subject_id: number }): MyProgressBook {
	return {
		subject_id: partial.subject_id,
		title: partial.title ?? `Book ${partial.subject_id}`,
		description: partial.description ?? null,
		photo: partial.photo ?? null,
		stars: { decorative: true },
		units_completed: partial.units_completed ?? 0,
		units_total: partial.units_total ?? 0,
		progress_percent: partial.progress_percent ?? null,
		xp_this_week: 0,
		accuracy_percent: null,
		activities_completed: null,
		activities_available: false,
		next_goal: partial.next_goal ?? {
			available: false,
			title: null,
			lesson_title: null,
			reward_xp: null,
			reward_xp_kind: null,
			cta_path: null,
		},
	};
}

describe('myBooksPageState', () => {
	it('uses continue_learning.path when available', () => {
		expect(
			resolveMyBooksContinuePath({
				available: true,
				path: '/learn/10/details/99',
			})
		).toBe('/learn/10/details/99');
	});

	it('falls back to /learn/books when continue learning unavailable', () => {
		expect(resolveMyBooksContinuePath({ available: false })).toBe(MY_BOOKS_FALLBACK_PATH);
		expect(resolveMyBooksContinuePath(undefined)).toBe(MY_BOOKS_FALLBACK_PATH);
		expect(resolveMyBooksContinuePath({ available: true, path: '  ' })).toBe(
			MY_BOOKS_FALLBACK_PATH
		);
	});

	it('picks hero book by continue_learning.subject_id', () => {
		const books = [
			book({ subject_id: 1, title: 'A' }),
			book({
				subject_id: 2,
				title: 'B',
				next_goal: {
					available: true,
					title: 'Content',
					lesson_title: 'Lesson',
					reward_xp: 10,
					reward_xp_kind: 'potential',
					cta_path: '/learn/2/details/5',
				},
			}),
		];
		const hero = resolveMyBooksHeroBook(books, {
			available: true,
			subject_id: 1,
			path: '/learn/1/details/9',
		});
		expect(hero?.subject_id).toBe(1);
	});

	it('falls back to book with next_goal then first book', () => {
		const withGoal = book({
			subject_id: 3,
			next_goal: {
				available: true,
				title: 'X',
				lesson_title: null,
				reward_xp: null,
				reward_xp_kind: null,
				cta_path: '/learn/3/details/1',
			},
		});
		expect(resolveMyBooksHeroBook([book({ subject_id: 1 }), withGoal], null)?.subject_id).toBe(
			3
		);
		expect(resolveMyBooksHeroBook([book({ subject_id: 9 })], null)?.subject_id).toBe(9);
		expect(resolveMyBooksHeroBook([], null)).toBeNull();
	});

	it('resolves lesson label from continue learning without inventing numbers', () => {
		expect(
			resolveMyBooksHeroLessonLabel({ available: true, title: 'Letters Day 2' }, null)
		).toBe('Letters Day 2');
		expect(
			resolveMyBooksHeroLessonLabel(null, book({
				subject_id: 1,
				next_goal: {
					available: true,
					title: 'Content A',
					lesson_title: 'Lesson B',
					reward_xp: null,
					reward_xp_kind: null,
					cta_path: '/learn/1/details/2',
				},
			}))
		).toBe('Content A');
		expect(resolveMyBooksHeroLessonLabel(null, book({ subject_id: 1 }))).toBeNull();
	});

	it('preserves subject overview destination', () => {
		expect(subjectOverviewPath(42)).toBe('/learn/42');
	});

	it('cycles adventure themes', () => {
		expect(adventureThemeAtIndex(0)).toBe('teal');
		expect(adventureThemeAtIndex(1)).toBe('sand');
		expect(adventureThemeAtIndex(2)).toBe('lavender');
		expect(adventureThemeAtIndex(3)).toBe('teal');
	});
});
