import type { DashboardRankingItem, DashboardRankingsPayload } from 'lib/dashboardApi';
import { formatXpCount } from './myProgressBarUtils';

export type RankingTier = 'gold' | 'silver' | 'bronze';

const TOP_RANKING_LIMIT = 3;

export function isTopRankingVisible(rankings: DashboardRankingsPayload): boolean {
	return rankings.available === true && (rankings.items?.length ?? 0) > 0;
}

export function topRankingItems(items: DashboardRankingItem[]): DashboardRankingItem[] {
	return items.slice(0, TOP_RANKING_LIMIT);
}

export function rankingTierForRank(rank: number): RankingTier | null {
	if (rank === 1) {
		return 'gold';
	}
	if (rank === 2) {
		return 'silver';
	}
	if (rank === 3) {
		return 'bronze';
	}
	return null;
}

export function formatRankingWeeklyXp(xp: number | undefined | null): string {
	return formatXpCount(xp ?? 0);
}

export function rankingCardWaveColor(tier: RankingTier): string {
	if (tier === 'gold') {
		return '#e8c84a';
	}
	if (tier === 'silver') {
		return '#b8c4d0';
	}
	return '#d4a882';
}

export function preservesApiRankOrder(items: DashboardRankingItem[]): boolean {
	const displayed = topRankingItems(items);
	return displayed.every((item, index) => item.rank === items[index]?.rank);
}
