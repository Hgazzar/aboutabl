import { describe, expect, it } from 'vitest';
import { resolveSubjectHeroTheme } from './subjectHeroTheme';

describe('resolveSubjectHeroTheme', () => {
	it('detects math titles', () => {
		expect(resolveSubjectHeroTheme('Math Explorer')).toBe('math');
		expect(resolveSubjectHeroTheme('Grade 2 Maths')).toBe('math');
		expect(resolveSubjectHeroTheme('رياضيات')).toBe('math');
	});

	it('detects science titles', () => {
		expect(resolveSubjectHeroTheme('Science Lab')).toBe('science');
		expect(resolveSubjectHeroTheme('Little Scientist')).toBe('science');
		expect(resolveSubjectHeroTheme('علوم')).toBe('science');
	});

	it('falls back to default', () => {
		expect(resolveSubjectHeroTheme('Letters Explorer')).toBe('default');
		expect(resolveSubjectHeroTheme('')).toBe('default');
		expect(resolveSubjectHeroTheme(null)).toBe('default');
	});
});
