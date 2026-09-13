import { describe, expect, it } from 'vitest';
import {
	applyLeaderboardFiltersToSearchParams,
	formatOrdinalEn,
	formatRankDelta,
	formatSignedRangeXp,
	heroTitleLine1Key,
	heroTitleLine2Key,
	isLeaderboardEmpty,
	parseLeaderboardRange,
	parseLeaderboardScope,
	rangeLabelKey,
	rankingTierForRank,
	readLeaderboardFiltersFromSearchParams,
	scopeLabelKey,
} from './leaderboardUtils';

describe('leaderboardUtils', () => {
	it('parses scope and range with safe defaults', () => {
		expect(parseLeaderboardScope(null)).toBe('school');
		expect(parseLeaderboardScope('class')).toBe('class');
		expect(parseLeaderboardScope('grade')).toBe('school');
		expect(parseLeaderboardRange(null)).toBe('week');
		expect(parseLeaderboardRange('month')).toBe('month');
		expect(parseLeaderboardRange('all_time')).toBe('all_time');
		expect(parseLeaderboardRange('day')).toBe('week');
	});

	it('reads and writes URL filter params', () => {
		const params = new URLSearchParams('scope=class&range=month');
		expect(readLeaderboardFiltersFromSearchParams(params)).toEqual({
			scope: 'class',
			range: 'month',
		});

		const defaults = applyLeaderboardFiltersToSearchParams(new URLSearchParams(), 'school', 'week');
		expect(defaults.toString()).toBe('');

		const next = applyLeaderboardFiltersToSearchParams(new URLSearchParams(), 'class', 'all_time');
		expect(next.get('scope')).toBe('class');
		expect(next.get('range')).toBe('all_time');
	});

	it('maps scope and range label keys', () => {
		expect(scopeLabelKey('school')).toBe('leaderboard-scope-school');
		expect(scopeLabelKey('class')).toBe('leaderboard-scope-class');
		expect(rangeLabelKey('week')).toBe('leaderboard-range-week');
		expect(rangeLabelKey('month')).toBe('leaderboard-range-month');
		expect(rangeLabelKey('all_time')).toBe('leaderboard-range-all-time');
		expect(heroTitleLine1Key('school')).toBe('leaderboard-hero-school-line-1');
		expect(heroTitleLine2Key('school')).toBe('leaderboard-hero-school-line-2');
		expect(heroTitleLine1Key('class')).toBe('leaderboard-hero-class-line-1');
		expect(heroTitleLine2Key('class')).toBe('leaderboard-hero-class-line-2');
	});

	it('formats ordinals for English display', () => {
		expect(formatOrdinalEn(1)).toBe('1st');
		expect(formatOrdinalEn(2)).toBe('2nd');
		expect(formatOrdinalEn(3)).toBe('3rd');
		expect(formatOrdinalEn(4)).toBe('4th');
		expect(formatOrdinalEn(11)).toBe('11th');
		expect(formatOrdinalEn(21)).toBe('21st');
		expect(formatOrdinalEn(null)).toBe('—');
	});

	it('hides rank delta when null (all_time)', () => {
		expect(formatRankDelta(null).visible).toBe(false);
		expect(formatRankDelta(undefined).visible).toBe(false);
		expect(formatRankDelta(-2)).toEqual({ visible: true, direction: 'down', places: 2 });
		expect(formatRankDelta(3)).toEqual({ visible: true, direction: 'up', places: 3 });
		expect(formatRankDelta(0)).toEqual({ visible: true, direction: 'flat', places: 0 });
	});

	it('formats period XP for rows', () => {
		expect(formatSignedRangeXp(150)).toBe('+150 XP');
		expect(formatSignedRangeXp(0)).toBe('+0 XP');
	});

	it('detects empty lists without inventing data', () => {
		expect(isLeaderboardEmpty([])).toBe(true);
		expect(isLeaderboardEmpty([{ rank: 1 }])).toBe(false);
		expect(isLeaderboardEmpty(null)).toBe(true);
	});

	it('maps top-3 tiers for presentation only', () => {
		expect(rankingTierForRank(1)).toBe('gold');
		expect(rankingTierForRank(2)).toBe('silver');
		expect(rankingTierForRank(3)).toBe('bronze');
		expect(rankingTierForRank(4)).toBeNull();
	});
});
