import { describe, expect, it } from 'vitest';
import { navbarAvatarOpensProfile } from './navbarAvatarTarget';

describe('navbarAvatarOpensProfile', () => {
	it('opens My Profile from dashboard and every other shell route', () => {
		expect(navbarAvatarOpensProfile('/learn')).toBe(true);
		expect(navbarAvatarOpensProfile('/learn/')).toBe(true);
		expect(navbarAvatarOpensProfile('/todo')).toBe(true);
		expect(navbarAvatarOpensProfile('/progress')).toBe(true);
		expect(navbarAvatarOpensProfile('/leaderboard')).toBe(true);
		expect(navbarAvatarOpensProfile('/games')).toBe(true);
		expect(navbarAvatarOpensProfile('/friends')).toBe(true);
		expect(navbarAvatarOpensProfile('/profile')).toBe(true);
		expect(navbarAvatarOpensProfile('/learn/books')).toBe(true);
	});
});
