import { getRequest } from 'lib/requests';
import { parseStudentApiPayload } from 'lib/studentApiResponse';

export type NavbarPayload = {
	student: {
		id: number;
		name: string;
		photo_url?: string | null;
	};
	xp: {
		total_xp: number;
		level: number;
		xp_in_level: number;
		xp_to_next_level: number | null;
	};
	notifications: {
		unread_count: number;
	};
};

export async function fetchStudentNavbar(): Promise<NavbarPayload> {
	const res = await getRequest('navbar');
	return parseStudentApiPayload<NavbarPayload>(res, 'navbar', 'Invalid navbar response');
}
