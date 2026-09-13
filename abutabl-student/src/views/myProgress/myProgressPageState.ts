import type { MyProgressHero, MyProgressPayload, MyProgressStatistics } from 'lib/myProgressApi';
import { shouldShowAccuracy, shouldShowActivities, shouldShowContinueCta } from './myProgressUtils';

export type MyProgressViewState = 'loading' | 'error' | 'empty-books' | 'ready';

export function resolveMyProgressViewState(args: {
	loading: boolean;
	error: string | null;
	data: MyProgressPayload | null;
}): MyProgressViewState {
	if (args.loading && !args.data) {
		return 'loading';
	}
	if (!args.data) {
		return 'error';
	}
	if (args.data.books.length === 0) {
		return 'empty-books';
	}
	return 'ready';
}

export function heroDisplayName(hero: MyProgressHero, fallback: string): string {
	const name = hero.name.trim();
	return name || fallback;
}

export function statisticsVisibleCards(stats: MyProgressStatistics): Array<'xp' | 'rank' | 'streak'> {
	const cards: Array<'xp' | 'rank' | 'streak'> = ['xp'];
	if (stats.current_rank != null) {
		cards.push('rank');
	}
	cards.push('streak');
	return cards;
}

export function bookMetricVisibility(book: MyProgressPayload['books'][number]): {
	accuracy: boolean;
	activities: boolean;
	continueLearning: boolean;
} {
	return {
		accuracy: shouldShowAccuracy(book),
		activities: shouldShowActivities(book),
		continueLearning: shouldShowContinueCta(book),
	};
}

export function isXpRankingRailVisible(payload: MyProgressPayload): boolean {
	return payload.xp_ranking.available === true && payload.xp_ranking.items.length > 0;
}

export function assertNoFigmaMockFallback(payload: MyProgressPayload): boolean {
	// Guard: never treat Figma mock numbers as baked defaults in empty payload.
	if (payload.hero.total_xp === 2450 && payload.hero.name === '') {
		return false;
	}
	return true;
}
