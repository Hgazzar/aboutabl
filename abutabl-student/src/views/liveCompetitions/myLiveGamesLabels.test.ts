import { describe, expect, it } from 'vitest';
import {
	blockReasonMessageId,
	invitationActionLabelId,
	invitationEligibility,
	invitationEligibilityLabelId,
	inviteStripeTone,
	sessionStatusLabelId,
} from './myLiveGamesLabels';

describe('myLiveGamesLabels', () => {
	it('classifies joinability', () => {
		expect(invitationEligibility({ can_join: true, joined: false })).toBe('joinable');
		expect(invitationEligibility({ can_join: false, joined: true })).toBe('joined');
		expect(invitationEligibility({ can_join: false, joined: false })).toBe('unavailable');
	});

	it('picks action labels from eligibility + session status', () => {
		expect(invitationActionLabelId('joinable', 'lobby')).toBe('myLiveGamesJoinNow');
		expect(invitationActionLabelId('joined', 'lobby')).toBe('myLiveGamesEnterLobby');
		expect(invitationActionLabelId('joined', 'playing')).toBe('myLiveGamesContinue');
		expect(invitationActionLabelId('joined', 'ended')).toBe('myLiveGamesViewResults');
		expect(invitationActionLabelId('unavailable', 'ended')).toBe('myLiveGamesView');
	});

	it('maps stripe colors to the same action buckets as the button', () => {
		expect(inviteStripeTone('joinable', 'lobby')).toBe('join');
		expect(inviteStripeTone('joined', 'lobby')).toBe('join');
		expect(inviteStripeTone('joined', 'playing')).toBe('continue');
		expect(inviteStripeTone('joined', 'ended')).toBe('results');
		expect(inviteStripeTone('unavailable', 'ended')).toBe('view');
	});

	it('picks eligibility chips from session status when already joined', () => {
		expect(invitationEligibilityLabelId('joinable', 'lobby')).toBe(
			'myLiveGamesEligibilityJoinable'
		);
		expect(invitationEligibilityLabelId('joined', 'lobby')).toBe(
			'myLiveGamesEligibilityWaiting'
		);
		expect(invitationEligibilityLabelId('joined', 'playing')).toBe(
			'myLiveGamesEligibilityPlaying'
		);
		expect(invitationEligibilityLabelId('joined', 'ended')).toBe(
			'myLiveGamesEligibilityResults'
		);
		expect(sessionStatusLabelId('lobby')).toBe('liveCompStatusLobby');
	});

	it('maps known block codes and hides unknown raw codes', () => {
		expect(blockReasonMessageId('invitation_expired')).toBe('myLiveGamesBlockExpired');
		expect(blockReasonMessageId('invitation_already_accepted')).toBe(
			'myLiveGamesBlockAlreadyAccepted'
		);
		expect(blockReasonMessageId('weird_code')).toBeNull();
		expect(blockReasonMessageId(null)).toBeNull();
	});
});
