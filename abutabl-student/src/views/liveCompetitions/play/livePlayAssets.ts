import type { LiveArenaTheme } from '../liveSessionArenaState';

/** Public asset paths already shipped with the student app (interactive games). */
export const LIVE_PLAY_ASSET = {
	classicBg: '/assets/games/images/gif.gif',
	goldBg: '/assets/games/images/gold-bg.jpg',
	classicLogo: '/assets/games/images/animalTestImg.png',
	goldLogo: '/assets/games/images/gold_quest.png',
	hackingLogo: '/assets/games/images/hacking_game.png',
	coin: '/assets/games/icons/coin.png',
	alarm: '/assets/games/icons/alarm.svg',
	mic: '/assets/games/icons/mic.svg',
	correct: '/assets/games/icons/correct.svg',
	wrong: '/assets/games/icons/wrong.svg',
	people: '/assets/games/icons/people.svg',
	person: '/assets/games/icons/person.svg',
	/** Looping BGM used by Classic interactive play. */
	bgm: '/assets/games/112.mp3',
	/** Secondary clip present in public assets (no documented SFX mapping). */
	monkey: '/assets/games/monkey.mp3',
} as const;

/**
 * SFX slots required by LIVE-GAMES-PLAY-001.
 * Only paths that exist under public/ may be listed as available.
 */
export const LIVE_PLAY_AUDIO_INVENTORY = {
	available: {
		gameStartBgm: LIVE_PLAY_ASSET.bgm,
		ambientSecondary: LIVE_PLAY_ASSET.monkey,
	},
	missing: [
		'question_transition',
		'countdown_tick',
		'correct_answer',
		'wrong_answer',
		'timeout',
		'reward_coins',
		'game_completion',
	] as const,
};

export type LivePlayThemeVisual = {
	theme: LiveArenaTheme;
	backgroundImage: string | null;
	backgroundColor: string;
	logo: string;
	modeClass: 'classic' | 'gold_quest' | 'hacking' | 'unknown';
};

export function resolveLivePlayThemeVisual(
	theme: LiveArenaTheme | string | null | undefined
): LivePlayThemeVisual {
	const key = String(theme || '').toLowerCase();
	if (key === 'classic') {
		return {
			theme: 'classic',
			backgroundImage: LIVE_PLAY_ASSET.classicBg,
			backgroundColor: '#0f1a2c',
			logo: LIVE_PLAY_ASSET.classicLogo,
			modeClass: 'classic',
		};
	}
	if (key === 'gold_quest') {
		return {
			theme: 'gold_quest',
			backgroundImage: LIVE_PLAY_ASSET.goldBg,
			backgroundColor: '#0f1a2c',
			logo: LIVE_PLAY_ASSET.goldLogo,
			modeClass: 'gold_quest',
		};
	}
	if (key === 'hacking') {
		return {
			theme: 'hacking',
			backgroundImage: null,
			backgroundColor: 'rgb(0, 28, 0)',
			logo: LIVE_PLAY_ASSET.hackingLogo,
			modeClass: 'hacking',
		};
	}
	return {
		theme: 'unknown',
		backgroundImage: LIVE_PLAY_ASSET.classicBg,
		backgroundColor: '#0f1a2c',
		logo: LIVE_PLAY_ASSET.classicLogo,
		modeClass: 'unknown',
	};
}
