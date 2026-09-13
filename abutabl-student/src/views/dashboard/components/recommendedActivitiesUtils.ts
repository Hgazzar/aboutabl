import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import type {
	DashboardRecommendedActivityItem,
	DashboardRecentActivityItem,
} from 'lib/dashboardApi';

export function recommendedCtaPath(item: DashboardRecommendedActivityItem): string {
	if (item.cta_path) {
		return item.cta_path;
	}

	if (item.kind === 'continue_learning' && item.subject_id) {
		return `/learn/${item.subject_id}`;
	}

	if (item.kind === 'pending_assignments') {
		return '/todo';
	}

	if (item.kind === 'game') {
		return '/games';
	}

	return '/learn/books';
}

export function shouldShowPotentialXp(item: DashboardRecommendedActivityItem): boolean {
	return item.reward_xp_kind === 'potential' && item.reward_xp != null && item.reward_xp > 0;
}

export function formatPotentialXp(xp: number): string {
	return `+${Math.max(0, Math.round(xp))}XP`;
}

export function formatEarnedXp(xp: number | null | undefined): string | null {
	if (xp == null || xp <= 0) {
		return null;
	}

	return `+${Math.max(0, Math.round(xp))}XP`;
}

export function birdAssetForVisual(visual: string | undefined): string {
	switch (visual) {
		case 'bird_assignments':
			return figmaDashboardAssetUrl('recommended-bird-assignments.png');
		case 'bird_books':
		case 'bird_books_sm':
			return figmaDashboardAssetUrl('recommended-bird-books.png');
		case 'bird_gaming':
			return figmaDashboardAssetUrl('recommended-bird-gaming.png');
		default:
			return figmaDashboardAssetUrl('recommended-bird-books.png');
	}
}

export function recentRowTheme(theme: string | undefined): 'cream' | 'lavender' {
	return theme === 'lavender' ? 'lavender' : 'cream';
}

type FormatMessage = (descriptor: { id: string }, values?: Record<string, unknown>) => string;

export function formatRecentActivityDate(iso: string, formatMessage: FormatMessage): string {
	try {
		const date = new Date(iso);
		const now = new Date();
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const diffDays = Math.round(
			(startOfToday.getTime() - startOfTarget.getTime()) / (24 * 60 * 60 * 1000)
		);

		if (diffDays === 1) {
			return formatMessage({ id: 'dashboard-recent-yesterday' });
		}

		const formatted = date.toLocaleDateString(undefined, {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});

		return formatMessage({ id: 'dashboard-recent-on-date' }, { date: formatted });
	} catch {
		return '';
	}
}

/** @deprecated Use inline rich text in RecentActivitiesWidget. */
export function recentActivityTitle(item: DashboardRecentActivityItem): string {
	if (item.content_label && item.subject_name) {
		return `${item.content_label} · ${item.subject_name}`;
	}

	return item.content_label || item.subject_name || '';
}

/** @deprecated Use widget6CardStyles cardSurfaceStyles. */
export function cardThemeBackground(_theme: string | undefined): string {
	return '#ffffff';
}
