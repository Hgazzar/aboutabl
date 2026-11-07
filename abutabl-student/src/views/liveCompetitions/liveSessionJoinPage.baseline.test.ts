import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveNotificationNavTarget } from 'lib/notificationUtils';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '../..');

function readSrc(relativeFromSrc: string): string {
	return readFileSync(join(srcRoot, relativeFromSrc), 'utf8');
}

describe('F.3 live competition invite page baseline', () => {
	it('registers protected /live-games/sessions/:sessionId; legacy /games redirects away', () => {
		const routes = readSrc('routes/routes.tsx');
		expect(routes).toContain("path: 'live-games/sessions/:sessionId'");
		expect(routes).toContain('LiveSessionJoinPage');
		expect(routes).toContain("path: 'games'");
		expect(routes).toContain('Navigate to="/live-games"');
		expect(routes).not.toContain("path: 'games/:gameId/lobby'");
	});

	it('registers authenticated /live-games list without legacy Interactive Games play routes', () => {
		const routes = readSrc('routes/routes.tsx');
		expect(routes).toContain("path: 'live-games'");
		expect(routes).toContain('MyLiveGamesPage');
		expect(routes).toContain("path: 'live-games/sessions/:sessionId'");
		expect(routes).toContain('LiveSessionJoinPage');
		expect(routes).not.toContain("views/games/List");
		expect(routes).not.toContain("views/games/Lobby");
		const listPage = readSrc('views/liveCompetitions/MyLiveGamesPage.tsx');
		expect(listPage).toContain('getLiveCompetitionInvitations');
		// List "Join now" posts join then navigates — not Open-only.
		expect(listPage).toContain('joinLiveCompetitionSession');
	});

	it('loads preview on mount and never auto-joins', () => {
		const page = readSrc('views/liveCompetitions/LiveSessionJoinPage.tsx');
		expect(page).toContain('fetchLiveCompetitionPreview');
		expect(page).toContain('joinLiveCompetitionSession');
		expect(page).toContain('void loadPreview()');
		expect(page).not.toMatch(/useEffect\(\(\)\s*=>\s*\{\s*void onJoin/);
		// Join only from explicit button handler; mount effect only loads preview.
		expect(page).toMatch(/useEffect\(\(\)\s*=>\s*\{\s*void loadPreview\(\);\s*\},\s*\[loadPreview\]\)/);
		expect(page).toContain('onClick={() => void onJoin()}');
		expect(page).toContain('joiningRef.current');
		expect(page).toContain('inFlightCurrentRef.current');
		const loadPreviewBody = page.slice(
			page.indexOf('const loadPreview = useCallback'),
			page.indexOf('const onJoin = useCallback')
		);
		expect(loadPreviewBody).not.toContain('joinLiveCompetitionSession');
	});

	it('uses current endpoint and polls lobby plus playing for host End', () => {
		const page = readSrc('views/liveCompetitions/LiveSessionJoinPage.tsx');
		expect(page).toContain('fetchLiveCompetitionCurrent');
		expect(page).toContain('LIVE_SESSION_LOBBY_POLL_MS');
		expect(page).toContain('shouldPollLobby');
		expect(page).toContain('stopPolling');
		expect(page).not.toContain('student-online');
		expect(page).not.toContain('Echo');
		expect(page).not.toContain('interactive-games');
		const state = readSrc('views/liveCompetitions/liveSessionJoinState.ts');
		expect(state).toContain("phase === 'playing_started'");
		expect(state).toContain("return current.status === 'playing'");
	});

	it('shows Join gated by can_join and skips Join when already joined', () => {
		const page = readSrc('views/liveCompetitions/LiveSessionJoinPage.tsx');
		expect(page).toContain('shouldShowJoinButton');
		expect(page).toContain('shouldAutoEnterCurrent');
		expect(page).toContain('live-comp-join-button');
	});

	it('covers EN and AR invite copy keys', () => {
		const en = JSON.parse(readSrc('translations/EN/translation.json'));
		const ar = JSON.parse(readSrc('translations/AR/translation.json'));
		const keys = [
			'liveCompInviteTitle',
			'liveCompJoin',
			'liveCompWaitingTitle',
			'liveCompInviteNotFound',
			'liveCompInviteNotEligible',
			'liveCompJoinNotInLobby',
			'liveCompDisabled',
			'liveCompStartedBody',
			'liveCompEndedBody',
			'liveCompArenaQuestionTitle',
			'liveCompArenaPersonalDoneTitle',
			'liveCompArenaEndedTitle',
			'myLiveGamesTitle',
			'myLiveGamesEmptyTitle',
			'myLiveGamesLoadError',
			'myLiveGamesOpen',
			'myLiveGamesContinue',
			'myLiveGamesView',
			'myLiveGamesEligibilityJoinable',
			'myLiveGamesEligibilityJoined',
			'myLiveGamesEligibilityUnavailable',
		];
		for (const key of keys) {
			expect(typeof en[key]).toBe('string');
			expect(String(en[key]).length).toBeGreaterThan(0);
			expect(typeof ar[key]).toBe('string');
			expect(String(ar[key]).length).toBeGreaterThan(0);
		}
	});

	it('mounts Arena shell for playing and ended phases without join auto-play', () => {
		const page = readSrc('views/liveCompetitions/LiveSessionJoinPage.tsx');
		expect(page).toContain('LiveSessionArenaShell');
		expect(page).toContain("phase === 'playing_started' || phase === 'session_ended'");
		expect(page).not.toContain('submitLiveCompetitionAnswer');
		expect(page).not.toContain('startLiveCompetitionQuestionClock');
	});

	it('notification deep link for live-games sessions stays internal', () => {
		expect(resolveNotificationNavTarget('/live-games/sessions/55')).toEqual({
			kind: 'internal',
			path: '/live-games/sessions/55',
		});
	});
});
