export type InvitationEligibility = 'joinable' | 'joined' | 'unavailable';

export function invitationEligibility(item: {
	can_join?: boolean;
	joined?: boolean;
}): InvitationEligibility {
	if (item.can_join) {
		return 'joinable';
	}
	if (item.joined) {
		return 'joined';
	}
	return 'unavailable';
}

function normalizeSessionStatus(status: string | null | undefined): string {
	return String(status || '').toLowerCase();
}

/**
 * Button copy depends on join state AND session status:
 * joinable → Join now
 * joined + lobby → Enter lobby (waiting for teacher)
 * joined + playing → Continue
 * joined + ended → View results
 * unavailable → View
 */
export function invitationActionLabelId(
	eligibility: InvitationEligibility,
	sessionStatus?: string | null
): string {
	if (eligibility === 'joinable') {
		return 'myLiveGamesJoinNow';
	}
	if (eligibility === 'joined') {
		const status = normalizeSessionStatus(sessionStatus);
		if (status === 'lobby') {
			return 'myLiveGamesEnterLobby';
		}
		if (status === 'playing') {
			return 'myLiveGamesContinue';
		}
		if (status === 'ended') {
			return 'myLiveGamesViewResults';
		}
		return 'myLiveGamesContinue';
	}
	return 'myLiveGamesView';
}

/** Stripe color follows the same action buckets as the button label. */
export type InviteStripeTone = 'join' | 'continue' | 'results' | 'view';

export function inviteStripeTone(
	eligibility: InvitationEligibility,
	sessionStatus?: string | null
): InviteStripeTone {
	if (eligibility === 'joinable') {
		return 'join';
	}
	if (eligibility === 'joined') {
		const status = normalizeSessionStatus(sessionStatus);
		if (status === 'ended') {
			return 'results';
		}
		if (status === 'lobby') {
			return 'join';
		}
		return 'continue';
	}
	return 'view';
}

export function invitationEligibilityLabelId(
	eligibility: InvitationEligibility,
	sessionStatus?: string | null
): string {
	if (eligibility === 'joinable') {
		return 'myLiveGamesEligibilityJoinable';
	}
	if (eligibility === 'joined') {
		const status = normalizeSessionStatus(sessionStatus);
		if (status === 'lobby') {
			return 'myLiveGamesEligibilityWaiting';
		}
		if (status === 'playing') {
			return 'myLiveGamesEligibilityPlaying';
		}
		if (status === 'ended') {
			return 'myLiveGamesEligibilityResults';
		}
		return 'myLiveGamesEligibilityJoined';
	}
	return 'myLiveGamesEligibilityUnavailable';
}

export function sessionStatusLabelId(status: string | null | undefined): string {
	switch (normalizeSessionStatus(status)) {
		case 'lobby':
			return 'liveCompStatusLobby';
		case 'playing':
			return 'liveCompStatusPlaying';
		case 'ended':
			return 'liveCompStatusEnded';
		default:
			return 'liveCompStatusUnknown';
	}
}

export function inviteStatusLabelId(status: string | null | undefined): string {
	switch (String(status || '').toLowerCase()) {
		case 'pending':
			return 'liveCompInviteStatusPending';
		case 'accepted':
			return 'liveCompInviteStatusAccepted';
		case 'expired':
			return 'liveCompInviteStatusExpired';
		case 'revoked':
			return 'liveCompInviteStatusRevoked';
		default:
			return 'liveCompInviteStatusUnknown';
	}
}

/** Map API snake_case block codes to i18n — never show raw codes. */
export function blockReasonMessageId(reason: string | null | undefined): string | null {
	switch (String(reason || '')) {
		case 'invitation_already_accepted':
			return 'myLiveGamesBlockAlreadyAccepted';
		case 'invitation_expired':
			return 'myLiveGamesBlockExpired';
		case 'invitation_revoked':
			return 'myLiveGamesBlockRevoked';
		case 'session_not_joinable':
			return 'myLiveGamesBlockSessionNotJoinable';
		case 'invitation_not_joinable':
			return 'myLiveGamesBlockNotJoinable';
		case 'not_active_in_class':
			return 'myLiveGamesBlockNotInClass';
		default:
			return null;
	}
}
