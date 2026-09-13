import type { ProfilePanel } from './types';

const PROFILE_PANEL_PARAM = 'panel';

export function parseProfilePanelParam(value: string | null | undefined): ProfilePanel {
	if (value === 'assignments' || value === 'edit' || value === 'password') {
		return value;
	}

	return 'progress';
}

export function profilePanelSearchParam(panel: ProfilePanel): string | null {
	if (panel === 'progress') {
		return null;
	}

	return panel;
}

export function readProfilePanelFromSearchParams(
	searchParams: URLSearchParams
): ProfilePanel {
	return parseProfilePanelParam(searchParams.get(PROFILE_PANEL_PARAM));
}

export function applyProfilePanelToSearchParams(
	searchParams: URLSearchParams,
	panel: ProfilePanel
): URLSearchParams {
	const next = new URLSearchParams(searchParams);
	const value = profilePanelSearchParam(panel);

	if (value) {
		next.set(PROFILE_PANEL_PARAM, value);
	} else {
		next.delete(PROFILE_PANEL_PARAM);
	}

	return next;
}
