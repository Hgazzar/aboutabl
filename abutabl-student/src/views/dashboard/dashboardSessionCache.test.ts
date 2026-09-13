import Cookies from 'js-cookie';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('jwt-decode', () => ({
	jwtDecode: vi.fn((token: string) => {
		const match = /^token-for-(.+)$/.exec(token);
		return match ? { sub: match[1] } : {};
	}),
}));

import type { DashboardPayload } from 'lib/dashboardApi';
import {
	clearDashboardSessionCache,
	readDashboardSessionCache,
	resolveSessionStudentId,
	writeDashboardSessionCache,
} from './dashboardSessionCache';

const samplePayload = (studentId: number): DashboardPayload => ({
	student: {
		id: studentId,
		name: 'Test Student',
		photo_url: null,
		class_name: 'Class A',
		grade_name: 'Grade 1',
	},
	notifications: { unread_count: 0 },
	assignments: {
		new_count: 0,
		tabs: { todo: [], past_due: [], completed: [] },
	},
	progress: {
		tier: 'Bronze',
		next_tier: null,
		progress_percent: 0,
		stats: {},
	},
	xp: {
		total_xp: 0,
		level: 1,
		xp_in_level: 0,
		xp_to_next_level: 300,
		weekly_xp: 0,
		previous_weekly_xp: 0,
		next_level_threshold: 300,
		level_badge_label: 'explorer',
		levels_away_from_achiever: 11,
		achiever_level: 12,
		xp_per_level: 300,
		max_level: 12,
		track: {
			start_level: 9,
			end_level: 12,
			start_xp: 2100,
			end_xp: 3600,
			fill_percent: 0,
		},
	},
	rankings: { available: false, items: [] },
	weekly_activity: {
		range: 'week',
		event_count: 0,
		performance_delta: {
			current_avg: null,
			previous_avg: null,
			delta_percent: null,
			has_history: false,
		},
	},
	streak: {
		available: false,
		current_streak: 0,
		longest_streak: 0,
		active_days: 0,
		weekly_activity: 0,
	},
	continue_learning: {},
	recommended_activities: { items: [] },
	recent_activities: { items: [], has_more: false },
	quests: { available: false, items: [] },
	range: 'week',
});

function mockSessionIdentity(options: {
	cookieId?: string | null;
	userInfoId?: number | null;
	tokenSub?: string | number | null;
}) {
	vi.spyOn(Cookies, 'get').mockImplementation((key?: string) => {
		if (key === 'abotable_id') {
			return options.cookieId ?? undefined;
		}
		if (key === 'token_') {
			return options.tokenSub !== undefined && options.tokenSub !== null
				? `token-for-${options.tokenSub}`
				: undefined;
		}
		return undefined;
	});

	const getItem = vi.fn((key: string) => {
		if (key === 'user_info' && options.userInfoId !== undefined && options.userInfoId !== null) {
			return JSON.stringify({ id: options.userInfoId });
		}
		return null;
	});

	vi.stubGlobal('localStorage', {
		getItem,
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
		key: vi.fn(),
		length: 0,
	});
}

describe('dashboardSessionCache', () => {
	afterEach(() => {
		clearDashboardSessionCache();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('returns null when cache is empty', () => {
		expect(readDashboardSessionCache()).toBeNull();
	});

	it('stores and reads payload for the current student cookie', () => {
		mockSessionIdentity({ cookieId: '42', userInfoId: 42, tokenSub: 42 });

		writeDashboardSessionCache(samplePayload(42));

		expect(readDashboardSessionCache()?.student.name).toBe('Test Student');
	});

	it('ignores cache when student cookie changes', () => {
		mockSessionIdentity({ cookieId: '42', userInfoId: 42, tokenSub: 42 });
		writeDashboardSessionCache(samplePayload(42));

		mockSessionIdentity({ cookieId: '99', userInfoId: 99, tokenSub: 99 });

		expect(readDashboardSessionCache()).toBeNull();
	});

	it('reads and writes without abotable_id when user_info and token agree', () => {
		mockSessionIdentity({ cookieId: null, userInfoId: 1, tokenSub: 1 });

		writeDashboardSessionCache(samplePayload(1));

		expect(resolveSessionStudentId()).toBe('1');
		expect(readDashboardSessionCache()?.student.id).toBe(1);
	});

	it('refuses cache when session identity sources disagree', () => {
		mockSessionIdentity({ cookieId: '1', userInfoId: 2, tokenSub: 2 });

		writeDashboardSessionCache(samplePayload(2));

		expect(resolveSessionStudentId()).toBeNull();
		expect(readDashboardSessionCache()).toBeNull();
	});

	it('does not write cache when payload student id mismatches session', () => {
		mockSessionIdentity({ cookieId: '1', userInfoId: 1, tokenSub: 1 });

		writeDashboardSessionCache(samplePayload(2));

		expect(readDashboardSessionCache()).toBeNull();
	});

	it('does not expose student A cache to student B', () => {
		mockSessionIdentity({ cookieId: '10', userInfoId: 10, tokenSub: 10 });
		writeDashboardSessionCache(samplePayload(10));

		mockSessionIdentity({ cookieId: '20', userInfoId: 20, tokenSub: 20 });

		expect(readDashboardSessionCache()).toBeNull();
	});
});
