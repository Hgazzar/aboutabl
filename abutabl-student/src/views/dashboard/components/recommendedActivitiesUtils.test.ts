import { describe, expect, it } from 'vitest';
import {
	birdAssetForVisual,
	formatEarnedXp,
	formatPotentialXp,
	formatRecentActivityDate,
	recentRowTheme,
	recommendedCtaPath,
	shouldShowPotentialXp,
} from './recommendedActivitiesUtils';
import type { DashboardRecommendedActivityItem } from 'lib/dashboardApi';

const continueItem: DashboardRecommendedActivityItem = {
	kind: 'continue_learning',
	available: true,
	subject_id: 10,
	subject_name: 'English',
	content_label: 'Letter Aa',
	reward_xp: 30,
	reward_xp_kind: 'potential',
	cta_path: '/learn/10/details/42',
	visual: 'bird_books',
	theme: 'cream',
};

const formatMessage = (descriptor: { id: string }, values?: Record<string, unknown>) => {
	if (descriptor.id === 'dashboard-recent-yesterday') return 'Yesterday';
	if (descriptor.id === 'dashboard-recent-on-date') return `In ${values?.date}`;
	return descriptor.id;
};

describe('recommendedActivitiesUtils', () => {
	it('uses cta_path for recommended cards', () => {
		expect(recommendedCtaPath(continueItem)).toBe('/learn/10/details/42');
	});

	it('falls back to todo for pending assignments', () => {
		expect(
			recommendedCtaPath({
				kind: 'pending_assignments',
				available: true,
				count: 2,
				cta_path: null,
				visual: 'bird_assignments',
				theme: 'mint',
			})
		).toBe('/todo');
	});

	it('shows potential XP only when flagged', () => {
		expect(shouldShowPotentialXp(continueItem)).toBe(true);
		expect(
			shouldShowPotentialXp({
				kind: 'game',
				available: true,
				cta_path: '/games',
				visual: 'bird_gaming',
				theme: 'lavender',
			})
		).toBe(false);
	});

	it('formats potential and earned XP labels', () => {
		expect(formatPotentialXp(30)).toBe('+30XP');
		expect(formatEarnedXp(30)).toBe('+30XP');
		expect(formatEarnedXp(null)).toBeNull();
	});

	it('formats recent dates as yesterday or absolute date', () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		expect(formatRecentActivityDate(yesterday.toISOString(), formatMessage)).toBe('Yesterday');
	});

	it('maps bird visuals to dashboard assets', () => {
		expect(birdAssetForVisual('bird_assignments')).toContain('recommended-bird-assignments.png');
		expect(birdAssetForVisual('bird_gaming')).toContain('recommended-bird-gaming.png');
	});

	it('maps recent row themes', () => {
		expect(recentRowTheme('lavender')).toBe('lavender');
		expect(recentRowTheme('cream')).toBe('cream');
	});
});
