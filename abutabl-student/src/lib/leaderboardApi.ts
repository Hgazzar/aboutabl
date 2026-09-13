import { getRequest } from 'lib/requests';
import { parseStudentApiPayload } from 'lib/studentApiResponse';

export type LeaderboardScope = 'school' | 'class';
export type LeaderboardRange = 'week' | 'month' | 'all_time';

export type LeaderboardItem = {
	rank: number;
	student_id: number;
	name: string;
	photo_url: string | null;
	xp: number;
	is_current: boolean;
};

export type LeaderboardCurrentUserSummary = {
	student_id: number;
	name: string;
	photo_url: string | null;
	rank: number | null;
	rank_delta: number | null;
	total_xp: number;
	range_xp: number;
	level: number;
	current_streak: number;
};

export type LeaderboardPayload = {
	current_user_summary: LeaderboardCurrentUserSummary;
	tabs: {
		active_scope: LeaderboardScope;
		active_range: LeaderboardRange;
	};
	items: LeaderboardItem[];
};

export type FetchLeaderboardParams = {
	scope?: LeaderboardScope;
	range?: LeaderboardRange;
	signal?: AbortSignal;
};

function normalizeScope(raw: unknown): LeaderboardScope {
	return raw === 'class' ? 'class' : 'school';
}

function normalizeRange(raw: unknown): LeaderboardRange {
	if (raw === 'month' || raw === 'all_time') {
		return raw;
	}
	return 'week';
}

function normalizeItem(raw: Partial<LeaderboardItem> | undefined): LeaderboardItem {
	return {
		rank: Number(raw?.rank) || 0,
		student_id: Number(raw?.student_id) || 0,
		name: typeof raw?.name === 'string' ? raw.name : '',
		photo_url:
			typeof raw?.photo_url === 'string' && raw.photo_url.trim() ? raw.photo_url : null,
		xp: Math.max(0, Number(raw?.xp) || 0),
		is_current: raw?.is_current === true,
	};
}

function normalizeSummary(
	raw: Partial<LeaderboardCurrentUserSummary> | undefined
): LeaderboardCurrentUserSummary {
	const rankRaw = raw?.rank;
	const deltaRaw = raw?.rank_delta;

	return {
		student_id: Number(raw?.student_id) || 0,
		name: typeof raw?.name === 'string' ? raw.name : '',
		photo_url:
			typeof raw?.photo_url === 'string' && raw.photo_url.trim() ? raw.photo_url : null,
		rank: rankRaw === null || rankRaw === undefined ? null : Number(rankRaw) || null,
		rank_delta:
			deltaRaw === null || deltaRaw === undefined ? null : Number(deltaRaw),
		total_xp: Math.max(0, Number(raw?.total_xp) || 0),
		range_xp: Math.max(0, Number(raw?.range_xp) || 0),
		level: Math.max(1, Number(raw?.level) || 1),
		current_streak: Math.max(0, Number(raw?.current_streak) || 0),
	};
}

export function normalizeLeaderboardPayload(
	raw: Partial<LeaderboardPayload> | undefined
): LeaderboardPayload {
	const scope = normalizeScope(raw?.tabs?.active_scope);
	const range = normalizeRange(raw?.tabs?.active_range);
	const items = Array.isArray(raw?.items) ? raw!.items.map(normalizeItem) : [];

	return {
		current_user_summary: normalizeSummary(raw?.current_user_summary),
		tabs: {
			active_scope: scope,
			active_range: range,
		},
		// Preserve API order exactly — do not sort.
		items,
	};
}

export async function fetchStudentLeaderboard(
	params: FetchLeaderboardParams = {}
): Promise<LeaderboardPayload> {
	const scope = params.scope ?? 'school';
	const range = params.range ?? 'week';

	const response = await getRequest(
		'leaderboard',
		{ scope, range },
		undefined,
		params.signal
	);

	const payload = parseStudentApiPayload<Partial<LeaderboardPayload>>(
		response,
		'leaderboard',
		'Invalid leaderboard response'
	);

	return normalizeLeaderboardPayload(payload);
}
