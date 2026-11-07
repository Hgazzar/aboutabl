import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
vi.mock('views/learn/styles', () => ({
	CardWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardsWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import { LiveCompetitionApiError } from 'lib/liveCompetitionsStudentApi';
import en from 'translations/EN/translation.json';
import LiveSessionPasswordPanel from './LiveSessionPasswordPanel';

const pickPassword = vi.fn();

vi.mock('lib/liveCompetitionsStudentApi', async () => {
	const actual = await vi.importActual<typeof import('lib/liveCompetitionsStudentApi')>(
		'lib/liveCompetitionsStudentApi'
	);
	return {
		...actual,
		pickLiveCompetitionPassword: (...args: unknown[]) => pickPassword(...args),
	};
});

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	pickPassword.mockReset();
});

function passwordView(
	overrides: Partial<LiveCompetitionCurrentView> = {}
): LiveCompetitionCurrentView {
	return {
		session_id: 55,
		status: 'playing',
		mode: 'need_password',
		theme: 'hacking',
		score: 0,
		coins: 20,
		password_options: ['Aa11', 'Bb22', 'Cc33'],
		has_password: false,
		...overrides,
	};
}

function renderPanel(
	current: LiveCompetitionCurrentView,
	opts?: {
		onCurrent?: (next: LiveCompetitionCurrentView) => void;
		refreshCurrent?: () => Promise<LiveCompetitionCurrentView | null>;
	}
) {
	const onCurrent = opts?.onCurrent ?? vi.fn();
	const refreshCurrent = opts?.refreshCurrent ?? vi.fn(async () => null);
	const result = render(
		<IntlProvider locale="en" messages={en as Record<string, string>}>
			<LiveSessionPasswordPanel
				sessionId={55}
				current={current}
				onCurrent={onCurrent}
				refreshCurrent={refreshCurrent}
			/>
		</IntlProvider>
	);
	return { onCurrent, refreshCurrent, ...result };
}

describe('LiveSessionPasswordPanel', () => {
	it('renders only supplied password options', () => {
		renderPanel(passwordView());
		const opts = screen.getAllByTestId('live-comp-password-option');
		expect(opts).toHaveLength(3);
		expect(opts.map((el) => el.getAttribute('data-option'))).toEqual([
			'Aa11',
			'Bb22',
			'Cc33',
		]);
		expect(document.body.textContent).not.toMatch(/correct_answer|owner_id|reward_data/i);
	});

	it('submits exact pickLiveCompetitionPassword payload once and refreshes mode', async () => {
		const user = userEvent.setup();
		let resolvePick: ((value: unknown) => void) | null = null;
		pickPassword.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePick = resolve;
				})
		);
		const refreshed: LiveCompetitionCurrentView = {
			session_id: 55,
			status: 'playing',
			mode: 'question',
			theme: 'hacking',
			has_password: true,
			score: 0,
			coins: 20,
			live_game_session_question_id: 8,
			question: 'Q?',
			choices: ['A', 'B'],
			clock_started: false,
		};
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(passwordView(), { onCurrent, refreshCurrent });

		await user.click(screen.getAllByTestId('live-comp-password-option')[1]);
		await user.click(screen.getByTestId('live-comp-password-submit'));

		await waitFor(() => expect(pickPassword).toHaveBeenCalledTimes(1));
		expect(pickPassword).toHaveBeenCalledWith(55, 'Bb22');
		expect(
			(screen.getByTestId('live-comp-password-submit') as HTMLButtonElement).disabled
		).toBe(true);

		await act(async () => {
			resolvePick?.({
				has_password: true,
				password_options: ['Aa11', 'Bb22', 'Cc33'],
				already_selected: false,
			});
		});

		expect(await screen.findByTestId('live-comp-password-feedback')).toBeTruthy();
		expect(screen.getByText('Password set.')).toBeTruthy();
		// Feedback must not echo the selected password as a secret reveal.
		expect(screen.getByTestId('live-comp-password-feedback').textContent).not.toContain('Bb22');
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
		expect(pickPassword).toHaveBeenCalledTimes(1);
	});

	it('shows already_selected feedback from the server', async () => {
		const user = userEvent.setup();
		pickPassword.mockResolvedValue({
			has_password: true,
			already_selected: true,
			password_options: ['Aa11', 'Bb22'],
		});
		const refreshed = passwordView({ mode: 'question', has_password: true });
		const onCurrent = vi.fn();
		renderPanel(passwordView({ password_options: ['Aa11', 'Bb22'] }), {
			onCurrent,
			refreshCurrent: vi.fn(async () => refreshed),
		});

		await user.click(screen.getAllByTestId('live-comp-password-option')[0]);
		await user.click(screen.getByTestId('live-comp-password-submit'));

		expect(await screen.findByText('Password already set.')).toBeTruthy();
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
	});

	it('handles 409 with localized error and refreshes current', async () => {
		const user = userEvent.setup();
		pickPassword.mockRejectedValue(
			new LiveCompetitionApiError('Competition is not active.', 409, '409')
		);
		const refreshed = passwordView({ mode: 'question', has_password: true });
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(passwordView(), { onCurrent, refreshCurrent });

		await user.click(screen.getAllByTestId('live-comp-password-option')[0]);
		await user.click(screen.getByTestId('live-comp-password-submit'));

		expect(await screen.findByTestId('live-comp-password-error')).toBeTruthy();
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
	});

	it('ignores stale password response after unmount', async () => {
		let resolvePick: ((value: unknown) => void) | null = null;
		pickPassword.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePick = resolve;
				})
		);
		const onCurrent = vi.fn();
		const refreshCurrent = vi.fn(async () => null);
		const { unmount } = render(
			<IntlProvider locale="en" messages={en as Record<string, string>}>
				<LiveSessionPasswordPanel
					sessionId={55}
					current={passwordView()}
					onCurrent={onCurrent}
					refreshCurrent={refreshCurrent}
				/>
			</IntlProvider>
		);
		const user = userEvent.setup();
		await user.click(screen.getAllByTestId('live-comp-password-option')[0]);
		await user.click(screen.getByTestId('live-comp-password-submit'));
		await waitFor(() => expect(pickPassword).toHaveBeenCalled());
		unmount();
		await act(async () => {
			resolvePick?.({ has_password: true, already_selected: false });
		});
		expect(onCurrent).not.toHaveBeenCalled();
		expect(refreshCurrent).not.toHaveBeenCalled();
	});

	it('prevents duplicate password submit while pending', async () => {
		const user = userEvent.setup();
		let resolvePick: ((value: unknown) => void) | null = null;
		pickPassword.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePick = resolve;
				})
		);
		renderPanel(passwordView());
		await user.click(screen.getAllByTestId('live-comp-password-option')[0]);
		const submit = screen.getByTestId('live-comp-password-submit') as HTMLButtonElement;
		await user.click(submit);
		await waitFor(() => expect(pickPassword).toHaveBeenCalledTimes(1));
		expect(submit.disabled).toBe(true);
		await user.click(submit);
		expect(pickPassword).toHaveBeenCalledTimes(1);
		await act(async () => {
			resolvePick?.({ has_password: true, already_selected: false });
		});
	});
});
