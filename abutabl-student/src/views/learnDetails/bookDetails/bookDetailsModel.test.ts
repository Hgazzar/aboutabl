import { describe, expect, it } from 'vitest';
import {
	BOOK_DETAILS_BACK_PATH,
	buildUnitTimelineActivities,
	contentViewerPath,
	curriculumGamePath,
	findBookProgress,
	parseViewSubjectPayload,
	quizPath,
	resolveBookDetailsContinuePath,
	resolveInitialUnitId,
	splitVisibleUnits,
} from './bookDetailsModel';
import type { ViewSubjectUnit } from './bookDetailsTypes';

const sampleUnit = (partial?: Partial<ViewSubjectUnit>): ViewSubjectUnit => ({
	id: 1,
	name: 'Unit 1',
	lessons: [
		{
			id: 10,
			name: 'Lesson A',
			contents: [{ id: 100, name: 'Intro Video', type: 'video' }],
			quizesLesson: [{ id: 50, title: 'Quiz A' }],
		},
		{
			id: 11,
			name: 'Lesson B',
			contents: [
				{ id: 101, name: 'Part 1', type: 'pdf' },
				{ id: 102, name: 'Part 2', type: 'scorm' },
			],
			quizesLesson: [],
		},
	],
	quizesUnit: [{ id: 60, title: 'Unit Quiz' }],
	...partial,
});

describe('bookDetailsModel', () => {
	it('keeps back path to My Books', () => {
		expect(BOOK_DETAILS_BACK_PATH).toBe('/learn/books');
	});

	it('parses viewSubject success and rejects status false', () => {
		expect(
			parseViewSubjectPayload({
				status: true,
				basic_info: { id: 5, name: 'Math' },
				units: [],
			})?.basic_info?.id
		).toBe(5);
		expect(parseViewSubjectPayload({ status: false, basic_info: { id: 5, name: 'X' } })).toBeNull();
	});

	it('selects focus unit or defaults to first', () => {
		const units = [sampleUnit({ id: 1 }), sampleUnit({ id: 2, name: 'U2' })];
		expect(resolveInitialUnitId(units, '2')).toBe(2);
		expect(resolveInitialUnitId(units, null)).toBe(1);
		expect(resolveInitialUnitId([], null)).toBeNull();
	});

	it('reads progress from my-progress book only', () => {
		expect(
			findBookProgress(
				[
					{
						subject_id: 9,
						title: 'T',
						description: null,
						photo: null,
						stars: { decorative: true },
						units_completed: 2,
						units_total: 8,
						progress_percent: 25,
						xp_this_week: 0,
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
					},
				],
				9
			)?.progress_percent
		).toBe(25);
		expect(findBookProgress([], 9)).toBeNull();
	});

	it('builds timeline with contentId destinations (not lessonId)', () => {
		const items = buildUnitTimelineActivities({
			subjectId: 7,
			unit: sampleUnit(),
			worksheets: [{ id: 1, title: 'WS', file_url: 'https://example.com/w.pdf' }],
			games: [{ id: 3, name: 'Race' }],
		});
		expect(items.some((i) => i.href === contentViewerPath(7, 100))).toBe(true);
		expect(items.some((i) => i.href === contentViewerPath(7, 101))).toBe(true);
		expect(items.some((i) => i.href === `/learn/7/details/10`)).toBe(false);
		expect(items.every((i) => i.kind !== 'lesson_content' || !i.href.endsWith('/details/10'))).toBe(
			true
		);
		expect(items.some((i) => i.href === quizPath(7, 50))).toBe(true);
		expect(items.some((i) => i.href === quizPath(7, 60))).toBe(true);
		expect(items.find((i) => i.kind === 'worksheet')?.external).toBe(true);
		expect(items.find((i) => i.kind === 'game')?.href).toBe(curriculumGamePath(7, 3));
	});

	it('splits overflow units data-driven', () => {
		const units = Array.from({ length: 10 }, (_, i) => sampleUnit({ id: i + 1, name: `U${i + 1}` }));
		const split = splitVisibleUnits(units, 6);
		expect(split.visible).toHaveLength(6);
		expect(split.overflowCount).toBe(4);
	});

	it('resolves continue path without inventing destinations', () => {
		expect(
			resolveBookDetailsContinuePath({
				subjectId: 7,
				continuePath: '/learn/7/details/99',
				continueSubjectId: 7,
				nextGoalPath: null,
				firstContentHref: '/learn/7/details/1',
			})
		).toBe('/learn/7/details/99');
		expect(
			resolveBookDetailsContinuePath({
				subjectId: 7,
				continuePath: '/learn/8/details/1',
				continueSubjectId: 8,
				nextGoalPath: '/learn/7/details/2',
				firstContentHref: '/learn/7/details/1',
			})
		).toBe('/learn/7/details/2');
	});
});
