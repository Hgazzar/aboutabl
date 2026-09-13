import type { MyProgressBook } from 'lib/myProgressApi';
import type {
	CurriculumGameItem,
	TimelineActivity,
	ViewSubjectPayload,
	ViewSubjectUnit,
	ViewSubjectWorksheet,
} from './bookDetailsTypes';

export const BOOK_DETAILS_BACK_PATH = '/learn/books';

/** Visible unit tabs before “+N Units” overflow control. */
export const UNIT_TABS_VISIBLE = 6;

export function parseViewSubjectPayload(raw: unknown): ViewSubjectPayload | null {
	if (!raw || typeof raw !== 'object') return null;
	const data = raw as ViewSubjectPayload;
	if (data.status === false) return null;
	if (!data.basic_info || !Number(data.basic_info.id)) return null;
	return data;
}

export function normalizeUnits(units: ViewSubjectUnit[] | undefined): ViewSubjectUnit[] {
	if (!Array.isArray(units)) return [];
	return units.filter((u) => u && Number(u.id) > 0);
}

export function resolveInitialUnitId(
	units: ViewSubjectUnit[],
	focusUnit: string | null
): number | null {
	if (!units.length) return null;
	if (focusUnit) {
		const id = Number(focusUnit);
		const match = units.find((u) => u.id === id);
		if (match) return match.id;
	}
	return units[0]?.id ?? null;
}

/** Canonical book progress from my-progress — never compute locally. */
export function findBookProgress(
	books: MyProgressBook[] | undefined,
	subjectId: number
): Pick<MyProgressBook, 'progress_percent' | 'units_completed' | 'units_total' | 'next_goal'> | null {
	if (!Array.isArray(books) || subjectId <= 0) return null;
	const book = books.find((b) => b.subject_id === subjectId);
	if (!book) return null;
	return {
		progress_percent: book.progress_percent,
		units_completed: book.units_completed,
		units_total: book.units_total,
		next_goal: book.next_goal,
	};
}

export function contentViewerPath(subjectId: number | string, contentId: number | string): string {
	return `/learn/${subjectId}/details/${contentId}`;
}

export function quizPath(subjectId: number | string, quizId: number | string): string {
	return `/learn/${subjectId}/quiz/${quizId}`;
}

export function curriculumGamePath(subjectId: number | string, gameId: number | string): string {
	return `/learn/${subjectId}/detailsGame/${gameId}`;
}

/**
 * Build timeline for one unit from viewSubject + optional subject-level worksheets/games.
 * Lesson rows map to lesson contents (contentId), never lessonId-as-contentId.
 */
export function buildUnitTimelineActivities(args: {
	subjectId: number;
	unit: ViewSubjectUnit;
	worksheets: ViewSubjectWorksheet[];
	games: CurriculumGameItem[];
}): TimelineActivity[] {
	const { subjectId, unit, worksheets, games } = args;
	const items: TimelineActivity[] = [];
	let themeIndex = 0;

	const push = (activity: Omit<TimelineActivity, 'themeIndex'>) => {
		items.push({ ...activity, themeIndex: themeIndex++ });
	};

	for (const lesson of unit.lessons ?? []) {
		const contents = Array.isArray(lesson.contents) ? lesson.contents : [];
		if (contents.length === 0) {
			continue;
		}
		for (const content of contents) {
			const contentId = Number(content.id);
			if (!Number.isFinite(contentId) || contentId <= 0) continue;
			const title =
				contents.length === 1
					? lesson.name || content.name
					: `${lesson.name}: ${content.name}`;
			push({
				key: `content-${contentId}`,
				kind: 'lesson_content',
				title,
				href: contentViewerPath(subjectId, contentId),
				external: false,
			});
		}

		for (const quiz of lesson.quizesLesson ?? []) {
			const quizId = Number(quiz.id);
			if (!Number.isFinite(quizId) || quizId <= 0) continue;
			push({
				key: `lesson-quiz-${quizId}`,
				kind: 'quiz',
				title: quiz.title || `Quiz ${quizId}`,
				href: quizPath(subjectId, quizId),
				external: false,
			});
		}
	}

	for (const quiz of unit.quizesUnit ?? []) {
		const quizId = Number(quiz.id);
		if (!Number.isFinite(quizId) || quizId <= 0) continue;
		push({
			key: `unit-quiz-${quizId}`,
			kind: 'quiz',
			title: quiz.title || `Quiz ${quizId}`,
			href: quizPath(subjectId, quizId),
			external: false,
		});
	}

	for (const sheet of worksheets) {
		const sheetId = Number(sheet.id);
		const url = typeof sheet.file_url === 'string' ? sheet.file_url.trim() : '';
		if (!Number.isFinite(sheetId) || sheetId <= 0 || !url) continue;
		push({
			key: `worksheet-${sheetId}`,
			kind: 'worksheet',
			title: sheet.title || `Worksheet ${sheetId}`,
			href: url,
			external: true,
		});
	}

	for (const game of games) {
		const gameId = Number(game.id);
		if (!Number.isFinite(gameId) || gameId <= 0) continue;
		push({
			key: `game-${gameId}`,
			kind: 'game',
			title: game.name || `Game ${gameId}`,
			href: curriculumGamePath(subjectId, gameId),
			external: false,
		});
	}

	return items;
}

export function splitVisibleUnits(units: ViewSubjectUnit[], visibleCount = UNIT_TABS_VISIBLE) {
	const visible = units.slice(0, Math.max(0, visibleCount));
	const overflow = units.slice(Math.max(0, visibleCount));
	return { visible, overflow, overflowCount: overflow.length };
}

/** Hero continue: prefer matching continue_learning / next_goal; else first content of active unit. */
export function resolveBookDetailsContinuePath(args: {
	subjectId: number;
	continuePath: string | null | undefined;
	continueSubjectId: number | null | undefined;
	nextGoalPath: string | null | undefined;
	firstContentHref: string | null;
}): string | null {
	const { subjectId, continuePath, continueSubjectId, nextGoalPath, firstContentHref } = args;
	if (
		continueSubjectId === subjectId &&
		typeof continuePath === 'string' &&
		continuePath.trim()
	) {
		return continuePath.trim();
	}
	if (typeof nextGoalPath === 'string' && nextGoalPath.trim()) {
		return nextGoalPath.trim();
	}
	return firstContentHref;
}
