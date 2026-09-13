import { getRequest } from 'lib/requests';
import { parseStudentApiPayload } from 'lib/studentApiResponse';

export type StudentFriendItem = {
	student_id: number;
	name: string;
	photo_url: string | null;
	current_streak: number;
	streak_active: boolean;
};

export type StudentFriendsPayload = {
	available: boolean;
	items: StudentFriendItem[];
};

export async function fetchStudentFriends(signal?: AbortSignal): Promise<StudentFriendsPayload> {
	const response = await getRequest('friends', undefined, undefined, signal);
	const payload = parseStudentApiPayload<StudentFriendsPayload>(response, 'friends');

	return {
		available: payload.available === true,
		items: Array.isArray(payload.items) ? payload.items.map(normalizeFriendItem) : [],
	};
}

function normalizeFriendItem(raw: Partial<StudentFriendItem>): StudentFriendItem {
	const currentStreak = Math.max(0, Number(raw.current_streak) || 0);

	return {
		student_id: Number(raw.student_id) || 0,
		name: typeof raw.name === 'string' ? raw.name : '',
		photo_url: typeof raw.photo_url === 'string' && raw.photo_url.trim() ? raw.photo_url : null,
		current_streak: currentStreak,
		streak_active: raw.streak_active === true || currentStreak > 0,
	};
}
