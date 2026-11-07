import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import { LiveCompetitionApiError } from 'lib/liveCompetitionsStudentApi';
import en from 'translations/EN/translation.json';
import LiveSessionPowerControl, { hasUsablePowerContract } from './LiveSessionPowerControl';

const usePower = vi.fn();

vi.mock('lib/liveCompetitionsStudentApi', async () => {
	const actual = await vi.importActual<typeof import('lib/liveCompetitionsStudentApi')>(
		'lib/liveCompetitionsStudentApi'
	);
	return {
		...actual,
		useLiveCompetitionPower: (...args: unknown[]) => usePower(...args),
	};
});

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	usePower.mockReset();
});

function questionWithPower(
	overrides: Partial<LiveCompetitionCurrentView> = {}
): LiveCompetitionCurrentView {
	return {
		session_id: 55,
		status: 'playing',
		mode: 'question',
		theme: 'hacking',
		score: 1,
		coins: 20,
		power: 'fifty_fifty',
		power_label: '50 / 50',
		power_used: false,
		live_game_session_question_id: 8,
		question: 'Q?',
		choices: ['A', 'B', 'C', 'D'],
		clock_started: true,
		seconds_left: 15,
		...overrides,
	};
}

function renderControl(
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
			<LiveSessionPowerControl
				sessionId={55}
				current={current}
				onCurrent={onCurrent}
				refreshCurrent={refreshCurrent}
			/>
		</IntlProvider>
	);
	return { onCurrent, refreshCurrent, ...result };
}

describe('hasUsablePowerContract', () => {
	it('requires a non-empty power identifier from the backend', () => {
		expect(hasUsablePowerContract(null)).toBe(false);
		expect(hasUsablePowerContract(questionWithPower({ power: null }))).toBe(false);
		expect(hasUsablePowerContract(questionWithPower({ power: '' }))).toBe(false);
		expect(hasUsablePowerContract(questionWithPower({ power: 'shield' }))).toBe(true);
	});
});

describe('LiveSessionPowerControl', () => {
	it('renders server power label and respects power_used disabled state', () => {
		renderControl(questionWithPower({ power_used: true }));
		expect(screen.getByTestId('live-comp-power-label').textContent).toContain('50 / 50');
		expect(screen.getByTestId('live-comp-power-used')).toBeTruthy();
		expect(
			(screen.getByTestId('live-comp-power-activate') as HTMLButtonElement).disabled
		).toBe(true);
	});

	it('activates with exact empty payload, shows server feedback, and refreshes current', async () => {
		const user = userEvent.setup();
		let resolvePower: ((value: unknown) => void) | null = null;
		usePower.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePower = resolve;
				})
		);
		const refreshed = questionWithPower({
			power_used: true,
			choices: ['A', 'C'],
		});
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderControl(questionWithPower(), { onCurrent, refreshCurrent });

		await user.click(screen.getByTestId('live-comp-power-activate'));
		await waitFor(() => expect(usePower).toHaveBeenCalledTimes(1));
		expect(usePower).toHaveBeenCalledWith(55);
		expect(
			(screen.getByTestId('live-comp-power-activate') as HTMLButtonElement).disabled
		).toBe(true);

		await act(async () => {
			resolvePower?.({
				power: 'fifty_fifty',
				power_label: '50 / 50',
				power_used: true,
				message: 'Power activated: 50 / 50',
			});
		});

		expect(await screen.findByTestId('live-comp-power-feedback')).toBeTruthy();
		expect(screen.getByTestId('live-comp-power-message').textContent).toContain(
			'Power activated: 50 / 50'
		);
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
		expect(usePower).toHaveBeenCalledTimes(1);
	});

	it('supports shield power feedback from the server', async () => {
		const user = userEvent.setup();
		usePower.mockResolvedValue({
			power: 'shield',
			power_label: 'Shield',
			power_used: true,
			shield: true,
			message: 'Power activated: Shield',
		});
		const refreshed = questionWithPower({
			power: 'shield',
			power_label: 'Shield',
			power_used: true,
		});
		renderControl(
			questionWithPower({ power: 'shield', power_label: 'Shield' }),
			{ refreshCurrent: vi.fn(async () => refreshed), onCurrent: vi.fn() }
		);

		await user.click(screen.getByTestId('live-comp-power-activate'));
		expect(await screen.findByTestId('live-comp-power-shield')).toBeTruthy();
		await waitFor(() => expect(usePower).toHaveBeenCalledWith(55));
	});

	it('supports freeze power identifier from the parsed contract', async () => {
		const user = userEvent.setup();
		usePower.mockResolvedValue({
			power: 'freeze',
			power_label: 'Freeze',
			power_used: true,
			message: 'Power activated: Freeze',
		});
		const onCurrent = vi.fn();
		const refreshed = questionWithPower({
			power: 'freeze',
			power_label: 'Freeze',
			power_used: true,
		});
		renderControl(questionWithPower({ power: 'freeze', power_label: 'Freeze' }), {
			onCurrent,
			refreshCurrent: vi.fn(async () => refreshed),
		});

		await user.click(screen.getByTestId('live-comp-power-activate'));
		await waitFor(() => expect(usePower).toHaveBeenCalledWith(55));
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
	});

	it('handles 409 with localized error and refreshes current', async () => {
		const user = userEvent.setup();
		usePower.mockRejectedValue(
			new LiveCompetitionApiError('Power already used this round.', 409, '409')
		);
		const refreshed = questionWithPower({ power_used: true });
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderControl(questionWithPower(), { onCurrent, refreshCurrent });

		await user.click(screen.getByTestId('live-comp-power-activate'));
		expect(await screen.findByTestId('live-comp-power-error')).toBeTruthy();
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
	});

	it('ignores stale power response after unmount', async () => {
		let resolvePower: ((value: unknown) => void) | null = null;
		usePower.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePower = resolve;
				})
		);
		const onCurrent = vi.fn();
		const refreshCurrent = vi.fn(async () => null);
		const { unmount } = render(
			<IntlProvider locale="en" messages={en as Record<string, string>}>
				<LiveSessionPowerControl
					sessionId={55}
					current={questionWithPower()}
					onCurrent={onCurrent}
					refreshCurrent={refreshCurrent}
				/>
			</IntlProvider>
		);
		const user = userEvent.setup();
		await user.click(screen.getByTestId('live-comp-power-activate'));
		await waitFor(() => expect(usePower).toHaveBeenCalled());
		unmount();
		await act(async () => {
			resolvePower?.({
				power: 'fifty_fifty',
				power_used: true,
				message: 'ok',
			});
		});
		expect(onCurrent).not.toHaveBeenCalled();
		expect(refreshCurrent).not.toHaveBeenCalled();
	});

	it('prevents duplicate power activation while pending', async () => {
		const user = userEvent.setup();
		let resolvePower: ((value: unknown) => void) | null = null;
		usePower.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePower = resolve;
				})
		);
		renderControl(questionWithPower());
		const btn = screen.getByTestId('live-comp-power-activate') as HTMLButtonElement;
		await user.click(btn);
		await waitFor(() => expect(usePower).toHaveBeenCalledTimes(1));
		expect(btn.disabled).toBe(true);
		await expect(user.click(btn)).rejects.toThrow(/pointer-events/i);
		expect(usePower).toHaveBeenCalledTimes(1);
		await act(async () => {
			resolvePower?.({ power: 'fifty_fifty', power_used: true, message: 'ok' });
		});
	});
});
