import type { LeaderboardRange, LeaderboardScope } from 'lib/leaderboardApi';

export type LeaderboardScopeOption = LeaderboardScope;
export type LeaderboardRangeOption = LeaderboardRange;

export const LEADERBOARD_SCOPES: LeaderboardScopeOption[] = ['school', 'class'];
export const LEADERBOARD_RANGES: LeaderboardRangeOption[] = ['week', 'month', 'all_time'];

export function parseLeaderboardScope(value: string | null | undefined): LeaderboardScope {
	return value === 'class' ? 'class' : 'school';
}

export function parseLeaderboardRange(value: string | null | undefined): LeaderboardRange {
	if (value === 'month' || value === 'all_time') {
		return value;
	}
	return 'week';
}

export function readLeaderboardFiltersFromSearchParams(searchParams: URLSearchParams): {
	scope: LeaderboardScope;
	range: LeaderboardRange;
} {
	return {
		scope: parseLeaderboardScope(searchParams.get('scope')),
		range: parseLeaderboardRange(searchParams.get('range')),
	};
}

export function applyLeaderboardFiltersToSearchParams(
	searchParams: URLSearchParams,
	scope: LeaderboardScope,
	range: LeaderboardRange
): URLSearchParams {
	const next = new URLSearchParams(searchParams);

	if (scope === 'school') {
		next.delete('scope');
	} else {
		next.set('scope', scope);
	}

	if (range === 'week') {
		next.delete('range');
	} else {
		next.set('range', range);
	}

	return next;
}

/** i18n message ids for scope tab labels */
export function scopeLabelKey(scope: LeaderboardScope): string {
	return scope === 'class' ? 'leaderboard-scope-class' : 'leaderboard-scope-school';
}

/** i18n message ids for range pill labels */
export function rangeLabelKey(range: LeaderboardRange): string {
	if (range === 'month') return 'leaderboard-range-month';
	if (range === 'all_time') return 'leaderboard-range-all-time';
	return 'leaderboard-range-week';
}

export function summaryScopeTitleKey(scope: LeaderboardScope): string {
	return scope === 'class' ? 'leaderboard-summary-class' : 'leaderboard-summary-school';
}

export function heroTitleLine1Key(scope: LeaderboardScope): string {
	return scope === 'class' ? 'leaderboard-hero-class-line-1' : 'leaderboard-hero-school-line-1';
}

export function heroTitleLine2Key(scope: LeaderboardScope): string {
	return scope === 'class' ? 'leaderboard-hero-class-line-2' : 'leaderboard-hero-school-line-2';
}

export function boardTitleKey(scope: LeaderboardScope): string {
	return scope === 'class' ? 'leaderboard-title-class' : 'leaderboard-title-school';
}

export function isLeaderboardEmpty(items: unknown): boolean {
	return !Array.isArray(items) || items.length === 0;
}

/**
 * Ordinal suffix for English display (1st, 2nd, 3rd, 4th…).
 * AR screens should pass through the numeric rank via i18n separately.
 */
export function formatOrdinalEn(rank: number | null | undefined): string {
	if (rank == null || !Number.isFinite(rank) || rank <= 0) {
		return '—';
	}

	const n = Math.floor(rank);
	const mod100 = n % 100;
	if (mod100 >= 11 && mod100 <= 13) {
		return `${n}th`;
	}

	switch (n % 10) {
		case 1:
			return `${n}st`;
		case 2:
			return `${n}nd`;
		case 3:
			return `${n}rd`;
		default:
			return `${n}th`;
	}
}

export type RankDeltaDisplay = {
	visible: boolean;
	direction: 'up' | 'down' | 'flat' | null;
	places: number;
};

/**
 * Presentation-only. Does not invent deltas.
 * null / undefined → hidden (e.g. all_time).
 */
export function formatRankDelta(delta: number | null | undefined): RankDeltaDisplay {
	if (delta === null || delta === undefined || !Number.isFinite(delta)) {
		return { visible: false, direction: null, places: 0 };
	}

	const places = Math.abs(Math.trunc(delta));
	if (places === 0) {
		return { visible: true, direction: 'flat', places: 0 };
	}

	return {
		visible: true,
		direction: delta > 0 ? 'up' : 'down',
		places,
	};
}

export function formatSignedRangeXp(xp: number | null | undefined): string {
	const value = Math.max(0, Math.floor(Number(xp) || 0));
	return `+${value} XP`;
}

export function formatSignedPoints(xp: number | null | undefined): string {
	const value = Math.max(0, Math.floor(Number(xp) || 0));
	return `+${value}`;
}

export function rankingTierForRank(rank: number): 'gold' | 'silver' | 'bronze' | null {
	if (rank === 1) return 'gold';
	if (rank === 2) return 'silver';
	if (rank === 3) return 'bronze';
	return null;
}
