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
import LiveSessionRewardPanel from './LiveSessionRewardPanel';
import { LivePlayRewardFeedbackProvider } from './play/LivePlayRewardFeedbackContext';
import LivePlayCoinBurst from './play/LivePlayCoinBurst';

const claimReward = vi.fn();

vi.mock('lib/liveCompetitionsStudentApi', async () => {
	const actual = await vi.importActual<typeof import('lib/liveCompetitionsStudentApi')>(
		'lib/liveCompetitionsStudentApi'
	);
	return {
		...actual,
		claimLiveCompetitionReward: (...args: unknown[]) => claimReward(...args),
	};
});

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	claimReward.mockReset();
});

function rewardView(
	overrides: Partial<LiveCompetitionCurrentView> = {}
): LiveCompetitionCurrentView {
	return {
		session_id: 55,
		status: 'playing',
		mode: 'reward',
		theme: 'gold_quest',
		score: 2,
		coins: 20,
		reward_pending: true,
		reward_type: 'chest',
		reward_options: [
			{ risk: 'safe', label: 'Safe 5', hint: 'Always 5', image: '/safe.png' },
			{ risk: 'medium', label: 'Risk 20', hint: 'Usually 20' },
		],
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
				<LiveSessionRewardPanel
					sessionId={55}
					current={current}
					onCurrent={onCurrent}
					refreshCurrent={refreshCurrent}
				/>
				<LivePlayCoinBurst themeClass="gold_quest" />
			</LivePlayRewardFeedbackProvider>
		</IntlProvider>
	);
	return { onCurrent, refreshCurrent, ...result };
}

describe('LiveSessionRewardPanel', () => {
	it('renders chest options with supplied labels, hints, and images only', () => {
		renderPanel(rewardView());
		expect(screen.getByTestId('live-comp-panel-reward').getAttribute('data-reward-type')).toBe(
			'chest'
		);
		expect(screen.getByTestId('live-comp-reward-type').textContent).toMatch(/Chest/i);
		const opts = screen.getAllByTestId('live-comp-reward-option');
		expect(opts).toHaveLength(2);
		expect(opts[0].textContent).toContain('Safe 5');
		expect(opts[0].textContent).toContain('Always 5');
		expect(screen.getByTestId('live-comp-reward-option-image').getAttribute('src')).toBe(
			'/safe.png'
		);
		expect(opts[1].textContent).toContain('Risk 20');
		expect(document.body.textContent).not.toMatch(/correct_answer|owner_id|reward_data|\breal\b/i);
	});

	it('renders fixed-trio chests with images only and hides coin amounts until claim', async () => {
		const user = userEvent.setup();
		claimReward.mockResolvedValue({
			type: 'chest',
			message: 'YOU WIN 20 Coins',
			coins_awarded: 20,
			coins: 41,
			reward_pending: false,
		});
		const refreshed: LiveCompetitionCurrentView = {
			session_id: 55,
			status: 'playing',
			mode: 'question',
			theme: 'gold_quest',
			coins: 41,
			score: 3,
		};
		const onCurrent = vi.fn();
		renderPanel(
			rewardView({
				theme: 'gold_quest',
				reward_type: 'chest',
				reward_options: [
					{ index: 0, image: '/t1.png' },
					{ index: 1, image: '/t2.png' },
					{ index: 2, image: '/t3.png' },
				],
				coins: 21,
			}),
			{ onCurrent, refreshCurrent: vi.fn(async () => refreshed) }
		);

		const opts = screen.getAllByTestId('live-comp-reward-option');
		expect(opts).toHaveLength(3);
		expect(document.body.textContent).not.toMatch(/\b(5|10|20)\b/);
		expect(screen.getAllByTestId('live-comp-reward-option-image')).toHaveLength(3);
		expect(screen.queryByTestId('live-comp-reward-submit')).toBeNull();

		await user.click(opts[0]);
		await waitFor(() => expect(claimReward).toHaveBeenCalledWith(55, { choice: 0 }));
		expect(await screen.findByTestId('live-comp-reward-coins-awarded')).toBeTruthy();
		expect(screen.getByTestId('live-comp-reward-message').textContent).toMatch(/20/);
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(expect.objectContaining({ coins: 41 }))
		);
	});

	it('renders protocol options from backend labels', () => {
		renderPanel(
			rewardView({
				theme: 'hacking',
				reward_type: 'protocol',
				reward_options: [
					{ protocol: 'gold', label: 'GOLD', hint: 'Burst of coins', image: '/g.png' },
					{ protocol: 'luck', label: 'LUCK' },
				],
			})
		);
		expect(screen.getByTestId('live-comp-panel-reward').getAttribute('data-reward-type')).toBe(
			'protocol'
		);
		expect(screen.getAllByTestId('live-comp-reward-option')).toHaveLength(2);
		expect(screen.getByText('GOLD')).toBeTruthy();
		expect(screen.getByText('LUCK')).toBeTruthy();
	});

	it('renders steal passwords and optional hints without sensitive fields', () => {
		renderPanel(
			rewardView({
				theme: 'hacking',
				reward_type: 'steal',
				reward_options: [
					{ password: 'Real1', hint: 'Re' },
					{ password: 'Fake0' },
				],
			})
		);
		expect(screen.getByTestId('live-comp-panel-reward').getAttribute('data-reward-type')).toBe(
			'steal'
		);
		const opts = screen.getAllByTestId('live-comp-reward-option');
		expect(opts).toHaveLength(2);
		expect(opts[0].getAttribute('data-password')).toBe('Real1');
		expect(opts[0].textContent).toContain('Re');
		expect(opts[1].getAttribute('data-password')).toBe('Fake0');
		expect(document.body.innerHTML).not.toMatch(/owner_id|"real"/);
	});

	it('renders gift indexed choices when the parser provides indexes', () => {
		renderPanel(
			rewardView({
				reward_type: 'gift',
				reward_options: [{ index: 0 }, { index: 1 }],
			})
		);
		expect(screen.getByTestId('live-comp-panel-reward').getAttribute('data-reward-type')).toBe(
			'gift'
		);
		expect(screen.getAllByTestId('live-comp-reward-option')).toHaveLength(2);
		expect(screen.getByText('Gift 1')).toBeTruthy();
		expect(screen.getByText('Gift 2')).toBeTruthy();
	});

	it('omits missing optional fields and does not invent choices', () => {
		renderPanel(
			rewardView({
				reward_options: [{ risk: 'safe', label: 'Safe 5' }],
			})
		);
		expect(screen.getAllByTestId('live-comp-reward-option')).toHaveLength(1);
		expect(screen.queryByTestId('live-comp-reward-option-image')).toBeNull();
		expect(screen.queryByTestId('live-comp-reward-hint')).toBeNull();
	});

	it('claims chest on icon tap without a separate Claim button', async () => {
		const user = userEvent.setup();
		let resolveClaim: ((value: unknown) => void) | null = null;
		claimReward.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveClaim = resolve;
				})
		);
		const refreshed: LiveCompetitionCurrentView = {
			session_id: 55,
			status: 'playing',
			mode: 'question',
			theme: 'gold_quest',
			score: 2,
			coins: 25,
			reward_pending: false,
		};
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(
			rewardView({
				reward_options: [
					{ index: 0, image: '/assets/images/treasure1.png' },
					{ index: 1, image: '/assets/images/treasure2.png' },
					{ index: 2, image: '/assets/images/treasure3.png' },
				],
			}),
			{ onCurrent, refreshCurrent }
		);

		expect(screen.queryByTestId('live-comp-reward-submit')).toBeNull();
		const images = screen.getAllByTestId('live-comp-reward-option-image');
		expect(images).toHaveLength(3);
		expect(images[0].getAttribute('src')).toBe('/assets/games/images/treasure1.png');

		await user.click(screen.getAllByTestId('live-comp-reward-option')[0]);

		await waitFor(() => expect(claimReward).toHaveBeenCalledTimes(1));
		expect(claimReward).toHaveBeenCalledWith(55, { choice: 0 });
		expect(
			(screen.getAllByTestId('live-comp-reward-option')[0] as HTMLButtonElement).disabled
		).toBe(true);

		await act(async () => {
			resolveClaim?.({
				type: 'chest',
				message: 'YOU WIN 5 Coins',
				coins_awarded: 5,
				coins: 25,
				reward_pending: false,
			});
		});

		expect(await screen.findByTestId('live-comp-reward-feedback')).toBeTruthy();
		expect(screen.getByTestId('live-comp-reward-message').textContent).toContain('YOU WIN 5');
		expect(screen.getByTestId('live-comp-reward-coins-awarded').textContent).toMatch(/5/);
		expect(await screen.findByTestId('live-comp-coin-burst')).toBeTruthy();
		expect(screen.getByTestId('live-comp-coin-burst').getAttribute('data-amount')).toBe('5');
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(expect.objectContaining({ coins: 25 }))
		);
		expect(claimReward).toHaveBeenCalledTimes(1);
	});

	it('claims steal with password payload only', async () => {
		const user = userEvent.setup();
		claimReward.mockResolvedValue({
			type: 'steal',
			message: 'You stole 8 coins from classmate',
			coins_awarded: 8,
			coins: 28,
			reward_pending: false,
		});
		const refreshed = rewardView({
			mode: 'question',
			reward_pending: false,
			reward_type: undefined,
			reward_options: undefined,
		});
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(
			rewardView({
				reward_type: 'steal',
				reward_options: [
					{ password: 'Fake0' },
					{ password: 'Real1', hint: 'Re' },
				],
			}),
			{ onCurrent, refreshCurrent }
		);

		const real = screen
			.getAllByTestId('live-comp-reward-option')
			.find((el) => el.getAttribute('data-password') === 'Real1');
		await user.click(real!);
		await user.click(screen.getByTestId('live-comp-reward-submit'));

		await waitFor(() => expect(claimReward).toHaveBeenCalledWith(55, { password: 'Real1' }));
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(expect.objectContaining({ coins: 28 }))
		);
	});

	it('claims protocol choice and surfaces last_protocol from the server', async () => {
		const user = userEvent.setup();
		claimReward.mockResolvedValue({
			type: 'protocol',
			message: 'LUCK protocol: +10 coins and a shield',
			coins_awarded: 10,
			coins: 30,
			reward_pending: false,
			shield: true,
			last_protocol: 'luck',
		});
		const refreshed = rewardView({ mode: 'question', reward_pending: false });
		const onCurrent = vi.fn();
		renderPanel(
			rewardView({
				reward_type: 'protocol',
				reward_options: [
					{ protocol: 'gold', label: 'GOLD' },
					{ protocol: 'luck', label: 'LUCK' },
				],
			}),
			{ onCurrent, refreshCurrent: vi.fn(async () => refreshed) }
		);

		await user.click(screen.getAllByTestId('live-comp-reward-option')[1]);
		await user.click(screen.getByTestId('live-comp-reward-submit'));

		await waitFor(() => expect(claimReward).toHaveBeenCalledWith(55, { choice: 1 }));
		expect(await screen.findByTestId('live-comp-reward-shield')).toBeTruthy();
		expect(screen.getByTestId('live-comp-reward-last-protocol').textContent).toMatch(/luck/i);
		await waitFor(() =>
			expect(onCurrent).toHaveBeenCalledWith(expect.objectContaining({ coins: 30 }))
		);
	});

	it('claims gift with indexed choice payload', async () => {
		const user = userEvent.setup();
		claimReward.mockResolvedValue({
			type: 'gift',
			message: 'You got 7 coins',
			coins_awarded: 7,
			reward_pending: false,
		});
		const refreshed = rewardView({ mode: 'done', done: true, reward_pending: false });
		const onCurrent = vi.fn();
		renderPanel(
			rewardView({
				reward_type: 'gift',
				reward_options: [{ index: 0 }, { index: 2 }],
			}),
			{ onCurrent, refreshCurrent: vi.fn(async () => refreshed) }
		);

		await user.click(screen.getAllByTestId('live-comp-reward-option')[1]);
		await user.click(screen.getByTestId('live-comp-reward-submit'));

		await waitFor(() => expect(claimReward).toHaveBeenCalledWith(55, { choice: 2 }));
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
	});

	it('handles 409 with localized error and refreshes current', async () => {
		const user = userEvent.setup();
		claimReward.mockRejectedValue(
			new LiveCompetitionApiError('Reward is not pending.', 409, '409')
		);
		const refreshed = rewardView({ mode: 'question', reward_pending: false });
		const refreshCurrent = vi.fn(async () => refreshed);
		const onCurrent = vi.fn();
		renderPanel(rewardView(), { onCurrent, refreshCurrent });

		await user.click(screen.getAllByTestId('live-comp-reward-option')[0]);

		expect(await screen.findByTestId('live-comp-reward-error')).toBeTruthy();
		expect(screen.getByTestId('live-comp-reward-error').textContent).toMatch(
			/could not be saved|try again|تعذر/i
		);
		await waitFor(() => expect(refreshCurrent).toHaveBeenCalled());
		await waitFor(() => expect(onCurrent).toHaveBeenCalledWith(refreshed));
	});

	it('ignores stale claim response after unmount', async () => {
		let resolveClaim: ((value: unknown) => void) | null = null;
		claimReward.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveClaim = resolve;
				})
		);
		const onCurrent = vi.fn();
		const refreshCurrent = vi.fn(async () => null);
		const { unmount } = render(
			<IntlProvider locale="en" messages={en as Record<string, string>}>
				<LiveSessionRewardPanel
					sessionId={55}
					current={rewardView()}
					onCurrent={onCurrent}
					refreshCurrent={refreshCurrent}
				/>
			</IntlProvider>
		);
		const user = userEvent.setup();
		await user.click(screen.getAllByTestId('live-comp-reward-option')[0]);
		await waitFor(() => expect(claimReward).toHaveBeenCalled());
		unmount();
		await act(async () => {
			resolveClaim?.({
				type: 'chest',
				message: 'ok',
				coins_awarded: 5,
				reward_pending: false,
			});
		});
		expect(onCurrent).not.toHaveBeenCalled();
		expect(refreshCurrent).not.toHaveBeenCalled();
	});

	it('prevents duplicate claim while pending', async () => {
		const user = userEvent.setup();
		let resolveClaim: ((value: unknown) => void) | null = null;
		claimReward.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveClaim = resolve;
				})
		);
		renderPanel(rewardView());
		const first = screen.getAllByTestId('live-comp-reward-option')[0] as HTMLButtonElement;
		await user.click(first);
		await waitFor(() => expect(claimReward).toHaveBeenCalledTimes(1));
		expect(first.disabled).toBe(true);
		await user.click(first);
		expect(claimReward).toHaveBeenCalledTimes(1);
		await act(async () => {
			resolveClaim?.({ type: 'chest', message: 'ok', reward_pending: false });
		});
	});
});
