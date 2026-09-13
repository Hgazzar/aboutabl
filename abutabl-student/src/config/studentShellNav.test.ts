import { describe, expect, it } from 'vitest';
import { isShellNavActive, isShellNavNavigable, STUDENT_SHELL_NAV } from './studentShellNav';

const byId = (id: (typeof STUDENT_SHELL_NAV)[number]['id']) =>
	STUDENT_SHELL_NAV.find((item) => item.id === id)!;

describe('isShellNavActive', () => {
	it('activates dashboard only on /learn', () => {
		expect(isShellNavActive(byId('dashboard'), '/learn')).toBe(true);
		expect(isShellNavActive(byId('dashboard'), '/learn/books')).toBe(false);
	});

	it('activates books on My Books and Subject Details', () => {
		expect(isShellNavActive(byId('books'), '/learn/books')).toBe(true);
		expect(isShellNavActive(byId('books'), '/learn/42')).toBe(true);
		expect(isShellNavActive(byId('books'), '/learn')).toBe(false);
		expect(isShellNavActive(byId('books'), '/learn/42/details/9')).toBe(false);
		expect(isShellNavActive(byId('dashboard'), '/learn/42')).toBe(false);
	});

	it('activates Progress on /progress and keeps profile out of Progress nav', () => {
		expect(isShellNavNavigable(byId('progress'))).toBe(true);
		expect(byId('progress').path).toBe('/progress');
		expect(isShellNavActive(byId('progress'), '/progress')).toBe(true);
		expect(isShellNavActive(byId('progress'), '/profile')).toBe(false);
		expect(isShellNavActive(byId('progress'), '/profile/edit')).toBe(false);
		expect(isShellNavActive(byId('progress'), '/learn')).toBe(false);
	});

	it('activates leaderboard on /leaderboard and keeps /learn intact', () => {
		expect(isShellNavNavigable(byId('leaderboard'))).toBe(true);
		expect(isShellNavActive(byId('leaderboard'), '/leaderboard')).toBe(true);
		expect(isShellNavActive(byId('leaderboard'), '/learn')).toBe(false);
		expect(isShellNavActive(byId('leaderboard'), '/profile')).toBe(false);
		expect(isShellNavActive(byId('dashboard'), '/learn')).toBe(true);
	});

	it('activates todo on its route; games stays non-navigable', () => {
		expect(isShellNavActive(byId('todo'), '/todo')).toBe(true);
		expect(isShellNavNavigable(byId('games'))).toBe(false);
		expect(isShellNavActive(byId('games'), '/games')).toBe(false);
	});
});

describe('STUDENT_SHELL_NAV routes', () => {
	it('maps shell labels to existing student routes without /profile', () => {
		expect(STUDENT_SHELL_NAV.map((item) => item.path)).toEqual([
			'/learn',
			'/progress',
			'/todo',
			'/learn/books',
			'/games',
			'/leaderboard',
		]);
		expect(STUDENT_SHELL_NAV.some((item) => item.path === '/profile')).toBe(false);
		expect(STUDENT_SHELL_NAV.filter((item) => isShellNavNavigable(item)).map((item) => item.id)).toEqual([
			'dashboard',
			'progress',
			'todo',
			'books',
			'leaderboard',
		]);
	});
});
