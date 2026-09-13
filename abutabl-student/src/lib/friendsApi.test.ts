import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as requests from 'lib/requests';
import { fetchStudentFriends } from 'lib/friendsApi';

describe('friendsApi', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches accepted friends from dedicated endpoint', async () => {
		const getRequest = vi.spyOn(requests, 'getRequest').mockResolvedValue({
			status: true,
			friends: {
				available: true,
				items: [
					{
						student_id: 12,
						name: 'Kareem',
						photo_url: 'https://example.com/a.png',
						current_streak: 5,
						streak_active: true,
					},
				],
			},
		});

		const payload = await fetchStudentFriends();

		expect(getRequest).toHaveBeenCalledWith('friends', undefined, undefined, undefined);
		expect(payload.available).toBe(true);
		expect(payload.items).toEqual([
			{
				student_id: 12,
				name: 'Kareem',
				photo_url: 'https://example.com/a.png',
				current_streak: 5,
				streak_active: true,
			},
		]);
	});

	it('returns empty items without inventing friends', async () => {
		vi.spyOn(requests, 'getRequest').mockResolvedValue({
			status: true,
			friends: {
				available: true,
				items: [],
			},
		});

		const payload = await fetchStudentFriends();
		expect(payload.items).toEqual([]);
	});

	it('normalizes missing photo and streak fields without fake names', async () => {
		vi.spyOn(requests, 'getRequest').mockResolvedValue({
			status: true,
			friends: {
				available: true,
				items: [{ student_id: 3 }],
			},
		});

		const payload = await fetchStudentFriends();
		expect(payload.items[0]).toEqual({
			student_id: 3,
			name: '',
			photo_url: null,
			current_streak: 0,
			streak_active: false,
		});
	});
});
