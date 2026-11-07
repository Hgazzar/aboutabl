import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isShellNavNavigable, STUDENT_SHELL_NAV } from 'config/studentShellNav';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '../..');

function readSrc(relativeFromSrc: string): string {
	return readFileSync(join(srcRoot, relativeFromSrc), 'utf8');
}

/**
 * LIVE-GAMES-DELIVERY-005 — legacy Interactive Games product retired from active SPA.
 * Live Competitions (/live-games) is the only classroom games surface.
 */
describe('Interactive Games retirement (Student SPA)', () => {
	it('routes shell Games to /live-games', () => {
		const games = STUDENT_SHELL_NAV.find((item) => item.id === 'games');
		expect(games?.path).toBe('/live-games');
		expect(games && isShellNavNavigable(games)).toBe(true);
	});

	it('unregisters legacy Interactive Games play routes and redirects /games', () => {
		const routes = readSrc('routes/routes.tsx');
		expect(routes).toContain("path: 'live-games'");
		expect(routes).toContain("path: 'live-games/sessions/:sessionId'");
		expect(routes).toContain('Navigate to="/live-games"');
		expect(routes).not.toContain("views/games/List");
		expect(routes).not.toContain("views/games/Lobby");
		expect(routes).not.toContain("views/games/Classic/Question");
		expect(routes).not.toContain('GameBareLayout');
		expect(routes).not.toContain("path: 'games/:gameId/play'");
		expect(routes).not.toContain("path: 'games/:gameId/lobby'");
	});

	it('keeps curriculum lesson game route (not Interactive Games)', () => {
		const routes = readSrc('routes/routes.tsx');
		expect(routes).toContain("path: 'learn/:id/detailsGame/:idGame'");
	});
});
