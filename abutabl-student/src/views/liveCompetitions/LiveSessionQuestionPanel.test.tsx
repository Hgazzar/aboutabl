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
import LiveSessionQuestionPanel, {
	LIVE_SESSION_QUESTION_RESYNC_MS,
} from './LiveSessionQuestionPanel';
import { LivePlayRewardFeedbackProvider } from './play/LivePlayRewardFeedbackContext';
import LivePlayCoinBurst from './play/LivePlayCoinBurst';

const startClock = vi.fn();
const submitAnswer = vi.fn();
const submitTimeout = vi.fn();
const fetchCurrent = vi.fn();

vi.mock('lib/liveCompetitionsStudentApi', async () => {
	const actual = await vi.importActual<typeof import('lib/liveCompetitionsStudentApi')>(
		'lib/liveCompetitionsStudentApi'
	);
	return {
		...actual,
		startLiveCompetitionQuestionClock: (...args: unknown[]) => startClock(...args),
		submitLiveCompetitionAnswer: (...args: unknown[]) => submitAnswer(...args),
		submitLiveCompetitionTimeout: (...args: unknown[]) => submitTimeout(...args),
		fetchLiveCompetitionCurrent: (...args: unknown[]) => fetchCurrent(...args),
	};
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

beforeEach(() => {
	startClock.mockReset();
	submitAnswer.mockReset();
	submitTimeout.mockReset();
	fetchCurrent.mockReset();
	fetchCurrent.mockResolvedValue(null);
});

function questionView(
	overrides: Partial<LiveCompetitionCurrentView> = {}
): LiveCompetitionCurrentView {
	return {
		session_id: 55,
		status: 'playing',
		mode: 'question',
		theme: 'classic',
		score: 1,
		coins: 20,
		live_game_session_question_id: 8,
		question: 'What fuel?',
		choices: ['Sun', 'Wood', 'Rocks'],
		answer_type: 'text',
		clock_started: false,
		question_seconds: 20,
		seconds_left: 20,
		is_retry: false,
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
				<LiveSessionQuestionPanel
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

describe('LiveSessionQuestionPanel', () => {
	it('renders question text, choices, image, and audio', async () => {
		startClock.mockResolvedValue(
			questionView({
				clock_started: true,
				seconds_left: 15,
				image: '/q.png',
				voice_url: '/q.mp3',
			})
		);
		renderPanel(
			questionView({
				image: '/q.png',
				voice_url: '/q.mp3',
			})
		);

		expect(screen.getByTestId('live-comp-question-text').textContent).toContain('What fuel?');
		expect(screen.getAllByTestId('live-comp-question-choice')).toHaveLength(3);
		expect(screen.getByTestId('live-comp-question-image').getAttribute('src')).toBe('/q.png');
		expect(screen.getByTestId('live-comp-question-audio').getAttribute('data-src')).toBe(
			'/q.mp3'
		);
		await waitFor(() => expect(startClock).toHaveBeenCalledTimes(1));
	});

	it('normalizes catalog storage image paths for display', async () => {
		renderPanel(
			questionView({
				clock_started: true,
				seconds_left: 15,
				image: 'storage/files_maanger/monkey.png',
			})
		);
		expect(screen.getByTestId('live-comp-question-image').getAttribute('src')).toBe(
			'/storage/files_maanger/monkey.png'
		);
	});

	it('starts the clock once for an active question', async () => {
		startClock.mockResolvedValue(questionView({ clock_started: true, seconds_left: 18 }));
		const { onCurrent } = renderPanel(questionView({ clock_started: false }));
		await waitFor(() => expect(startClock).toHaveBeenCalledTimes(1));
		expect(startClock).toHaveBeenCalledWith(55);
		await waitFor(() => expect(onCurrent).toHaveBeenCalled());
		expect(startClock).toHaveBeenCalledTimes(1);
	});

	it('does not start clock again when already started', async () => {
		renderPanel(questionView({ clock_started: true, seconds_left: 12 }));
		await act(async () => {
			await Promise.resolve();
		});
		expect(startClock).not.toHaveBeenCalled();
		expect(screen.getByTestId('live-comp-question-timer').textContent).toMatch(/12/);
	});

	it('uses server-provided seconds_left for the timer display', async () => {
		startClock.mockResolvedValue(questionView({ clock_started: true, seconds_left: 9 }));
		renderPanel(questionView({ clock_started: false, seconds_left: 20 }));
		await waitFor(() =>
			expect(screen.getByTestId('live-comp-question-timer').textContent).toMatch(/9/)
		);
	});

	it('submits one answer, disables choices while pending, and shows server feedback', async () => {
		const user = userEvent.setup();
		let resolveAnswer: ((value: unknown) => void) | null = null;
		submitAnswer.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveAnswer = resolve;
				})
		);
		const nextMode = questionView({
			mode: 'reinforce',
			clock_started: false,
			pending_reinforce: true,
			score: 2,
		});
		fetchCurrent.mockResolvedValue(nextMode);
		const onCurrent = vi.fn();
		renderPanel(questionView({ clock_started: true, seconds_left: 15 }), {
			onCurrent,
		});

		const wood = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		expect(wood).toBeTruthy();
		await user.click(wood!);

		await waitFor(() => expect(submitAnswer).toHaveBeenCalledTimes(1));
		expect(submitAnswer).toHaveBeenCalledWith(55, 8, 'Wood');
		expect(screen.queryByTestId('live-comp-question-submit')).toBeNull();
		for (const choice of screen.getAllByTestId('live-comp-question-choice')) {
			expect((choice as HTMLButtonElement).disabled).toBe(true);
		}

		await act(async () => {
			resolveAnswer?.({
				session_id: 55,
				live_game_session_question_id: 8,
				answer: 'Wood',
				correct: true,
				timed_out: false,
				explanation: 'Trees burn.',
				score: 2,
			});
		});

		await waitFor(() => expect(fetchCurrent).toHaveBeenCalled());
		expect(await screen.findByTestId('live-comp-question-feedback')).toBeTruthy();
		expect(screen.getByTestId('live-comp-question-feedback').getAttribute('data-feedback')).toBe(
			'correct'
		);
		expect(screen.getByTestId('live-comp-question-explanation').textContent).toContain(
			'Trees burn.'
		);
		expect(screen.queryByTestId('live-comp-question-correct-answer')).toBeNull();
		// HUD patch only — do not advance mode until Continue.
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: 'question',
					live_game_session_question_id: 8,
					score: 2,
				})
			)
		);
		await user.click(screen.getByTestId('live-comp-question-continue'));
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: 'reinforce',
					pending_reinforce: true,
					score: 2,
				})
			)
		);
		expect(submitAnswer).toHaveBeenCalledTimes(1);
	});

	it('shows correct answer and explanation after an incorrect submission', async () => {
		const user = userEvent.setup();
		submitAnswer.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Sun',
			correct: false,
			timed_out: false,
			correct_answer: 'Wood',
			explanation: 'Trees burn.',
			score: 1,
			coins: 20,
			pending_reinforce: true,
		});
		fetchCurrent.mockResolvedValue(
			questionView({ mode: 'reinforce', pending_reinforce: true, coins: 20 })
		);
		renderPanel(questionView({ clock_started: true, seconds_left: 15, coins: 20 }));

		const sun = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Sun');
		await user.click(sun!);

		expect(await screen.findByTestId('live-comp-question-feedback')).toBeTruthy();
		expect(screen.getByTestId('live-comp-question-feedback').getAttribute('data-feedback')).toBe(
			'incorrect'
		);
		expect(screen.getByTestId('live-comp-question-correct-answer').textContent).toMatch(/Wood/);
		expect(screen.getByTestId('live-comp-question-explanation').textContent).toContain(
			'Trees burn.'
		);
		// Choices replaced by feedback — no pre-submit leak of the correct answer in the choice list.
		expect(screen.queryAllByTestId('live-comp-question-choice')).toHaveLength(0);
	});

	it('omits fabricated explanation text when the server sends none', async () => {
		const user = userEvent.setup();
		submitAnswer.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Sun',
			correct: false,
			timed_out: false,
			correct_answer: 'Wood',
			explanation: null,
			score: 1,
			coins: 20,
		});
		fetchCurrent.mockResolvedValue(questionView({ mode: 'reinforce', pending_reinforce: true }));
		renderPanel(questionView({ clock_started: true, seconds_left: 15 }));

		const sun = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Sun');
		await user.click(sun!);

		expect(await screen.findByTestId('live-comp-question-feedback')).toBeTruthy();
		expect(screen.getByTestId('live-comp-question-correct-answer')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-question-explanation')).toBeNull();
	});

	it('does not expose correct_answer before submission', () => {
		renderPanel(questionView({ clock_started: true, seconds_left: 15 }));
		expect(screen.queryByTestId('live-comp-question-feedback')).toBeNull();
		expect(screen.queryByTestId('live-comp-question-correct-answer')).toBeNull();
		expect(screen.queryByTestId('live-comp-question-explanation')).toBeNull();
		expect(document.body.textContent).not.toMatch(/Correct answer:/i);
	});

	it('keeps answer feedback until Continue even if next mode is already reward', async () => {
		const user = userEvent.setup();
		const setAnswerFeedbackHold = vi.fn();
		submitAnswer.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Wood',
			correct: true,
			timed_out: false,
			explanation: 'Trees burn slowly — take your time reading this.',
			score: 1,
			coins: 21,
			coins_awarded: 1,
		});
		fetchCurrent.mockResolvedValue(
			questionView({
				theme: 'gold_quest',
				mode: 'reward',
				reward_pending: true,
				reward_type: 'chest',
				score: 1,
				coins: 21,
			})
		);
		const onCurrent = vi.fn();
		render(
			<IntlProvider locale="en" messages={en as Record<string, string>}>
				<LivePlayRewardFeedbackProvider>
					<LiveSessionQuestionPanel
						sessionId={55}
						current={questionView({
							theme: 'gold_quest',
							clock_started: true,
							seconds_left: 15,
							coins: 20,
						})}
						onCurrent={onCurrent}
						refreshCurrent={vi.fn(async () => null)}
						setAnswerFeedbackHold={setAnswerFeedbackHold}
					/>
				</LivePlayRewardFeedbackProvider>
			</IntlProvider>
		);

		const wood = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);

		expect(await screen.findByTestId('live-comp-question-feedback')).toBeTruthy();
		expect(screen.getByTestId('live-comp-question-explanation').textContent).toMatch(
			/Trees burn/
		);
		await waitFor(() => expect(setAnswerFeedbackHold).toHaveBeenCalledWith(true));
		expect(onCurrent).toHaveBeenCalledWith(
			expect.objectContaining({ mode: 'question', coins: 21 })
		);

		await user.click(screen.getByTestId('live-comp-question-continue'));
		await waitFor(() => expect(setAnswerFeedbackHold).toHaveBeenCalledWith(false));
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(
				expect.objectContaining({ mode: 'reward', reward_pending: true })
			)
		);
	});

	it('applies host End immediately instead of holding question feedback', async () => {
		const user = userEvent.setup();
		submitAnswer.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Wood',
			correct: true,
			timed_out: false,
			score: 1,
			coins: 21,
			coins_awarded: 1,
		});
		fetchCurrent.mockResolvedValue({
			session_id: 55,
			status: 'ended',
			mode: 'done',
			done: true,
			theme: 'gold_quest',
			score: 1,
			coins: 21,
			rank: 1,
		});
		const onCurrent = vi.fn();
		renderPanel(
			questionView({
				theme: 'gold_quest',
				clock_started: true,
				seconds_left: 15,
				coins: 20,
			}),
			{ onCurrent }
		);

		const wood = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);

		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(
				expect.objectContaining({ status: 'ended', mode: 'done' })
			)
		);
		expect(screen.queryByTestId('live-comp-question-feedback')).toBeNull();
		expect(screen.queryByTestId('live-comp-question-continue')).toBeNull();
	});

	it('handles 409 by showing localized error and refreshing current', async () => {
		const user = userEvent.setup();
		submitAnswer.mockRejectedValue(
			new LiveCompetitionApiError('Answer is not accepted.', 409, '409')
		);
		const refreshed = questionView({ clock_started: true, seconds_left: 10 });
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(questionView({ clock_started: true, seconds_left: 15 }), {
			onCurrent,
			refreshCurrent,
		});

		const wood = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);

		expect(await screen.findByTestId('live-comp-question-error')).toBeTruthy();
		expect(screen.getByTestId('live-comp-question-error').textContent).toMatch(
			/could not be saved|try again|تعذر/i
		);
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
	});

	it('confirms with server before timeout and sends timeout once', async () => {
		submitTimeout.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Sun',
			correct: false,
			timed_out: true,
			correct_answer: 'Wood',
			score: 1,
		});
		const refreshCurrent = vi
			.fn()
			.mockResolvedValue(questionView({ clock_started: true, seconds_left: 0 }));
		fetchCurrent.mockResolvedValue(
			questionView({ mode: 'reinforce', pending_reinforce: true })
		);
		const onCurrent = vi.fn();

		renderPanel(questionView({ clock_started: true, seconds_left: 0 }), {
			onCurrent,
			refreshCurrent,
		});

		await waitFor(() => expect(submitTimeout).toHaveBeenCalledTimes(1));
		expect(submitTimeout).toHaveBeenCalledWith(55, 8);
		expect(await screen.findByTestId('live-comp-question-feedback')).toBeTruthy();
		expect(screen.getByTestId('live-comp-question-feedback').getAttribute('data-feedback')).toBe(
			'timeout'
		);
		expect(screen.getByTestId('live-comp-question-correct-answer').textContent).toMatch(/Wood/);
		expect(submitTimeout).toHaveBeenCalledTimes(1);
	});

	it('shows +10 coin burst only after classic correct confirmation', async () => {
		const user = userEvent.setup();
		submitAnswer.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Wood',
			correct: true,
			timed_out: false,
			score: 2,
			coins: 30,
			coins_awarded: 10,
		});
		fetchCurrent.mockResolvedValue(
			questionView({
				clock_started: true,
				seconds_left: 12,
				score: 2,
				coins: 30,
			})
		);
		const onCurrent = vi.fn();
		renderPanel(questionView({ clock_started: true, seconds_left: 15, coins: 20 }), {
			onCurrent,
		});

		const wood = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);

		expect(await screen.findByTestId('live-comp-coin-burst')).toBeTruthy();
		expect(screen.getByTestId('live-comp-coin-burst').getAttribute('data-amount')).toBe('10');
		expect(screen.getByTestId('live-comp-coin-burst-confetti')).toBeTruthy();
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(expect.objectContaining({ coins: 30 }))
		);
	});

	it('does not show coin burst for classic incorrect answers', async () => {
		const user = userEvent.setup();
		submitAnswer.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Sun',
			correct: false,
			timed_out: false,
			score: 1,
			coins: 20,
			coins_awarded: 0,
			pending_reinforce: true,
		});
		fetchCurrent.mockResolvedValue(
			questionView({ mode: 'reinforce', pending_reinforce: true, coins: 20 })
		);
		renderPanel(questionView({ clock_started: true, seconds_left: 15, coins: 20 }));

		const sun = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Sun');
		await user.click(sun!);

		await waitFor(() => expect(submitAnswer).toHaveBeenCalled());
		expect(await screen.findByTestId('live-comp-question-feedback')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-coin-burst')).toBeNull();
	});

	it('shows +1 gold quest coin burst from authoritative session balance', async () => {
		const user = userEvent.setup();
		submitAnswer.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Wood',
			correct: true,
			timed_out: false,
			score: 1,
			coins: 21,
			coins_awarded: 1,
			reward_pending: false,
		});
		fetchCurrent.mockResolvedValue(
			questionView({
				theme: 'gold_quest',
				clock_started: true,
				seconds_left: 12,
				score: 1,
				coins: 21,
			})
		);
		renderPanel(
			questionView({
				theme: 'gold_quest',
				clock_started: true,
				seconds_left: 15,
				coins: 20,
			})
		);

		const wood = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);

		expect(await screen.findByTestId('live-comp-coin-burst')).toBeTruthy();
		expect(screen.getByTestId('live-comp-coin-burst').getAttribute('data-amount')).toBe('1');
		expect(screen.queryByTestId('live-comp-coin-burst-confetti')).toBeNull();
	});

	it('does not show answer coin burst for gold quest when coins are unchanged', async () => {
		const user = userEvent.setup();
		submitAnswer.mockResolvedValue({
			session_id: 55,
			live_game_session_question_id: 8,
			answer: 'Wood',
			correct: true,
			timed_out: false,
			score: 2,
			coins: 20,
			coins_awarded: 0,
			reward_pending: true,
		});
		fetchCurrent.mockResolvedValue(
			questionView({
				theme: 'gold_quest',
				mode: 'reward',
				reward_pending: true,
				coins: 20,
			})
		);
		renderPanel(
			questionView({
				theme: 'gold_quest',
				clock_started: true,
				seconds_left: 15,
				coins: 20,
			})
		);

		const wood = screen
			.getAllByTestId('live-comp-question-choice')
			.find((el) => el.getAttribute('data-choice') === 'Wood');
		await user.click(wood!);

		await waitFor(() => expect(submitAnswer).toHaveBeenCalled());
		expect(screen.queryByTestId('live-comp-coin-burst')).toBeNull();
	});

	it('does not timeout when server still has time after local zero', async () => {
		const refreshCurrent = vi
			.fn()
			.mockResolvedValue(questionView({ clock_started: true, seconds_left: 4 }));
		renderPanel(questionView({ clock_started: true, seconds_left: 0 }), {
			refreshCurrent,
		});

		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		expect(submitTimeout).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(screen.getByTestId('live-comp-question-timer').textContent).toMatch(/4/)
		);
	});

	it('ignores stale clock response after unmount', async () => {
		let resolveClock: ((value: unknown) => void) | null = null;
		startClock.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveClock = resolve;
				})
		);
		const onCurrent = vi.fn();
		const { unmount } = render(
			<IntlProvider locale="en" messages={en as Record<string, string>}>
				<LiveSessionQuestionPanel
					sessionId={55}
					current={questionView({ clock_started: false })}
					onCurrent={onCurrent}
					refreshCurrent={vi.fn(async () => null)}
				/>
			</IntlProvider>
		);
		await waitFor(() => expect(startClock).toHaveBeenCalled());
		unmount();
		await act(async () => {
			resolveClock?.(questionView({ clock_started: true, seconds_left: 11 }));
		});
		expect(onCurrent).not.toHaveBeenCalled();
	});

	it('does not overlap soft resync while a refresh is in flight', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		let resolveRefresh: ((value: LiveCompetitionCurrentView | null) => void) | null = null;
		const refreshCurrent = vi.fn(
			() =>
				new Promise<LiveCompetitionCurrentView | null>((resolve) => {
					resolveRefresh = resolve;
				})
		);
		renderPanel(questionView({ clock_started: true, seconds_left: 20 }), {
			refreshCurrent,
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(LIVE_SESSION_QUESTION_RESYNC_MS);
		});
		expect(refreshCurrent).toHaveBeenCalledTimes(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(LIVE_SESSION_QUESTION_RESYNC_MS);
		});
		// Soft resync skips while prior refresh is still in flight.
		expect(refreshCurrent).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveRefresh?.(questionView({ clock_started: true, seconds_left: 17 }));
			await Promise.resolve();
		});
		expect(submitTimeout).not.toHaveBeenCalled();
	});
});
