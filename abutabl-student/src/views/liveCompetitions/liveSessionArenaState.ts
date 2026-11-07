import {
	isEndedResults,
	isPersonalDone,
	type LiveCompetitionCurrentView,
} from 'lib/liveCompetitionsStudentApi';

export type LiveArenaPanel =
	| 'need_password'
	| 'question'
	| 'reinforce'
	| 'reward'
	| 'personal_done'
	| 'ended_results'
	| 'loading'
	| 'unknown';

export type LiveArenaTheme = 'classic' | 'gold_quest' | 'hacking' | 'unknown';

/** Structural panel only — no gameplay rules. */
export function resolveArenaPanel(
	current: LiveCompetitionCurrentView | null
): LiveArenaPanel {
	if (!current) {
		return 'loading';
	}
	if (isEndedResults(current)) {
		return 'ended_results';
	}
	if (isPersonalDone(current)) {
		return 'personal_done';
	}
	switch (current.mode) {
		case 'need_password':
			return 'need_password';
		case 'question':
			return 'question';
		case 'reinforce':
			return 'reinforce';
		case 'reward':
			return 'reward';
		case 'done':
			return 'personal_done';
		case 'lobby':
		case 'waiting':
			return 'unknown';
		default:
			return 'unknown';
	}
}

/** Presentation only — must not branch gameplay logic. */
export function resolveArenaTheme(
	current: LiveCompetitionCurrentView | null
): LiveArenaTheme {
	const theme = current?.theme;
	if (theme === 'classic' || theme === 'gold_quest' || theme === 'hacking') {
		return theme;
	}
	return 'unknown';
}
