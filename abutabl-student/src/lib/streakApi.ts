import { getRequest } from 'lib/requests';
import { parseStudentApiPayload } from 'lib/studentApiResponse';

export type StreakCalendarDayStatus = 'completed' | 'today_pending' | 'future' | 'missed';

export type StreakCalendarDay = {
	date: string;
	status: StreakCalendarDayStatus;
};

export type StreakCalendarPayload = {
	year: number;
	month: number;
	days: StreakCalendarDay[];
};

export async function fetchStreakCalendar(
	year: number,
	month: number,
	signal?: AbortSignal
): Promise<StreakCalendarPayload> {
	const response = await getRequest('/student/streak/calendar', { year, month }, undefined, signal);
	return parseStudentApiPayload<StreakCalendarPayload>(response, 'streak_calendar');
}
