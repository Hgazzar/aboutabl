import {
	isEndedResults,
	isPersonalDone,
	type LiveCompetitionApiErrorKind,
	type LiveCompetitionCurrentView,
	type LiveCompetitionInvitePreview,
} from 'lib/liveCompetitionsStudentApi';

export type LiveSessionUiPhase =
	| 'loading_preview'
	| 'preview'
	| 'joining'
	| 'loading_current'
	| 'waiting_lobby'
	| 'playing_started'
	| 'session_ended'
	| 'error';

export function shouldShowJoinButton(preview: LiveCompetitionInvitePreview | null): boolean {
	return Boolean(preview?.can_join === true);
}

export function shouldAutoEnterCurrent(preview: LiveCompetitionInvitePreview | null): boolean {
	return Boolean(preview?.joined === true);
}

export function resolvePhaseFromCurrent(
	current: LiveCompetitionCurrentView | null
): Extract<LiveSessionUiPhase, 'waiting_lobby' | 'playing_started' | 'session_ended'> | null {
	if (!current) {
		return null;
	}
	// status=ended → personal results. playing+mode=done → still in session (wait for host end).
	if (isEndedResults(current)) {
		return 'session_ended';
	}
	if (current.status === 'lobby' || current.mode === 'lobby') {
		return 'waiting_lobby';
	}
	if (current.status === 'playing' || isPersonalDone(current)) {
		return 'playing_started';
	}
	// need_password / question / reward etc. mean the live session has begun.
	if (current.mode && current.mode !== 'waiting' && current.mode !== 'done') {
		return 'playing_started';
	}
	if (current.mode === 'done') {
		return 'session_ended';
	}
	return 'waiting_lobby';
}

/**
 * After host End, never accept a stale gameplay patch (e.g. feedback HUD hold)
 * that would put the student back on a question/reward screen.
 */
export function shouldAcceptCurrentUpdate(
	prev: LiveCompetitionCurrentView | null,
	next: LiveCompetitionCurrentView
): boolean {
	if (prev?.status === 'ended' && next.status !== 'ended') {
		return false;
	}
	return true;
}

/**
 * Soft /current polls can return an older snapshot that clears clock_started on the
 * same question. Keep the local clock fields so the HUD does not flash "--".
 */
export function preserveQuestionClockOnCurrentUpdate(
	prev: LiveCompetitionCurrentView | null,
	next: LiveCompetitionCurrentView
): LiveCompetitionCurrentView {
	if (
		!prev ||
		prev.mode !== 'question' ||
		next.mode !== 'question' ||
		!prev.clock_started ||
		next.clock_started ||
		prev.live_game_session_question_id == null ||
		prev.live_game_session_question_id !== next.live_game_session_question_id
	) {
		return next;
	}

	return {
		...next,
		clock_started: true,
		// Stale "clock off" payloads still send full question_seconds as seconds_left.
		seconds_left: prev.seconds_left ?? next.seconds_left,
		question_seconds: next.question_seconds ?? prev.question_seconds,
	};
}

/**
 * While post-answer explanation is on screen, ignore poll hops to reward/reinforce
 * so the student can finish reading. Host End always wins.
 */
export function shouldDeferModeChangeForAnswerFeedback(
	holdingFeedback: boolean,
	prev: LiveCompetitionCurrentView | null,
	next: LiveCompetitionCurrentView
): boolean {
	if (!holdingFeedback || !prev) {
		return false;
	}
	if (next.status === 'ended') {
		return false;
	}
	if (prev.mode !== 'question') {
		return false;
	}
	return next.mode !== 'question';
}

/**
 * Poll /current while waiting in lobby (host Begin) and while playing (host End).
 * Soft question resync alone is not enough — it pauses when the clock is idle or feedback is up.
 */
export function shouldPollLobby(
	phase: LiveSessionUiPhase,
	current: LiveCompetitionCurrentView | null
): boolean {
	if (phase === 'waiting_lobby') {
		if (!current) {
			return true;
		}
		return current.status === 'lobby' || current.mode === 'lobby';
	}
	if (phase === 'playing_started') {
		if (!current) {
			return true;
		}
		return current.status === 'playing';
	}
	return false;
}

export function previewErrorMessageId(kind: LiveCompetitionApiErrorKind): string {
	switch (kind) {
		case 'not_found':
			return 'liveCompInviteNotFound';
		case 'not_eligible':
			return 'liveCompInviteNotEligible';
		case 'disabled':
			return 'liveCompDisabled';
		case 'unauthenticated':
			return 'liveCompUnauthenticated';
		case 'network':
			return 'liveCompNetworkError';
		default:
			return 'liveCompPreviewError';
	}
}

export function joinErrorMessageId(kind: LiveCompetitionApiErrorKind): string {
	switch (kind) {
		case 'not_found':
			return 'liveCompInviteNotFound';
		case 'not_eligible':
			return 'liveCompInviteNotEligible';
		case 'not_in_lobby':
			return 'liveCompJoinNotInLobby';
		case 'disabled':
			return 'liveCompDisabled';
		case 'network':
			return 'liveCompNetworkError';
		default:
			return 'liveCompJoinError';
	}
}

/** Localized copy for answer / timeout / clock mutations (409 → not accepted). */
export function gameplayErrorMessageId(kind: LiveCompetitionApiErrorKind): string {
	switch (kind) {
		case 'unauthenticated':
			return 'liveCompUnauthenticated';
		case 'disabled':
			return 'liveCompDisabled';
		case 'network':
			return 'liveCompNetworkError';
		case 'not_in_lobby':
			return 'liveCompAnswerNotAccepted';
		case 'not_found':
			return 'liveCompInviteNotFound';
		default:
			return 'liveCompAnswerError';
	}
}
