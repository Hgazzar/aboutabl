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
import LiveSessionReinforcePanel from './LiveSessionReinforcePanel';
import { LivePlayRewardFeedbackProvider } from './play/LivePlayRewardFeedbackContext';
import LivePlayCoinBurst from './play/LivePlayCoinBurst';

const submitReinforce = vi.fn();

vi.mock('lib/liveCompetitionsStudentApi', async () => {
	const actual = await vi.importActual<typeof import('lib/liveCompetitionsStudentApi')>(
		'lib/liveCompetitionsStudentApi'
	);
	return {
		...actual,
		submitLiveCompetitionReinforce: (...args: unknown[]) => submitReinforce(...args),
	};
});

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	submitReinforce.mockReset();
});

function reinforceView(
	overrides: Partial<LiveCompetitionCurrentView> = {}
): LiveCompetitionCurrentView {
	return {
		session_id: 55,
		status: 'playing',
		mode: 'reinforce',
		theme: 'classic',
		score: 0,
		coins: 20,
		pending_reinforce: true,
		live_game_session_question_id: 8,
		question: 'What fuel?',
		choices: ['Sun', 'Wood'],
		answer_type: 'text',
		explanation: 'Trees burn.',
		wrong_answer: 'Sun',
		timed_out: false,
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
			<LivePlayRewardFeedbackProvider>
				<LiveSessionReinforcePanel
					sessionId={55}
					current={current}
					onCurrent={onCurrent}
					refreshCurrent={refreshCurrent}
				/>
				<LivePlayCoinBurst themeClass="classic" />
			</LivePlayRewardFeedbackProvider>
		</IntlProvider>
	);
	return { onCurrent, refreshCurrent, ...result };
}

describe('LiveSessionReinforcePanel', () => {
	it('renders reinforce payload fields from the backend', () => {
		renderPanel(
			reinforceView({
				image: '/q.png',
				voice_url: '/q.mp3',
				timed_out: true,
			})
		);

		expect(screen.getByTestId('live-comp-panel-reinforce')).toBeTruthy();
		expect(screen.getByTestId('live-comp-reinforce-question').textContent).toContain(
			'What fuel?'
		);
		expect(screen.getByTestId('live-comp-reinforce-explanation').textContent).toContain(
			'Trees burn.'
		);
		expect(screen.getByTestId('live-comp-reinforce-wrong-answer').textContent).toMatch(/Sun/);
		expect(screen.getByTestId('live-comp-reinforce-timed-out')).toBeTruthy();
		expect(screen.getAllByTestId('live-comp-reinforce-choice')).toHaveLength(2);
		expect(screen.getByTestId('live-comp-reinforce-image').getAttribute('src')).toBe('/q.png');
		expect(screen.getByTestId('live-comp-reinforce-audio').getAttribute('data-src')).toBe(
			'/q.mp3'
		);
	});

	it('omits optional explanation and previous answer when absent', () => {
		renderPanel(
			reinforceView({
				explanation: null,
				wrong_answer: null,
				timed_out: false,
				choices: ['Wood', 'Rocks'],
			})
		);

		expect(screen.queryByTestId('live-comp-reinforce-explanation')).toBeNull();
		expect(screen.queryByTestId('live-comp-reinforce-wrong-answer')).toBeNull();
		expect(screen.queryByTestId('live-comp-reinforce-timed-out')).toBeNull();
		expect(screen.getAllByTestId('live-comp-reinforce-choice')).toHaveLength(2);
	});

	it('submits once with the exact backend payload and shows server feedback', async () => {
		const user = userEvent.setup();
		let resolveSubmit: ((value: unknown) => void) | null = null;
		submitReinforce.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveSubmit = resolve;
				})
		);
		const refreshed = reinforceView({
			mode: 'question',
			pending_reinforce: false,
			clock_started: false,
			seconds_left: 20,
			choices: ['Sun', 'Wood', 'Rocks', 'Leaves'],
			explanation: undefined,
			wrong_answer: undefined,
		});
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(reinforceView(), { onCurrent, refreshCurrent });

		const wood = screen
			.getAllByTestId('live-comp-reinforce-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		expect(wood).toBeTruthy();
		await user.click(wood!);

		await waitFor(() => expect(submitReinforce).toHaveBeenCalledTimes(1));
		expect(submitReinforce).toHaveBeenCalledWith(55, 'Wood');
		expect(screen.queryByTestId('live-comp-reinforce-submit')).toBeNull();
		for (const choice of screen.getAllByTestId('live-comp-reinforce-choice')) {
			expect((choice as HTMLButtonElement).disabled).toBe(true);
		}

		await act(async () => {
			resolveSubmit?.({
				live_game_session_question_id: 8,
				answer: 'Wood',
				correct: true,
				coins_awarded: 3,
				coins: 23,
				pending_reinforce: false,
			});
		});

		expect(await screen.findByTestId('live-comp-reinforce-feedback')).toBeTruthy();
		expect(screen.getByText('Locked in.')).toBeTruthy();
		expect(screen.getByTestId('live-comp-reinforce-coins-awarded').textContent).toMatch(/3/);
		expect(await screen.findByTestId('live-comp-coin-burst')).toBeTruthy();
		expect(screen.getByTestId('live-comp-coin-burst').getAttribute('data-amount')).toBe('3');
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith({ ...refreshed, coins: 23 })
		);
		expect(submitReinforce).toHaveBeenCalledTimes(1);
	});

	it('shows wrong lock-in feedback from the server without inventing correctness rules', async () => {
		const user = userEvent.setup();
		submitReinforce.mockResolvedValue({
			live_game_session_question_id: 8,
			answer: 'Sun',
			correct: false,
			coins_awarded: 0,
			coins: 20,
			pending_reinforce: false,
		});
		const refreshed = reinforceView({
			mode: 'question',
			pending_reinforce: false,
			is_retry: false,
		});
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(reinforceView(), { onCurrent, refreshCurrent });

		const sun = screen
			.getAllByTestId('live-comp-reinforce-choice')
			.find((el) => el.getAttribute('data-choice') === 'Sun');
		await user.click(sun!);

		expect(await screen.findByText('Not locked in.')).toBeTruthy();
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith({ ...refreshed, coins: 20 })
		);
		expect(screen.queryByTestId('live-comp-coin-burst')).toBeNull();
	});

	it('handles retry transition when refresh returns a queued retry question', async () => {
		const user = userEvent.setup();
		submitReinforce.mockResolvedValue({
			live_game_session_question_id: 8,
			answer: 'Wood',
			correct: true,
			coins_awarded: 3,
			pending_reinforce: false,
		});
		const retryQuestion = reinforceView({
			mode: 'question',
			pending_reinforce: false,
			live_game_session_question_id: 8,
			is_retry: true,
			clock_started: false,
			seconds_left: 20,
			choices: ['Sun', 'Wood', 'Rocks', 'Leaves'],
			explanation: undefined,
			wrong_answer: undefined,
		});
		const refreshCurrent = vi.fn(async () => retryQuestion);
		const onCurrent = vi.fn();
		renderPanel(reinforceView(), { onCurrent, refreshCurrent });

		const wood = screen
			.getAllByTestId('live-comp-reinforce-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);

		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(
				expect.objectContaining({ mode: 'question', is_retry: true })
			)
		);
	});

	it('handles 409 by showing localized error and refreshing current', async () => {
		const user = userEvent.setup();
		submitReinforce.mockRejectedValue(
			new LiveCompetitionApiError('No pending lock-in.', 409, '409')
		);
		const refreshed = reinforceView({ mode: 'question', pending_reinforce: false });
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(reinforceView(), { onCurrent, refreshCurrent });

		const wood = screen
			.getAllByTestId('live-comp-reinforce-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);

		expect(await screen.findByTestId('live-comp-reinforce-error')).toBeTruthy();
		expect(screen.getByTestId('live-comp-reinforce-error').textContent).toMatch(
			/could not be saved|try again|تعذر/i
		);
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
	});

	it('ignores stale reinforce response after unmount', async () => {
		let resolveSubmit: ((value: unknown) => void) | null = null;
		submitReinforce.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveSubmit = resolve;
				})
		);
		const onCurrent = vi.fn();
		const refreshCurrent = vi.fn(async () => null);
		const { unmount } = render(
			<IntlProvider locale="en" messages={en as Record<string, string>}>
				<LiveSessionReinforcePanel
					sessionId={55}
					current={reinforceView()}
					onCurrent={onCurrent}
					refreshCurrent={refreshCurrent}
				/>
			</IntlProvider>
		);

		const user = userEvent.setup();
		const wood = screen
			.getAllByTestId('live-comp-reinforce-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);
		await waitFor(() => expect(submitReinforce).toHaveBeenCalled());

		unmount();
		await act(async () => {
			resolveSubmit?.({
				live_game_session_question_id: 8,
				answer: 'Wood',
				correct: true,
				coins_awarded: 3,
				pending_reinforce: false,
			});
		});
		expect(onCurrent).not.toHaveBeenCalled();
		expect(refreshCurrent).not.toHaveBeenCalled();
	});

	it('prevents a second submission while the first is pending', async () => {
		const user = userEvent.setup();
		let resolveSubmit: ((value: unknown) => void) | null = null;
		submitReinforce.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveSubmit = resolve;
				})
		);
		renderPanel(reinforceView());

		const wood = screen
			.getAllByTestId('live-comp-reinforce-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);
		await waitFor(() => expect(submitReinforce).toHaveBeenCalledTimes(1));
		for (const choice of screen.getAllByTestId('live-comp-reinforce-choice')) {
			expect((choice as HTMLButtonElement).disabled).toBe(true);
		}
		await user.click(wood!);
		expect(submitReinforce).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveSubmit?.({
				live_game_session_question_id: 8,
				answer: 'Wood',
				correct: true,
				pending_reinforce: false,
			});
		});
	});
});
