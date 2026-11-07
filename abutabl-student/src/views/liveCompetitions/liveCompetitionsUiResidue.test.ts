import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

function read(name: string): string {
	return readFileSync(join(here, name), 'utf8');
}

const PRODUCTION_PAGES = [
	'MyLiveGamesPage.tsx',
	'LiveSessionJoinPage.tsx',
	'LiveSessionArenaShell.tsx',
	'LiveSessionQuestionPanel.tsx',
	'LiveSessionReinforcePanel.tsx',
	'LiveSessionRewardPanel.tsx',
	'LiveSessionPasswordPanel.tsx',
	'LiveSessionResultsPanel.tsx',
	'LiveSessionPersonalDonePanel.tsx',
	'LiveCompetitionStudentShell.tsx',
] as const;

/**
 * LIVE-GAMES-DELIVERY-007 — LC uses dashboard green shell; no legacy IG engine / dark stage.
 */
describe('Live Competitions student UI integration', () => {
	it('keeps production pages free of legacy Interactive Games engine chrome', () => {
		for (const name of PRODUCTION_PAGES) {
			const src = read(name);
			expect(src, name).not.toContain("views/games/");
			expect(src, name).not.toContain('GameBareLayout');
			expect(src, name).not.toContain('assets/games');
		}
	});

	it('uses dashboard green shell instead of legacy learn PageHeader / dark stage', () => {
		const shell = read('LiveCompetitionStudentShell.tsx');
		expect(shell).toContain('LiveGamesHeroSection');
		expect(shell).toContain('LiveGamesBoardCard');
		expect(shell).not.toContain('PageHeader');
		expect(shell).not.toContain('ModuleView');
		expect(shell).not.toContain('live-comp-stage');

		const css = read('liveCompetitions.module.css');
		expect(css).not.toContain('linear-gradient(160deg, #0b1c33');
		expect(css).not.toContain('#0b1c33');

		expect(read('MyLiveGamesPage.tsx')).toContain('LiveCompetitionStudentShell');
		expect(read('LiveSessionJoinPage.tsx')).toContain('LiveCompetitionStudentShell');
		expect(read('LiveSessionJoinPage.tsx')).toContain('LiveSessionArenaShell');
		expect(read('LiveSessionJoinPage.tsx')).toContain('heroBird="gamer"');
		expect(read('LiveGamesHeroSection.tsx')).toContain('hero-bird-gamer.png');
		expect(read('../home/index.tsx')).toContain('isLiveGames');
	});

	it('does not register legacy game engine screens under liveCompetitions source', () => {
		const names = readdirSync(here);
		expect(names).not.toContain('List');
		expect(names).not.toContain('Lobby');
		expect(names).not.toContain('Classic');
		expect(names).not.toContain('Hacking');
		expect(names).not.toContain('GoldQuest');
		expect(names).not.toContain('GameBareLayout.tsx');
	});
});
