import { getRequest } from 'lib/requests';
import { parseStudentApiPayload } from 'lib/studentApiResponse';

export type DashboardAssignmentItem = {
	assign_id: number;
	assign_student_id: number;
	title: string;
	type: string;
	type_id?: string | number | null;
	subject_id?: number | null;
	due_label?: string | null;
	due_at?: string | null;
	is_new?: boolean;
	/** Parent lifecycle status from list API (active | submitted | graded). */
	submission_status?: string | null;
	/** Authoritative Parent Submit gate — same SSOT as Assignment Detail. */
	can_submit?: boolean;
	/** Authoritative Assignment REDO gate — same SSOT as Assignment Detail. */
	redo_allowed?: boolean;
};

export type DashboardQuestItem = {
	id: number;
	quest_type: string;
	unit_label: string;
	subject_name: string;
	subject_id: number;
	unit_id: number;
	reward_label?: string | null;
	reward_type?: 'xp' | null;
	progress_current: number;
	progress_target: number;
	progress_percent?: number;
	status: string;
	cta_path?: string | null;
	completed_at?: string | null;
};

export type DashboardQuestsPayload = {
	available: boolean;
	items: DashboardQuestItem[];
	limit?: number;
};

export type DashboardRecommendedActivityKind =
	| 'pending_assignments'
	| 'continue_learning'
	| 'game';

export type DashboardRecommendedActivityItem = {
	kind: DashboardRecommendedActivityKind;
	available: boolean;
	count?: number;
	subject_id?: number;
	subject_name?: string;
	content_label?: string;
	reward_xp?: number | null;
	reward_xp_kind?: 'potential' | null;
	reward_xp_source?: 'lesson_content' | null;
	cta_path?: string | null;
	visual?: string;
	theme?: 'mint' | 'cream' | 'lavender';
};

export type DashboardRecommendedActivitiesPayload = {
	items: DashboardRecommendedActivityItem[];
};

export type DashboardRecentActivityItem = {
	kind: 'lesson_content';
	available: boolean;
	content_label: string;
	subject_name: string;
	subject_id?: number | null;
	content_id?: number;
	lesson_id?: number;
	occurred_at: string;
	xp_earned: number | null;
	visual?: string;
	theme?: string;
};

export type DashboardRecentActivitiesPayload = {
	items: DashboardRecentActivityItem[];
	has_more: boolean;
};

/** @deprecated Legacy dashboard recommended shape — Widget 6 uses DashboardRecommendedActivitiesPayload. */
export type DashboardRecommendedItem = {
	type: 'assignment' | 'subject';
	title: string;
	subject_id?: number | null;
	assign_id?: number;
	due_label?: string | null;
	progress_percent?: number;
	path?: string | null;
};

/** @deprecated Legacy dashboard recent shape — Widget 6 uses DashboardRecentActivitiesPayload. */
export type DashboardRecentItem = {
	type: string;
	title: string;
	status?: string;
	occurred_at: string;
	assign_id?: number;
	content_id?: number;
	lesson_id?: number;
	score_label?: string | null;
};

export type DashboardSearchResult = {
	kind: 'subject' | 'assignment' | 'lesson_content';
	id: number;
	title: string;
	path?: string | null;
	subject_id?: number | null;
	lesson_id?: number;
};

export type DashboardStreakDay = {
	label: string;
	date: string;
	completed: boolean;
	is_today: boolean;
};

export type DashboardRankingItem = {
	student_id: number;
	name: string;
	photo_url?: string | null;
	rank: number;
	score_percent: number;
	weekly_xp: number;
	is_current: boolean;
};

export type DashboardRankingsPayload = {
	available: boolean;
	class_rank?: number | null;
	score_percent?: number | null;
	performance_percent?: number | null;
	items: DashboardRankingItem[];
};

export type DashboardPayload = {
	student: {
		id: number;
		name: string;
		photo_url?: string | null;
		class_name?: string;
		grade_name?: string;
	};
	notifications: {
		unread_count: number;
	};
	assignments: {
		new_count: number;
		tabs: {
			todo: DashboardAssignmentItem[];
			past_due: DashboardAssignmentItem[];
			completed: DashboardAssignmentItem[];
		};
	};
	progress: {
		tier: string;
		next_tier?: string | null;
		progress_percent: number;
		stats: Record<string, number>;
		learning?: Record<string, unknown>;
	};
	xp: DashboardXpPayload;
	rankings: {
		available: boolean;
		class_rank?: number | null;
		score_percent?: number | null;
		performance_percent?: number | null;
		items: Array<{
			student_id: number;
			name: string;
			photo_url?: string | null;
			rank: number;
			score_percent: number;
			is_current: boolean;
		}>;
	};
	weekly_activity: {
		range: string;
		event_count: number;
		engagement_trend?: string | null;
		performance_delta: {
			current_avg: number | null;
			previous_avg: number | null;
			delta_percent: number | null;
			has_history: boolean;
		};
	};
	streak: {
		available: boolean;
		current_streak: number;
		longest_streak: number;
		active_days: number;
		weekly_activity: number;
		today_completed?: boolean;
		weekly_days?: DashboardStreakDay[];
		engagement_score?: number | null;
		engagement_trend?: string | null;
	};
	continue_learning: {
		available?: boolean;
		subject_id?: number;
		subject_name?: string | null;
		lesson_id?: number;
		lesson_title?: string | null;
		content_id?: number;
		title?: string;
		lesson_progress_percent?: number;
		path?: string | null;
	};
	recommended_activities: DashboardRecommendedActivitiesPayload;
	recent_activities: DashboardRecentActivitiesPayload;
	quests: DashboardQuestsPayload;
	range: string;
};

export type DashboardXpPayload = {
	total_xp: number;
	level: number;
	xp_in_level: number;
	xp_to_next_level: number | null;
	weekly_xp: number;
	previous_weekly_xp: number;
	next_level_threshold: number | null;
	level_badge_label: string;
	levels_away_from_achiever: number;
	achiever_level: number;
	xp_per_level: number;
	max_level: number;
	track: {
		start_level: number;
		end_level: number;
		start_xp: number;
		end_xp: number;
		fill_percent: number;
	};
};

export function normalizeDashboardXp(raw: Partial<DashboardXpPayload> | undefined): DashboardXpPayload {
	const step = raw?.xp_per_level ?? 300;
	const maxLevel = raw?.max_level ?? 12;
	const achieverLevel = raw?.achiever_level ?? 12;

	return {
		total_xp: raw?.total_xp ?? 0,
		level: raw?.level ?? 1,
		xp_in_level: raw?.xp_in_level ?? 0,
		xp_to_next_level: raw?.xp_to_next_level ?? step,
		weekly_xp: raw?.weekly_xp ?? 0,
		previous_weekly_xp: raw?.previous_weekly_xp ?? 0,
		next_level_threshold: raw?.next_level_threshold ?? step,
		level_badge_label: raw?.level_badge_label ?? 'explorer',
		levels_away_from_achiever: raw?.levels_away_from_achiever ?? achieverLevel - 1,
		achiever_level: achieverLevel,
		xp_per_level: step,
		max_level: maxLevel,
		track: {
			start_level: raw?.track?.start_level ?? 9,
			end_level: raw?.track?.end_level ?? achieverLevel,
			start_xp: raw?.track?.start_xp ?? 2100,
			end_xp: raw?.track?.end_xp ?? achieverLevel * step,
			fill_percent: raw?.track?.fill_percent ?? 0,
		},
	};
}

function normalizeRecommendedActivities(
	raw: Partial<DashboardPayload>['recommended_activities'] | DashboardRecommendedItem[] | undefined
): DashboardRecommendedActivitiesPayload {
	if (Array.isArray(raw)) {
		return { items: [] };
	}

	return {
		items: raw?.items ?? [],
	};
}

function normalizeRecentActivities(
	raw: Partial<DashboardPayload>['recent_activities'] | DashboardRecentItem[] | undefined
): DashboardRecentActivitiesPayload {
	if (Array.isArray(raw)) {
		return { items: [], has_more: false };
	}

	return {
		items: raw?.items ?? [],
		has_more: raw?.has_more ?? false,
	};
}

function normalizeRankingItems(
	raw: Partial<DashboardRankingItem>[] | undefined
): DashboardRankingItem[] {
	return (raw ?? []).map((item) => ({
		student_id: item.student_id ?? 0,
		name: item.name ?? '',
		photo_url: item.photo_url ?? null,
		rank: item.rank ?? 0,
		score_percent: item.score_percent ?? 0,
		weekly_xp: item.weekly_xp ?? 0,
		is_current: item.is_current ?? false,
	}));
}

function normalizeDashboardPayload(raw: Partial<DashboardPayload>): DashboardPayload {
	const emptyTabs = { todo: [], past_due: [], completed: [] };

	return {
		student: {
			id: raw.student?.id ?? 0,
			name: raw.student?.name ?? '',
			photo_url: raw.student?.photo_url ?? null,
			class_name: raw.student?.class_name ?? '',
			grade_name: raw.student?.grade_name ?? '',
		},
		notifications: {
			unread_count: raw.notifications?.unread_count ?? 0,
		},
		assignments: {
			new_count: raw.assignments?.new_count ?? 0,
			tabs: {
				todo: raw.assignments?.tabs?.todo ?? emptyTabs.todo,
				past_due: raw.assignments?.tabs?.past_due ?? emptyTabs.past_due,
				completed: raw.assignments?.tabs?.completed ?? emptyTabs.completed,
			},
		},
		progress: {
			tier: raw.progress?.tier ?? '',
			next_tier: raw.progress?.next_tier ?? null,
			progress_percent: raw.progress?.progress_percent ?? 0,
			stats: raw.progress?.stats ?? {},
			learning: raw.progress?.learning,
		},
		xp: normalizeDashboardXp(raw.xp),
		rankings: {
			available: raw.rankings?.available ?? false,
			class_rank: raw.rankings?.class_rank ?? null,
			score_percent: raw.rankings?.score_percent ?? null,
			performance_percent: raw.rankings?.performance_percent ?? null,
			items: normalizeRankingItems(raw.rankings?.items),
		},
		weekly_activity: {
			range: raw.weekly_activity?.range ?? 'week',
			event_count: raw.weekly_activity?.event_count ?? 0,
			engagement_trend: raw.weekly_activity?.engagement_trend ?? null,
			performance_delta: raw.weekly_activity?.performance_delta ?? {
				current_avg: null,
				previous_avg: null,
				delta_percent: null,
				has_history: false,
			},
		},
		streak: {
			available: raw.streak?.available ?? false,
			current_streak: raw.streak?.current_streak ?? 0,
			longest_streak: raw.streak?.longest_streak ?? 0,
			active_days: raw.streak?.active_days ?? 0,
			weekly_activity: raw.streak?.weekly_activity ?? 0,
			today_completed: raw.streak?.today_completed ?? false,
			weekly_days: raw.streak?.weekly_days ?? [],
			engagement_score: raw.streak?.engagement_score ?? null,
			engagement_trend: raw.streak?.engagement_trend ?? null,
		},
		continue_learning: raw.continue_learning ?? {},
		recommended_activities: normalizeRecommendedActivities(raw.recommended_activities),
		recent_activities: normalizeRecentActivities(raw.recent_activities),
		quests: {
			available: raw.quests?.available ?? false,
			items: raw.quests?.items ?? [],
			limit: raw.quests?.limit ?? 1,
		},
		range: raw.range ?? 'week',
	};
}

export async function fetchStudentDashboard(
	range = 'week',
	options?: { signal?: AbortSignal }
): Promise<DashboardPayload> {
	const res = await getRequest('dashboard', { range }, undefined, options?.signal);
	const payload = parseStudentApiPayload<Partial<DashboardPayload>>(
		res,
		'dashboard',
		'Invalid dashboard response'
	);

	if (!payload.student) {
		throw new Error('Invalid dashboard response');
	}

	return normalizeDashboardPayload(payload);
}

export async function searchStudentContent(query: string, limit = 20): Promise<DashboardSearchResult[]> {
	const term = query.trim();
	if (term.length < 2) return [];
	const res = await getRequest('search', { q: term, limit });
	try {
		const results = parseStudentApiPayload<unknown>(res, 'results', 'Invalid search response');
		return Array.isArray(results) ? (results as DashboardSearchResult[]) : [];
	} catch {
		return [];
	}
}
