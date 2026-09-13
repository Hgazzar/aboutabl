export type ShellNavId = 'dashboard' | 'progress' | 'todo' | 'books' | 'games' | 'leaderboard';

export interface ShellNavItem {
	id: ShellNavId;
	labelKey: string;
	path: string;
	iconFile: string;
	activeIconFile: string;
	/** First URL segment(s) used for active state, e.g. `learn` or `learn/:id` */
	activeSegments: string[];
	/** When true, only exact path match (no child routes) */
	exactPath?: boolean;
	/** When false, icon stays in the bar but does not navigate (no dedicated page yet). */
	navigable?: boolean;
}

/** Figma BarLeft labels → existing routes (no new pages in STUDENT-01). */
export const STUDENT_SHELL_NAV: ShellNavItem[] = [
	{
		id: 'dashboard',
		labelKey: 'nav-dashboard',
		path: '/learn',
		iconFile: 'nav-dashboard.png',
		activeIconFile: 'nav-dashboard-active.png',
		activeSegments: ['learn'],
		exactPath: true,
	},
	{
		id: 'progress',
		labelKey: 'nav-progress',
		path: '/progress',
		iconFile: 'nav-progress.png',
		activeIconFile: 'nav-progress-active.png',
		activeSegments: ['progress'],
	},
	{
		id: 'todo',
		labelKey: 'nav-todo',
		path: '/todo',
		iconFile: 'nav-todo.png',
		activeIconFile: 'nav-todo-active.png',
		activeSegments: ['todo'],
	},
	{
		id: 'books',
		labelKey: 'nav-books',
		path: '/learn/books',
		iconFile: 'nav-books.png',
		activeIconFile: 'nav-books-active.png',
		activeSegments: ['learn'],
		exactPath: false,
	},
	{
		id: 'games',
		labelKey: 'nav-games',
		path: '/games',
		iconFile: 'nav-games.png',
		activeIconFile: 'nav-games-active.png',
		activeSegments: ['games'],
		navigable: false,
	},
	{
		id: 'leaderboard',
		labelKey: 'nav-leaderboard',
		path: '/leaderboard',
		iconFile: 'nav-leaderboard.png',
		activeIconFile: 'nav-leaderboard-active.png',
		activeSegments: ['leaderboard'],
	},
];

export function isShellNavActive(item: ShellNavItem, pathname: string): boolean {
	const normalized = pathname.replace(/\/$/, '') || '/';

	if (item.navigable === false) {
		return false;
	}

	if (item.id === 'dashboard') {
		return normalized === '/learn';
	}
	if (item.id === 'books') {
		// My Books library + Subject Details (`/learn/:subjectId`), not Dashboard or deep viewers.
		if (normalized === '/learn/books') return true;
		if (normalized === '/learn') return false;
		const parts = normalized.split('/').filter(Boolean);
		return parts[0] === 'learn' && parts.length === 2;
	}
	if (item.id === 'leaderboard') {
		return normalized === '/leaderboard';
	}
	if (item.id === 'progress') {
		return normalized === '/progress' || normalized.startsWith('/progress/');
	}

	const segment = normalized.split('/').filter(Boolean)[0] ?? '';
	return item.activeSegments.includes(segment);
}

export function isShellNavNavigable(item: ShellNavItem): boolean {
	return item.navigable !== false;
}
