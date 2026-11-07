import { describe, expect, it } from 'vitest';
import type { LiveCompetitionInvitePreview } from 'lib/liveCompetitionsStudentApi';
import {
	joinErrorMessageId,
	preserveQuestionClockOnCurrentUpdate,
	previewErrorMessageId,
	resolvePhaseFromCurrent,
	shouldAcceptCurrentUpdate,
	shouldAutoEnterCurrent,
	shouldDeferModeChangeForAnswerFeedback,
	shouldPollLobby,
	shouldShowJoinButton,
} from './liveSessionJoinState';

function preview(
	overrides: Partial<LiveCompetitionInvitePreview> & {
		can_join?: boolean;
		joined?: boolean;
	} = {}
): LiveCompetitionInvitePreview {
	return {
		session: {
			id: 55,
			status: 'lobby',
			theme: 'classic',
			game_name: 'Campfire',
			question_total: 6,
		},
		invite: { status: 'pending', accepted_at: null, expires_at: null },
		joined: false,
		can_join: true,
		block_reason: null,
		...overrides,
	};
}

describe('liveSessionJoinState', () => {
	it('shows Join only when can_join is true', () => {
		expect(shouldShowJoinButton(preview({ can_join: true, joined: false }))).toBe(true);
		expect(shouldShowJoinButton(preview({ can_join: false, joined: true }))).toBe(false);
		expect(shouldShowJoinButton(preview({ can_join: false, joined: false }))).toBe(false);
		expect(shouldShowJoinButton(null)).toBe(false);
	});

	it('auto-enters current only when already joined', () => {
		expect(shouldAutoEnterCurrent(preview({ joined: true, can_join: false }))).toBe(true);
		expect(shouldAutoEnterCurrent(preview({ joined: false, can_join: true }))).toBe(false);
	});

	it('accepted without player lobby still shows Join when can_join true', () => {
		expect(
			shouldShowJoinButton(
				preview({
					joined: false,
					can_join: true,
					invite: { status: 'accepted', accepted_at: 't', expires_at: null },
				})
			)
		).toBe(true);
	});

	it('maps current status to waiting / started / ended phases', () => {
		expect(resolvePhaseFromCurrent({ session_id: 1, status: 'lobby', mode: 'lobby' })).toBe(
			'waiting_lobby'
		);
		expect(resolvePhaseFromCurrent({ session_id: 1, status: 'playing', mode: 'question' })).toBe(
			'playing_started'
		);
		expect(resolvePhaseFromCurrent({ session_id: 1, status: 'ended', mode: 'done' })).toBe(
			'session_ended'
		);
		// playing + done is personal completion, not session end.
		expect(resolvePhaseFromCurrent({ session_id: 1, status: 'playing', mode: 'done' })).toBe(
			'playing_started'
		);
	});

	it('rejects stale gameplay updates after the session has ended', () => {
		const ended = { session_id: 1, status: 'ended', mode: 'done', done: true };
		const question = { session_id: 1, status: 'playing', mode: 'question' };
		expect(shouldAcceptCurrentUpdate(ended, question)).toBe(false);
		expect(shouldAcceptCurrentUpdate(ended, ended)).toBe(true);
		expect(shouldAcceptCurrentUpdate(question, ended)).toBe(true);
		expect(shouldAcceptCurrentUpdate(null, question)).toBe(true);
	});

	it('preserves an active question clock when a stale poll clears clock_started', () => {
		const prev = {
			session_id: 1,
			status: 'playing',
			mode: 'question',
			live_game_session_question_id: 9,
			clock_started: true,
			seconds_left: 14,
			question_seconds: 20,
			score: 2,
		};
		const stale = {
			session_id: 1,
			status: 'playing',
			mode: 'question',
			live_game_session_question_id: 9,
			clock_started: false,
			seconds_left: 20,
			question_seconds: 20,
			score: 2,
		};
		expect(preserveQuestionClockOnCurrentUpdate(prev, stale)).toEqual({
			...stale,
			clock_started: true,
			seconds_left: 14,
			question_seconds: 20,
		});
		expect(
			preserveQuestionClockOnCurrentUpdate(prev, {
				...stale,
				mode: 'reward',
			})
		).toEqual({ ...stale, mode: 'reward' });
	});

	it('defers reward/reinforce hops while answer feedback is held', () => {
		const question = { session_id: 1, status: 'playing', mode: 'question' };
		const reward = { session_id: 1, status: 'playing', mode: 'reward' };
		const ended = { session_id: 1, status: 'ended', mode: 'done', done: true };
		expect(shouldDeferModeChangeForAnswerFeedback(true, question, reward)).toBe(true);
		expect(shouldDeferModeChangeForAnswerFeedback(false, question, reward)).toBe(false);
		expect(shouldDeferModeChangeForAnswerFeedback(true, question, ended)).toBe(false);
		expect(shouldDeferModeChangeForAnswerFeedback(true, question, question)).toBe(false);
	});

	it('polls lobby for Begin and playing for host End', () => {
		expect(
			shouldPollLobby('waiting_lobby', { session_id: 1, status: 'lobby', mode: 'lobby' })
		).toBe(true);
		expect(
			shouldPollLobby('waiting_lobby', { session_id: 1, status: 'playing', mode: 'question' })
		).toBe(false);
		expect(
			shouldPollLobby('preview', { session_id: 1, status: 'lobby', mode: 'lobby' })
		).toBe(false);
		expect(
			shouldPollLobby('playing_started', { session_id: 1, status: 'playing', mode: 'question' })
		).toBe(true);
		expect(
			shouldPollLobby('playing_started', {
				session_id: 1,
				status: 'playing',
				mode: 'done',
				done: true,
			})
		).toBe(true);
		expect(
			shouldPollLobby('session_ended', { session_id: 1, status: 'ended', mode: 'done' })
		).toBe(false);
		expect(
			shouldPollLobby('playing_started', { session_id: 1, status: 'ended', mode: 'done' })
		).toBe(false);
	});

	it('maps API error kinds to message ids', () => {
		expect(previewErrorMessageId('not_found')).toBe('liveCompInviteNotFound');
		expect(previewErrorMessageId('not_eligible')).toBe('liveCompInviteNotEligible');
		expect(previewErrorMessageId('disabled')).toBe('liveCompDisabled');
		expect(joinErrorMessageId('not_in_lobby')).toBe('liveCompJoinNotInLobby');
		expect(joinErrorMessageId('not_eligible')).toBe('liveCompInviteNotEligible');
	});
});
