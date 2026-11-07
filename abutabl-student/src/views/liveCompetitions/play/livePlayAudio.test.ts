import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('livePlayAudio', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.stubGlobal(
			'Audio',
			vi.fn(() => ({
				loop: false,
				volume: 1,
				preload: 'auto',
				currentTime: 0,
				play: vi.fn(async () => undefined),
				pause: vi.fn(),
			}))
		);
	});

	it('requires unlock before playing BGM and reports missing cue inventory', async () => {
		const { createLivePlayAudioController } = await import('./livePlayAudio');
		const audio = createLivePlayAudioController();
		expect(audio.unlocked).toBe(false);
		expect(audio.muted).toBe(true);
		expect(audio.missingCues).toContain('correct_answer');

		audio.playCue('correct_answer');
		expect(Audio).not.toHaveBeenCalled();

		await audio.unlock();
		expect(audio.unlocked).toBe(true);
		expect(audio.muted).toBe(false);
		audio.playCue('game_start');
		expect(Audio).toHaveBeenCalled();

		audio.setMuted(true);
		expect(audio.muted).toBe(true);
	});
});
