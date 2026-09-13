import type { StudentFriendItem, StudentFriendsPayload } from 'lib/friendsApi';

export type StreakPopupTab = 'personal' | 'friends';

export type FriendsSessionState = {
	status: 'idle' | 'loading' | 'success' | 'error';
	payload: StudentFriendsPayload | null;
	error: string | null;
};

export function createIdleFriendsSession(): FriendsSessionState {
	return {
		status: 'idle',
		payload: null,
		error: null,
	};
}

/** Lazy fetch: only when Friends tab is active and session has no cached result yet. */
export function shouldFetchFriends(
	tab: StreakPopupTab,
	session: FriendsSessionState
): boolean {
	if (tab !== 'friends') return false;
	if (session.status === 'loading') return false;
	if (session.status === 'success') return false;
	if (session.status === 'error') return false;
	return session.status === 'idle';
}

export function isFriendsEmpty(payload: StudentFriendsPayload | null): boolean {
	return !!payload && Array.isArray(payload.items) && payload.items.length === 0;
}

export function friendDisplayRows(payload: StudentFriendsPayload | null): StudentFriendItem[] {
	if (!payload || !Array.isArray(payload.items)) return [];
	return payload.items.filter((item) => item.student_id > 0);
}
