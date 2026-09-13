import { getRequest } from 'lib/requests';
import { parseStudentApiPayload } from 'lib/studentApiResponse';
import { parseProfileAchievements } from 'views/profile/profileUtils';
import type { ProfileAchievement } from 'views/profile/types';

export type MyProgressHero = {
	name: string;
	level: number;
	level_badge_label: string;
	total_xp: number;
	next_level_threshold: number | null;
	xp_to_next: number | null;
	track: {
		start_level: number;
		current_level: number;
		achiever_level: number;
		fill_percent: number;
	};
	levels_away_from_achiever: number;
	weekly_xp: number;
	previous_weekly_xp: number;
};

export type MyProgressStatistics = {
	total_xp: number;
	current_rank: number | null;
	rank_scope: string;
	rank_range: string;
	current_streak: number;
};

export type MyProgressNextGoal = {
	available: boolean;
	title: string | null;
	lesson_title: string | null;
	reward_xp: number | null;
	reward_xp_kind: 'potential' | null;
	cta_path: string | null;
};

export type MyProgressBook = {
	subject_id: number;
	title: string;
	description: string | null;
	photo: string | null;
	stars: { decorative: boolean };
	units_completed: number;
	units_total: number;
	progress_percent: number | null;
	xp_this_week: number;
	accuracy_percent: number | null;
	activities_completed: number | null;
	activities_available: boolean;
	next_goal: MyProgressNextGoal;
};

export type MyProgressStreakDay = {
	label: string;
	date: string;
	completed: boolean;
	is_today: boolean;
};

export type MyProgressStreak = {
	available: boolean;
	current_streak: number;
	longest_streak: number;
	today_completed: boolean;
	weekly_days: MyProgressStreakDay[];
};

export type MyProgressXpRankingItem = {
	rank: number;
	student_id: number;
	name: string;
	photo_url: string | null;
	xp: number;
	is_current: boolean;
};

export type MyProgressXpRanking = {
	available: boolean;
	scope: 'school' | 'class';
	range: 'week' | 'month' | 'all_time';
	items: MyProgressXpRankingItem[];
};

export type MyProgressPayload = {
	hero: MyProgressHero;
	statistics: MyProgressStatistics;
	books: MyProgressBook[];
	achievements: ProfileAchievement[];
	streak: MyProgressStreak;
	xp_ranking: MyProgressXpRanking;
};

function asNullableNumber(raw: unknown): number | null {
	if (raw === null || raw === undefined || raw === '') {
		return null;
	}
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

function normalizeNextGoal(raw: Partial<MyProgressNextGoal> | undefined): MyProgressNextGoal {
	const available = raw?.available === true;
	const rewardXp = asNullableNumber(raw?.reward_xp);
	const lessonTitle =
		available && typeof raw?.lesson_title === 'string' && raw.lesson_title.trim()
			? raw.lesson_title.trim()
			: null;

	return {
		available,
		title: available && typeof raw?.title === 'string' ? raw.title : null,
		lesson_title: lessonTitle,
		reward_xp: available ? rewardXp : null,
		reward_xp_kind: available && raw?.reward_xp_kind === 'potential' ? 'potential' : null,
		cta_path:
			available && typeof raw?.cta_path === 'string' && raw.cta_path.trim()
				? raw.cta_path.trim()
				: null,
	};
}

function normalizeBook(raw: Partial<MyProgressBook> | undefined): MyProgressBook | null {
	const subjectId = Number(raw?.subject_id);
	if (!Number.isFinite(subjectId) || subjectId <= 0) {
		return null;
	}

	const accuracy = asNullableNumber(raw?.accuracy_percent);
	const activitiesAvailable = raw?.activities_available === true;
	const activitiesCompleted = activitiesAvailable
		? asNullableNumber(raw?.activities_completed)
		: null;

	const photoRaw = raw?.photo;
	const photo =
		typeof photoRaw === 'string' && photoRaw.trim() ? photoRaw.trim() : null;

	const descriptionRaw = raw?.description;
	const description =
		typeof descriptionRaw === 'string' && descriptionRaw.trim()
			? descriptionRaw.trim()
			: null;

	const progressRaw = asNullableNumber(raw?.progress_percent);

	return {
		subject_id: subjectId,
		title: typeof raw?.title === 'string' ? raw.title : '',
		description,
		photo,
		stars: { decorative: raw?.stars?.decorative !== false },
		units_completed: Math.max(0, Number(raw?.units_completed) || 0),
		units_total: Math.max(0, Number(raw?.units_total) || 0),
		progress_percent: progressRaw,
		xp_this_week: Math.max(0, Number(raw?.xp_this_week) || 0),
		accuracy_percent: accuracy,
		activities_completed: activitiesCompleted,
		activities_available: activitiesAvailable && activitiesCompleted != null,
		next_goal: normalizeNextGoal(raw?.next_goal),
	};
}

function normalizeStreakDay(raw: Partial<MyProgressStreakDay> | undefined): MyProgressStreakDay {
	return {
		label: typeof raw?.label === 'string' ? raw.label : '',
		date: typeof raw?.date === 'string' ? raw.date : '',
		completed: raw?.completed === true,
		is_today: raw?.is_today === true,
	};
}

export function normalizeMyProgressStreak(
	raw: Partial<MyProgressStreak> | undefined
): MyProgressStreak {
	const weekly = Array.isArray(raw?.weekly_days)
		? raw!.weekly_days.map((day) => normalizeStreakDay(day))
		: [];

	return {
		available: raw?.available === true,
		current_streak: Math.max(0, Number(raw?.current_streak) || 0),
		longest_streak: Math.max(0, Number(raw?.longest_streak) || 0),
		today_completed: raw?.today_completed === true,
		weekly_days: weekly,
	};
}

export function normalizeMyProgressXpRanking(
	raw: Partial<MyProgressXpRanking> | undefined
): MyProgressXpRanking {
	const items = Array.isArray(raw?.items)
		? raw!.items.map((row) => ({
				rank: Number(row?.rank) || 0,
				student_id: Number(row?.student_id) || 0,
				name: typeof row?.name === 'string' ? row.name : '',
				photo_url:
					typeof row?.photo_url === 'string' && row.photo_url.trim()
						? row.photo_url.trim()
						: null,
				xp: Math.max(0, Number(row?.xp) || 0),
				is_current: row?.is_current === true,
		  }))
		: [];

	const scope = raw?.scope === 'class' ? 'class' : 'school';
	const range =
		raw?.range === 'week' || raw?.range === 'month' || raw?.range === 'all_time'
			? raw.range
			: 'all_time';

	return {
		available: raw?.available === true && items.length > 0,
		scope,
		range,
		items,
	};
}

export function normalizeMyProgressPayload(
	raw: Partial<MyProgressPayload> | undefined
): MyProgressPayload {
	const heroRaw = raw?.hero;
	const trackRaw = heroRaw?.track;
	const achieverLevel = Math.max(1, Number(trackRaw?.achiever_level) || 12);
	const level = Math.max(1, Number(heroRaw?.level) || 1);

	const books = Array.isArray(raw?.books)
		? raw!.books
				.map((book) => normalizeBook(book))
				.filter((book): book is MyProgressBook => book != null)
		: [];

	return {
		hero: {
			name: typeof heroRaw?.name === 'string' ? heroRaw.name : '',
			level,
			level_badge_label:
				typeof heroRaw?.level_badge_label === 'string' ? heroRaw.level_badge_label : '',
			total_xp: Math.max(0, Number(heroRaw?.total_xp) || 0),
			next_level_threshold: asNullableNumber(heroRaw?.next_level_threshold),
			xp_to_next: asNullableNumber(heroRaw?.xp_to_next),
			track: {
				start_level: Math.max(1, Number(trackRaw?.start_level) || 9),
				current_level: Math.max(1, Number(trackRaw?.current_level) || level),
				achiever_level: achieverLevel,
				fill_percent: Math.max(0, Math.min(100, Number(trackRaw?.fill_percent) || 0)),
			},
			levels_away_from_achiever: Math.max(0, Number(heroRaw?.levels_away_from_achiever) || 0),
			weekly_xp: Math.max(0, Number(heroRaw?.weekly_xp) || 0),
			previous_weekly_xp: Math.max(0, Number(heroRaw?.previous_weekly_xp) || 0),
		},
		statistics: {
			total_xp: Math.max(0, Number(raw?.statistics?.total_xp) || 0),
			current_rank: asNullableNumber(raw?.statistics?.current_rank),
			rank_scope:
				typeof raw?.statistics?.rank_scope === 'string' ? raw.statistics.rank_scope : 'school',
			rank_range:
				typeof raw?.statistics?.rank_range === 'string'
					? raw.statistics.rank_range
					: 'all_time',
			current_streak: Math.max(0, Number(raw?.statistics?.current_streak) || 0),
		},
		books,
		achievements: parseProfileAchievements(raw?.achievements),
		streak: normalizeMyProgressStreak(raw?.streak),
		xp_ranking: normalizeMyProgressXpRanking(raw?.xp_ranking),
	};
}

export async function fetchStudentMyProgress(signal?: AbortSignal): Promise<MyProgressPayload> {
	const response = await getRequest('my-progress', undefined, undefined, signal);
	const payload = parseStudentApiPayload<Partial<MyProgressPayload>>(
		response,
		'my_progress',
		'Invalid my-progress response'
	);

	return normalizeMyProgressPayload(payload);
}
