import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	buildLessonShowPath,
	buildQuizesListPath,
	buildSubjectGamesPath,
	buildViewSubjectPath,
	continueLearningContentPath,
} from './curriculumAccessPaths';

const here = dirname(fileURLToPath(import.meta.url));

function readSrc(relativePath: string): string {
	return readFileSync(join(here, relativePath), 'utf8');
}

describe('curriculum access paths (enrollment-based)', () => {
	it('builds viewSubject path without assignment type/type_id', () => {
		expect(buildViewSubjectPath(42)).toBe('viewSubject/42');
	});

	it('optionally keeps focus unit/lesson query params', () => {
		expect(buildViewSubjectPath(42, { type: 'units', type_id: 9 })).toBe(
			'viewSubject/42?type=units&type_id=9'
		);
	});

	it('builds games/quizzes/lesson paths without assignment context', () => {
		expect(buildSubjectGamesPath(7)).toBe('subjectGames/7');
		expect(buildQuizesListPath(7)).toBe('quizesList/7');
		expect(buildLessonShowPath(15)).toBe('/lessons/show/15');
	});

	it('preserves Continue Learning deep-link shape', () => {
		expect(continueLearningContentPath(10, 99)).toBe('/learn/10/details/99');
	});
});

describe('learnDetails assignment curriculum gates removed', () => {
	const gatePhrase = 'You are not assigned to this subject';

	it('SubjectDetails loads without matching todоaList assignment', () => {
		const src = readSrc('index.tsx');
		expect(src).not.toContain('todoList');
		expect(src).toContain('SubjectDetails');
		expect(src).toContain('BOOK_DETAILS_BACK_PATH');
	});

	it('Book Details back navigates to My Books', () => {
		const src = readSrc('bookDetails/bookDetailsModel.ts');
		expect(src).toContain("/learn/books");
	});

	it('Book Details page avoids nested 80vh tab scroll', () => {
		const src = readSrc('index.tsx');
		expect(src).not.toContain('TabsComponent');
		expect(src).not.toContain('80vh');
		const styles = readSrc('bookDetails/bookDetailsStyles.ts');
		expect(styles).toContain('overflow: visible');
		expect(styles).not.toMatch(/height:\s*80vh/);
	});

	it('Lesson viewer no longer blocks on missing assignment', () => {
		const src = readSrc('components/detailsLesson/index.tsx');
		expect(src).not.toContain(gatePhrase);
		expect(src).not.toContain('todoList');
		expect(src).toContain('SubjectDetails({ id })');
	});

	it('Game viewer no longer blocks on missing assignment', () => {
		const src = readSrc('components/detailsGame/index.tsx');
		expect(src).not.toContain(gatePhrase);
		expect(src).not.toContain('todoList');
		expect(src).toContain('gamesList({ id })');
	});

	it('Games tab loads without assignment', () => {
		const src = readSrc('components/games/index.tsx');
		expect(src).not.toContain('todoList');
		expect(src).toContain('gamesList({ id })');
	});

	it('Quizzes tab loads without assignment', () => {
		const src = readSrc('components/quizzes/index.tsx');
		expect(src).not.toContain('todoList');
		expect(src).toContain('quizesList({ id })');
	});

	it('Units no longer depend on assignment type/type_id for lesson fetch', () => {
		const src = readSrc('components/units/index.tsx');
		expect(src).not.toContain('todoList');
		expect(src).toContain('lessonContent({ id: lid })');
		expect(src).toContain('lessonContent({ id: lesson?.id })');
	});

	it('Todo domain remains assignment-based (unchanged overlay)', () => {
		const todoSrc = readFileSync(join(here, '../todo/todoTabRoute.ts'), 'utf8');
		expect(todoSrc.length).toBeGreaterThan(0);
		expect(todoSrc).toContain('parseTodoTabParam');
	});
});
