import { describe, expect, it } from 'vitest';
import {
	applyProfilePanelToSearchParams,
	parseProfilePanelParam,
	readProfilePanelFromSearchParams,
} from './profilePanelRoute';

describe('profilePanelRoute', () => {
	it('defaults to progress when panel param is missing or invalid', () => {
		expect(parseProfilePanelParam(null)).toBe('progress');
		expect(parseProfilePanelParam('unknown')).toBe('progress');
	});

	it('reads assignments, edit, and password from the URL', () => {
		expect(parseProfilePanelParam('assignments')).toBe('assignments');
		expect(parseProfilePanelParam('edit')).toBe('edit');
		expect(parseProfilePanelParam('password')).toBe('password');
	});

	it('persists the active panel in search params', () => {
		const assignments = applyProfilePanelToSearchParams(new URLSearchParams(), 'assignments');
		expect(assignments.get('panel')).toBe('assignments');
		expect(readProfilePanelFromSearchParams(assignments)).toBe('assignments');

		const progress = applyProfilePanelToSearchParams(assignments, 'progress');
		expect(progress.get('panel')).toBeNull();
		expect(readProfilePanelFromSearchParams(progress)).toBe('progress');
	});
});
