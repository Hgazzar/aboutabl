import { describe, expect, it } from 'vitest';
import { staffLoginUrl } from './staffLoginAttempt';

describe('staffLoginUrl', () => {
	it('maps staging student API host to admin login', () => {
		expect(staffLoginUrl('https://api-new.aboutabl.com/api/student')).toBe(
			'https://api-new.aboutabl.com/api/login'
		);
	});

	it('maps production student API host to admin login', () => {
		expect(staffLoginUrl('https://aboutabl.com/api/student')).toBe(
			'https://aboutabl.com/api/login'
		);
	});

	it('keeps local Vite proxy path', () => {
		expect(staffLoginUrl('/api/student')).toBe('/api/login');
	});
});
