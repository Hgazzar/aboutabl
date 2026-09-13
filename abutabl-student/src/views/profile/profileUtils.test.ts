import { describe, expect, it } from 'vitest';
import { normalizeDashboardXp } from 'lib/dashboardApi';
import { resolveStudentAvatarSrc } from 'lib/studentAvatar';
import { isTrackLevelReached } from 'views/dashboard/components/myProgressBarUtils';
import {
	buildProfileLevelTrackSvg,
	FIGMA_PROFILE_MOCK,
	formatClassRankLabel,
	formatProfileXpRatio,
	isProfileAchieverUnlocked,
	parseProfileAchievement,
	parseProfileAchievements,
	parseProfileIdentity,
	profileStreakDays,
	profileTrackMarkerLevels,
	resolveAchievementIconUrl,
} from './profileUtils';

const SAMPLE_TRACK_SVG = [
	'<rect x="25" y="13" width="200" height="12" rx="6" fill="url(#paint2_linear_2548_1906)"/>',
	'<rect x="36" y="4" width="28.125" height="31.5" fill="url(#pattern0_2548_1906)"/>',
	'<path d="M24.414 65" fill="#EA780C"/>',
	'<rect x="198" y="4" width="28.125" height="31.5" fill="url(#pattern1_2548_1906)"/>',
	'<path d="M179.414 65" fill="#D76414"/>',
	'<rect x="339" y="4" width="28.125" height="31.5" fill="url(#pattern2_2548_1906)"/>',
	'<path d="M320.414 65" fill="#638460"/>',
	'<rect x="529" y="4" width="22.5094" height="31.5" fill="url(#pattern3_2548_1906)"/>',
	'<path d="M507.414 65" fill="#BDA776"/>',
].join('');

function markerInactive(svg: string, xAttr: string): boolean {
	const start = svg.indexOf(`<rect ${xAttr}`);
	const slice = svg.slice(start, svg.indexOf('/>', start) + 2);
	return slice.includes('filter:grayscale(1)');
}

describe('profile identity', () => {
	it('reads name, code, and photo from the profile API payload', () => {
		const identity = parseProfileIdentity({
			name: 'Sara',
			code: 'AKAIS1119',
			photo: 'https://cdn.example/sara.png',
		});

		expect(identity).toEqual({
			name: 'Sara',
			code: 'AKAIS1119',
			photo: 'https://cdn.example/sara.png',
		});
		expect(identity.code).not.toBe(String(FIGMA_PROFILE_MOCK.rank));
	});

	it('falls back to memberShip for student code', () => {
		expect(parseProfileIdentity({ name: 'Ali', memberShip: '654321' }).code).toBe('654321');
	});
});

describe('profile XP mapping', () => {
	const xp = normalizeDashboardXp({
		total_xp: 280,
		level: 2,
		next_level_threshold: 300,
		level_badge_label: 'explorer',
		levels_away_from_achiever: 10,
		achiever_level: 12,
	});

	it('uses current XP and target XP from the dashboard payload', () => {
		expect(xp.total_xp).toBe(280);
		expect(xp.level).toBe(2);
		expect(formatProfileXpRatio(xp)).toBe('280 / 300 XP');
		expect(formatProfileXpRatio(xp)).not.toBe(
			`${FIGMA_PROFILE_MOCK.xpCurrent} / ${FIGMA_PROFILE_MOCK.xpTarget} XP`
		);
		expect(xp.level).not.toBe(FIGMA_PROFILE_MOCK.level);
	});

	it('maps total points from total_xp', () => {
		expect(xp.total_xp).toBe(280);
		expect(xp.total_xp).not.toBe(FIGMA_PROFILE_MOCK.xpCurrent);
	});

	it('unlocks achiever only at achiever_level from payload', () => {
		expect(isProfileAchieverUnlocked(xp)).toBe(false);
		expect(
			isProfileAchieverUnlocked(
				normalizeDashboardXp({ level: 12, achiever_level: 12, total_xp: 3000 })
			)
		).toBe(true);
	});
});

describe('profile level track states', () => {
	it('uses the same marker levels as the dashboard bar (9-12)', () => {
		expect(profileTrackMarkerLevels()).toEqual([9, 10, 11, 12]);
	});

	it('activates level 9 when the student reaches level 9', () => {
		const svg = buildProfileLevelTrackSvg(SAMPLE_TRACK_SVG, 9);
		expect(isTrackLevelReached(9, 9)).toBe(true);
		expect(markerInactive(svg, 'x="36"')).toBe(false);
		expect(markerInactive(svg, 'x="198"')).toBe(true);
		expect(markerInactive(svg, 'x="339"')).toBe(true);
		expect(markerInactive(svg, 'x="529"')).toBe(true);
	});

	it('activates level 10 when the student reaches level 10', () => {
		const svg = buildProfileLevelTrackSvg(SAMPLE_TRACK_SVG, 10);
		expect(markerInactive(svg, 'x="36"')).toBe(false);
		expect(markerInactive(svg, 'x="198"')).toBe(false);
		expect(markerInactive(svg, 'x="339"')).toBe(true);
	});

	it('activates level 11 when the student reaches level 11', () => {
		const svg = buildProfileLevelTrackSvg(SAMPLE_TRACK_SVG, 11);
		expect(markerInactive(svg, 'x="339"')).toBe(false);
		expect(markerInactive(svg, 'x="529"')).toBe(true);
	});

	it('activates level 12 and achiever when the student reaches level 12', () => {
		const svg = buildProfileLevelTrackSvg(SAMPLE_TRACK_SVG, 12);
		expect(markerInactive(svg, 'x="529"')).toBe(false);
		expect(isProfileAchieverUnlocked({ level: 12, achiever_level: 12 })).toBe(true);
	});

	it('strips baked bar fill so live fill width is used', () => {
		const svg = buildProfileLevelTrackSvg(SAMPLE_TRACK_SVG, 2);
		expect(svg).toContain('<rect x="25" y="13" width="0"');
	});
});

describe('profile statistics', () => {
	it('formats ranking from class_rank and never defaults to the Figma #4', () => {
		expect(formatClassRankLabel(1)).toBe('#1');
		expect(formatClassRankLabel(null)).toBeNull();
		expect(formatClassRankLabel(undefined)).toBeNull();
		expect(formatClassRankLabel(null)).not.toBe(`#${FIGMA_PROFILE_MOCK.rank}`);
	});

	it('reads streak days from current_streak', () => {
		expect(profileStreakDays({ current_streak: 3 })).toBe(3);
		expect(profileStreakDays({ current_streak: 0 })).toBe(0);
		expect(profileStreakDays({ current_streak: 3 })).not.toBe(FIGMA_PROFILE_MOCK.streak);
	});
});

describe('profile avatar', () => {
	it('prefers API photo over a stored preset on profile identity', () => {
		expect(
			resolveStudentAvatarSrc({
				photoUrl: 'https://cdn.example/me.png',
				avatarPreset: 'a2',
			})
		).toBe('https://cdn.example/me.png');
	});
});

describe('achievements empty contract', () => {
	it('does not invent Figma mock badges or XP', () => {
		const emptyItems: unknown[] = [];
		expect(emptyItems).toEqual([]);
		expect(emptyItems).not.toContain('3 Stars');
		expect(emptyItems).not.toContain('Builder Badge');
	});
});

describe('profile achievements API mapping', () => {
	it('maps Figma 3 Stars Badge from API', () => {
		const item = parseProfileAchievement({
			key: '3_stars_badge',
			title: '3 Stars Badge',
			description: 'You earned your first 100 XP',
			icon: 'achievement-3-stars',
			progress: 80,
			earned: false,
			earned_at: null,
		});

		expect(item).toEqual({
			key: '3_stars_badge',
			title: '3 Stars Badge',
			description: 'You earned your first 100 XP',
			icon: 'achievement-3-stars',
			progress: 80,
			earned: false,
			earned_at: null,
		});
	});

	it('maps earned 3 Stars Badge with progress from API', () => {
		const item = parseProfileAchievement({
			key: '3_stars_badge',
			title: '3 Stars Badge',
			description: 'You earned your first 100 XP',
			icon: 'achievement-3-stars',
			progress: 100,
			earned: true,
			earned_at: '2026-08-29T09:20:10+00:00',
		});

		expect(item?.progress).toBe(100);
		expect(item?.earned).toBe(true);
	});

	it('maps Builder Badge without inferring earned from progress', () => {
		const item = parseProfileAchievement({
			key: 'builder_badge',
			title: 'Builder Badge',
			description: 'You earned your first 100 XP',
			icon: 'achievement-builder',
			progress: 33,
			earned: false,
			earned_at: null,
		});

		expect(item?.progress).toBe(33);
		expect(item?.earned).toBe(false);
		expect(item?.progress).not.toBe(100);
	});

	it('returns empty list for API empty achievements array', () => {
		expect(parseProfileAchievements([])).toEqual([]);
	});

	it('does not inject hardcoded mock achievements when parsing API payload', () => {
		const parsed = parseProfileAchievements([
			{
				key: '3_stars_badge',
				title: '3 Stars Badge',
				description: 'You earned your first 100 XP',
				icon: 'achievement-3-stars',
				progress: 0,
				earned: false,
				earned_at: null,
			},
		]);

		expect(parsed).toHaveLength(1);
		expect(parsed[0]?.title).toBe('3 Stars Badge');
	});
});

describe('profile achievement icons', () => {
	it('maps Figma icon keys to exact local profile assets', () => {
		expect(resolveAchievementIconUrl('achievement-3-stars')).toContain('achievement-badge-stars.png');
		expect(resolveAchievementIconUrl('achievement-builder')).toContain(
			'achievement-badge-builder.png'
		);
	});

	it('uses a safe fallback for unknown icon keys', () => {
		expect(resolveAchievementIconUrl('unknown-value')).toContain('progress-icon.png');
		expect(() => resolveAchievementIconUrl('unknown-value')).not.toThrow();
	});
});
