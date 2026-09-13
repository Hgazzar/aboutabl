import { figmaProfileAssetUrl } from 'config/figmaAssets';
import type { DashboardPayload, DashboardXpPayload } from 'lib/dashboardApi';
import {
	applyEqualTrackMarkerSpacing,
	applyTrackLevelStates,
	stripBakedBarFillFromSvg,
	TRACK_MARKER_LEVELS,
} from 'views/dashboard/components/myProgressBarUtils';
import type { ProfileAchievement } from './types';

export type ProfileIdentity = {
	name: string;
	code: string;
	photo: string | null;
};

export function parseProfileIdentity(raw: Record<string, unknown> | null | undefined): ProfileIdentity {
	if (!raw) {
		return { name: '', code: '', photo: null };
	}

	const name = String(raw.name ?? '').trim();
	const code = String(raw.code ?? raw.memberShip ?? raw.username ?? '').trim();
	const photoRaw = raw.photo ?? raw.photo_url;
	const photo = typeof photoRaw === 'string' && photoRaw.trim() ? photoRaw.trim() : null;

	return { name, code, photo };
}

export function formatProfileXpRatio(xp: Pick<DashboardXpPayload, 'total_xp' | 'next_level_threshold'>): string {
	if (xp.next_level_threshold != null) {
		return `${xp.total_xp} / ${xp.next_level_threshold} XP`;
	}

	return `${xp.total_xp} XP`;
}

export function isProfileAchieverUnlocked(
	xp: Pick<DashboardXpPayload, 'level' | 'achiever_level'>
): boolean {
	return xp.level >= xp.achiever_level;
}

export function formatClassRankLabel(rank: number | null | undefined): string | null {
	if (rank == null || !Number.isFinite(rank)) {
		return null;
	}

	return `#${rank}`;
}

export function profileStreakDays(
	streak: Pick<DashboardPayload['streak'], 'current_streak'> | undefined
): number {
	return Math.max(0, streak?.current_streak ?? 0);
}

export function buildProfileLevelTrackSvg(svgRaw: string, currentLevel: number): string {
	return applyEqualTrackMarkerSpacing(
		applyTrackLevelStates(stripBakedBarFillFromSvg(svgRaw), currentLevel)
	);
}

export function profileTrackMarkerLevels(): readonly number[] {
	return TRACK_MARKER_LEVELS;
}

const ACHIEVEMENT_ICON_FILE_BY_KEY: Record<string, string> = {
	'achievement-3-stars': 'achievement-badge-stars.png',
	'achievement-builder': 'achievement-badge-builder.png',
};

const DEFAULT_ACHIEVEMENT_ICON_FILE = 'progress-icon.png';

function clampAchievementProgress(value: unknown): number {
	const n = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(n)) {
		return 0;
	}

	return Math.max(0, Math.min(100, Math.round(n)));
}

export function parseProfileAchievement(raw: unknown): ProfileAchievement | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}

	const row = raw as Record<string, unknown>;
	const key = String(row.key ?? '').trim();
	if (!key) {
		return null;
	}

	const earnedAtRaw = row.earned_at;
	const earnedAt =
		typeof earnedAtRaw === 'string' && earnedAtRaw.trim() ? earnedAtRaw.trim() : null;

	return {
		key,
		title: String(row.title ?? '').trim(),
		description: String(row.description ?? '').trim(),
		icon: String(row.icon ?? '').trim(),
		progress: clampAchievementProgress(row.progress),
		earned: row.earned === true,
		earned_at: earnedAt,
	};
}

export function parseProfileAchievements(raw: unknown): ProfileAchievement[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	return raw
		.map((item) => parseProfileAchievement(item))
		.filter((item): item is ProfileAchievement => item != null);
}

/** Maps API icon keys to local Figma assets — visual only, not achievement logic. */
export function resolveAchievementIconUrl(iconKey: string): string {
	const normalized = iconKey.trim();
	const fileName =
		(normalized && ACHIEVEMENT_ICON_FILE_BY_KEY[normalized]) || DEFAULT_ACHIEVEMENT_ICON_FILE;

	return figmaProfileAssetUrl(fileName);
}

/** Design-file mock numbers — must never appear as fallback student data. */
export const FIGMA_PROFILE_MOCK = {
	xpCurrent: 2450,
	xpTarget: 3000,
	level: 11,
	rank: 4,
	streak: 344,
	levelsAway: 2,
} as const;
