import { LIVE_PLAY_AUDIO_INVENTORY, LIVE_PLAY_ASSET } from './livePlayAssets';

export type LivePlayAudioCue =
	| 'game_start'
	| 'question_transition'
	| 'countdown_tick'
	| 'correct_answer'
	| 'wrong_answer'
	| 'timeout'
	| 'reward_coins'
	| 'game_completion';

type LivePlayAudioController = {
	unlocked: boolean;
	muted: boolean;
	missingCues: readonly string[];
	unlock: () => Promise<void>;
	setMuted: (muted: boolean) => void;
	playCue: (cue: LivePlayAudioCue) => void;
	stopBgm: () => void;
};

let unlocked = false;
let muted = true;
let bgm: HTMLAudioElement | null = null;

function ensureBgm(): HTMLAudioElement {
	if (!bgm) {
		bgm = new Audio(LIVE_PLAY_ASSET.bgm);
		bgm.loop = true;
		bgm.volume = 0.35;
		bgm.preload = 'auto';
	}
	return bgm;
}

/**
 * Isolated Live Competitions audio helper.
 * Uses only real public assets. Missing SFX cues are no-ops and listed in inventory.
 */
export function createLivePlayAudioController(): LivePlayAudioController {
	return {
		get unlocked() {
			return unlocked;
		},
		get muted() {
			return muted;
		},
		missingCues: LIVE_PLAY_AUDIO_INVENTORY.missing,
		async unlock() {
			unlocked = true;
			muted = false;
			const audio = ensureBgm();
			try {
				audio.currentTime = 0;
				await audio.play();
			} catch {
				/* Browser autoplay policy — UI can retry on next tap. */
			}
		},
		setMuted(next) {
			muted = next;
			if (!bgm) {
				return;
			}
			if (muted) {
				bgm.pause();
			} else if (unlocked) {
				void bgm.play().catch(() => {});
			}
		},
		playCue(cue) {
			if (!unlocked || muted) {
				return;
			}
			if (cue === 'game_start') {
				const audio = ensureBgm();
				void audio.play().catch(() => {});
				return;
			}
			// Remaining cues have no dedicated asset under public/assets/games.
		},
		stopBgm() {
			if (bgm) {
				bgm.pause();
			}
		},
	};
}

/** Singleton used by the Live play stage (one BGM instance per tab). */
export const livePlayAudio = createLivePlayAudioController();
