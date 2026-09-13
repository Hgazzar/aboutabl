export type ProfilePanel = 'progress' | 'assignments' | 'edit' | 'password';
export type types = ProfilePanel | 'certificates' | 'edit' | 'password' | 'logout';
export type headerProps = {
	title: string;
};

/** GET /api/student/achievements — one catalog row from the API. */
export type ProfileAchievement = {
	key: string;
	title: string;
	description: string;
	icon: string;
	progress: number;
	earned: boolean;
	earned_at: string | null;
};
