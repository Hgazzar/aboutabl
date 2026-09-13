import { describe, expect, it } from 'vitest';
import type { DashboardRankingItem, DashboardRankingsPayload } from 'lib/dashboardApi';
import {
	formatRankingWeeklyXp,
	isTopRankingVisible,
	preservesApiRankOrder,
	rankingCardWaveColor,
	rankingTierForRank,
	topRankingItems,
} from './topRankingUtils';

const sampleRankingItem = (
	overrides: Partial<DashboardRankingItem> = {}
): DashboardRankingItem => ({
	student_id: 1,
	name: 'Ali',
	photo_url: null,
	rank: 1,
	score_percent: 25,
	weekly_xp: 220,
	is_current: true,
	...overrides,
});

const sampleRankings = (
	overrides: Partial<DashboardRankingsPayload> = {}
): DashboardRankingsPayload => ({
	available: true,
	class_rank: 1,
	score_percent: 25,
	items: [
		sampleRankingItem(),
		sampleRankingItem({
			student_id: 2,
			name: 'Sara',
			rank: 2,
			score_percent: 0,
			weekly_xp: 0,
			is_current: false,
		}),
		sampleRankingItem({
			student_id: 3,
			name: 'Omar',
			rank: 3,
			score_percent: 0,
			weekly_xp: 0,
			is_current: false,
		}),
	],
	...overrides,
});

describe('topRankingUtils', () => {
	it('shows top 3 ranking items only', () => {
		const items = [
			...sampleRankings().items,
			sampleRankingItem({ student_id: 4, name: 'Noor', rank: 4, weekly_xp: 999 }),
		];

		expect(topRankingItems(items)).toHaveLength(3);
		expect(topRankingItems(items).map((row) => row.rank)).toEqual([1, 2, 3]);
	});

	it('preserves API rank order from the payload', () => {
		const rankings = sampleRankings();
		expect(preservesApiRankOrder(rankings.items)).toBe(true);
		expect(topRankingItems(rankings.items).map((row) => row.rank)).toEqual([1, 2, 3]);
	});

	it('does not reorder items by weekly_xp', () => {
		const items = [
			sampleRankingItem({ student_id: 1, rank: 1, weekly_xp: 0 }),
			sampleRankingItem({ student_id: 2, rank: 2, weekly_xp: 500 }),
			sampleRankingItem({ student_id: 3, rank: 3, weekly_xp: 100 }),
		];

		const displayed = topRankingItems(items);
		expect(displayed[0].weekly_xp).toBe(0);
		expect(displayed[1].weekly_xp).toBe(500);
		expect(displayed[2].weekly_xp).toBe(100);
		expect(displayed.map((row) => row.rank)).toEqual([1, 2, 3]);
	});

	it('formats weekly_xp from payload values', () => {
		expect(formatRankingWeeklyXp(220)).toBe('220XP');
		expect(formatRankingWeeklyXp(undefined)).toBe('0XP');
	});

	it('assigns gold, silver, and bronze tiers for ranks 1 through 3', () => {
		expect(rankingTierForRank(1)).toBe('gold');
		expect(rankingTierForRank(2)).toBe('silver');
		expect(rankingTierForRank(3)).toBe('bronze');
		expect(rankingTierForRank(4)).toBeNull();
	});

	it('uses distinct wave colors per tier', () => {
		expect(rankingCardWaveColor('gold')).not.toBe(rankingCardWaveColor('silver'));
		expect(rankingCardWaveColor('silver')).not.toBe(rankingCardWaveColor('bronze'));
	});

	it('hides widget when rankings are unavailable or empty', () => {
		expect(isTopRankingVisible(sampleRankings())).toBe(true);
		expect(isTopRankingVisible(sampleRankings({ available: false }))).toBe(false);
		expect(isTopRankingVisible(sampleRankings({ items: [] }))).toBe(false);
	});
});
