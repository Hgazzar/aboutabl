import type { MyProgressBook, MyProgressHero } from 'lib/myProgressApi';
import type { ProfileAchievement } from 'views/profile/types';

export type BookCardTheme = 'lavender' | 'cream' | 'mint' | 'pink';

const BOOK_THEMES: BookCardTheme[] = ['lavender', 'cream', 'mint', 'pink'];

export function bookThemeAtIndex(index: number): BookCardTheme {
	return BOOK_THEMES[Math.abs(index) % BOOK_THEMES.length] ?? 'lavender';
}

export function formatUnitsProgress(completed: number, total: number): string {
	return `${Math.max(0, completed)} / ${Math.max(0, total)}`;
}

export function formatUnitsProgressLabel(completed: number, total: number): string {
	return `${formatUnitsProgress(completed, total)} Units`;
}

export function formatWeeklyXpValue(xp: number): string {
	const amount = Math.max(0, Math.round(xp));
	return `+${amount}XP`;
}

export function formatAccuracyValue(value: number): string {
	const rounded = Math.round(value * 10) / 10;
	return `${rounded}%`;
}

export function formatActivitiesValue(count: number): string {
	return `${Math.max(0, Math.round(count))} Activities`;
}

export function formatStatTotalXp(totalXp: number): string {
	return `${Math.max(0, Math.round(totalXp))} Total XP`;
}

export function formatStatSchoolRank(rank: number): string {
	return `#${Math.max(0, Math.round(rank))} School Rank`;
}

export function formatStatStreakDays(count: number): string {
	const days = Math.max(0, Math.round(count));
	return `${days} Days`;
}

export function bookProgressPercent(book: Pick<MyProgressBook, 'progress_percent' | 'units_completed' | 'units_total'>): number {
	if (book.progress_percent != null && Number.isFinite(book.progress_percent)) {
		return Math.max(0, Math.min(100, book.progress_percent));
	}
	if (book.units_total > 0) {
		return Math.max(0, Math.min(100, (book.units_completed / book.units_total) * 100));
	}
	return 0;
}

/** Filled hex stars from real book unit progress (0–total), not a Figma placeholder. */
export function bookStarsFilled(
	book: Pick<MyProgressBook, 'progress_percent' | 'units_completed' | 'units_total'>,
	total = 4
): number {
	const slots = Math.max(1, Math.round(total));
	const percent = bookProgressPercent(book);
	return Math.max(0, Math.min(slots, Math.round((percent / 100) * slots)));
}

/** Filled rail badge stars from earned API achievements (capped at slots). */
export function badgeStarsFilled(items: ProfileAchievement[], total = 4): number {
	const slots = Math.max(1, Math.round(total));
	const earned = items.filter((item) => item.earned).length;
	return Math.max(0, Math.min(slots, earned));
}

/** Display XP badge label from API (`builder` → `Builder`). */
export function formatHeroBadgeTitle(label: string): string {
	const trimmed = label.trim();
	if (!trimmed) return '';
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function shouldShowAccuracy(book: Pick<MyProgressBook, 'accuracy_percent'>): boolean {
	return book.accuracy_percent != null && Number.isFinite(book.accuracy_percent);
}

export function shouldShowActivities(
	book: Pick<MyProgressBook, 'activities_available' | 'activities_completed'>
): boolean {
	return book.activities_available === true && book.activities_completed != null;
}

export function shouldShowContinueCta(
	book: Pick<MyProgressBook, 'next_goal'>
): boolean {
	return (
		book.next_goal.available === true &&
		typeof book.next_goal.cta_path === 'string' &&
		book.next_goal.cta_path.length > 0
	);
}

/** Display title from real lesson/content names — never Figma mock copy. */
export function formatNextGoalTitle(
	nextGoal: Pick<MyProgressBook['next_goal'], 'available' | 'title' | 'lesson_title'>,
	completeLessonLabel: (lesson: string, content: string) => string
): string | null {
	if (!nextGoal.available) return null;
	const content = nextGoal.title?.trim() || '';
	const lesson = nextGoal.lesson_title?.trim() || '';
	if (lesson && content) {
		return completeLessonLabel(lesson, content);
	}
	return content || lesson || null;
}

export function formatHeroXpRatio(hero: Pick<MyProgressHero, 'total_xp' | 'next_level_threshold'>): string {
	if (hero.next_level_threshold != null) {
		return `${hero.total_xp} / ${hero.next_level_threshold} XP`;
	}
	return `${hero.total_xp} XP`;
}

export function formatAccuracyPercent(value: number): string {
	return formatAccuracyValue(value);
}
