import { describe, expect, it } from 'vitest';
import type { StudentFriendsPayload } from 'lib/friendsApi';
import {
	createIdleFriendsSession,
	friendDisplayRows,
	isFriendsEmpty,
	shouldFetchFriends,
} from './learningStreakFriendsUtils';

const samplePayload = (items: StudentFriendsPayload['items']): StudentFriendsPayload => ({
	available: true,
	items,
});

describe('learningStreakFriendsUtils', () => {
	it('starts idle with no cached payload', () => {
		expect(createIdleFriendsSession()).toEqual({
			status: 'idle',
			payload: null,
			error: null,
		});
	});

	it('fetches only when Friends tab is active and session is idle', () => {
		const idle = createIdleFriendsSession();
		expect(shouldFetchFriends('personal', idle)).toBe(false);
		expect(shouldFetchFriends('friends', idle)).toBe(true);
	});

	it('does not refetch while loading, after success, or after error in the same session', () => {
		expect(
			shouldFetchFriends('friends', {
				status: 'loading',
				payload: null,
				error: null,
			})
		).toBe(false);

		expect(
			shouldFetchFriends('friends', {
				status: 'success',
				payload: samplePayload([]),
				error: null,
			})
		).toBe(false);

		expect(
			shouldFetchFriends('friends', {
				status: 'error',
				payload: null,
				error: 'failed',
			})
		).toBe(false);
	});

	it('treats empty items as No Friends state', () => {
		expect(isFriendsEmpty(samplePayload([]))).toBe(true);
		expect(
			isFriendsEmpty(
				samplePayload([
					{
						student_id: 1,
						name: 'Kareem',
						photo_url: null,
						current_streak: 1,
						streak_active: true,
					},
				])
			)
		).toBe(false);
		expect(isFriendsEmpty(null)).toBe(false);
	});

	it('renders only real friend rows from API payload', () => {
		const rows = friendDisplayRows(
			samplePayload([
				{
					student_id: 9,
					name: 'Kareem',
					photo_url: 'https://cdn/x.png',
					current_streak: 1,
					streak_active: true,
				},
				{
					student_id: 0,
					name: 'Invalid',
					photo_url: null,
					current_streak: 0,
					streak_active: false,
				},
			])
		);

		expect(rows).toHaveLength(1);
		expect(rows[0]?.name).toBe('Kareem');
		expect(rows[0]?.current_streak).toBe(1);
		expect(rows[0]?.streak_active).toBe(true);
		expect(rows[0]?.photo_url).toBe('https://cdn/x.png');
	});

	it('does not invent friends when payload is empty', () => {
		expect(friendDisplayRows(samplePayload([]))).toEqual([]);
		expect(friendDisplayRows(null)).toEqual([]);
	});
});
