import { describe, expect, it } from 'vitest';
import {
	LIVE_PLAY_AUDIO_INVENTORY,
	LIVE_PLAY_ASSET,
	resolveLivePlayThemeVisual,
} from './livePlayAssets';

describe('livePlayAssets', () => {
	it('maps classic / gold_quest / hacking to distinct theme visuals', () => {
		expect(resolveLivePlayThemeVisual('classic').backgroundImage).toBe(
			LIVE_PLAY_ASSET.classicBg
		);
		expect(resolveLivePlayThemeVisual('gold_quest').backgroundImage).toBe(
			LIVE_PLAY_ASSET.goldBg
		);
		expect(resolveLivePlayThemeVisual('hacking').backgroundImage).toBeNull();
		expect(resolveLivePlayThemeVisual('hacking').backgroundColor).toContain('0, 28, 0');
	});

	it('lists only real public audio paths as available and reports missing SFX', () => {
		expect(LIVE_PLAY_AUDIO_INVENTORY.available.gameStartBgm).toBe('/assets/games/112.mp3');
		expect(LIVE_PLAY_AUDIO_INVENTORY.missing).toContain('correct_answer');
		expect(LIVE_PLAY_AUDIO_INVENTORY.missing).toContain('wrong_answer');
		expect(LIVE_PLAY_AUDIO_INVENTORY.missing).toContain('timeout');
		expect(LIVE_PLAY_AUDIO_INVENTORY.missing).toContain('game_completion');
	});
});
