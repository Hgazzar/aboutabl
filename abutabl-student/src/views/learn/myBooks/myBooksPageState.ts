import type { MyProgressBook } from 'lib/myProgressApi';
import { shouldShowContinueCta } from 'views/myProgress/myProgressUtils';

export const MY_BOOKS_FALLBACK_PATH = '/learn/books';

export type MyBooksContinueLearning = {
	available?: boolean;
	subject_id?: number;
	subject_name?: string | null;
	lesson_id?: number;
	content_id?: number;
	title?: string;
	lesson_title?: string | null;
	lesson_progress_percent?: number;
	path?: string | null;
};

/** Same fallback contract as Dashboard Hello Continue Learning. */
export function resolveMyBooksContinuePath(
	continueLearning: MyBooksContinueLearning | null | undefined
): string {
	if (
		continueLearning?.available === true &&
		typeof continueLearning.path === 'string' &&
		continueLearning.path.trim()
	) {
		return continueLearning.path.trim();
	}
	return MY_BOOKS_FALLBACK_PATH;
}

/**
 * Hero book = enrolled book matching global Continue Learning subject,
 * else first book with a next_goal CTA, else first enrolled book.
 */
export function resolveMyBooksHeroBook(
	books: MyProgressBook[],
	continueLearning: MyBooksContinueLearning | null | undefined
): MyProgressBook | null {
	if (!books.length) {
		return null;
	}

	const subjectId = Number(continueLearning?.subject_id);
	if (continueLearning?.available === true && Number.isFinite(subjectId) && subjectId > 0) {
		const matched = books.find((book) => book.subject_id === subjectId);
		if (matched) {
			return matched;
		}
	}

	const withGoal = books.find((book) => shouldShowContinueCta(book));
	return withGoal ?? books[0] ?? null;
}

/** Real lesson/content label for hero subtitle — never invent lesson numbers. */
export function resolveMyBooksHeroLessonLabel(
	continueLearning: MyBooksContinueLearning | null | undefined,
	heroBook: MyProgressBook | null
): string | null {
	const fromContinue =
		(typeof continueLearning?.title === 'string' && continueLearning.title.trim()) ||
		(typeof continueLearning?.lesson_title === 'string' && continueLearning.lesson_title.trim()) ||
		'';
	if (fromContinue) {
		return fromContinue;
	}

	const goal = heroBook?.next_goal;
	if (goal?.available) {
		const fromGoal =
			(goal.title?.trim() || '') || (goal.lesson_title?.trim() || '');
		if (fromGoal) {
			return fromGoal;
		}
	}

	return null;
}

export function subjectOverviewPath(subjectId: number): string {
	return `/learn/${subjectId}`;
}

export type MyBooksAdventureTheme = 'teal' | 'sand' | 'lavender';

const ADVENTURE_THEMES: MyBooksAdventureTheme[] = ['teal', 'sand', 'lavender'];

export function adventureThemeAtIndex(index: number): MyBooksAdventureTheme {
	return ADVENTURE_THEMES[Math.abs(index) % ADVENTURE_THEMES.length] ?? 'teal';
}
