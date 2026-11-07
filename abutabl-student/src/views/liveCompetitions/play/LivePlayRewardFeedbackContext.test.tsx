import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
	LivePlayRewardFeedbackProvider,
	useLivePlayRewardFeedback,
} from './LivePlayRewardFeedbackContext';
import LivePlayCoinBurst from './LivePlayCoinBurst';

afterEach(() => {
	cleanup();
});

function TriggerTwice() {
	const { showReward, active } = useLivePlayRewardFeedback();
	return (
		<div>
			<button
				type="button"
				data-testid="fire-reward"
				onClick={() => showReward({ key: 'answer-8', amount: 10, celebrate: true })}
			>
				fire
			</button>
			<span data-testid="active-key">{active?.key ?? ''}</span>
			<span data-testid="active-amount">{active?.amount ?? 0}</span>
			<LivePlayCoinBurst themeClass="classic" />
		</div>
	);
}

describe('LivePlayRewardFeedbackContext', () => {
	it('shows a burst once and ignores duplicate keys (poll/rerender safe)', async () => {
		const user = userEvent.setup();
		render(
			<LivePlayRewardFeedbackProvider>
				<TriggerTwice />
			</LivePlayRewardFeedbackProvider>
		);

		await user.click(screen.getByTestId('fire-reward'));
		expect(await screen.findByTestId('live-comp-coin-burst')).toBeTruthy();
		expect(screen.getByTestId('live-comp-coin-burst').getAttribute('data-amount')).toBe('10');
		expect(screen.getByTestId('live-comp-coin-burst-badge').textContent).toMatch(/\+10/);
		expect(screen.getByTestId('live-comp-coin-burst-confetti')).toBeTruthy();

		await user.click(screen.getByTestId('fire-reward'));
		await waitFor(() => {
			expect(screen.getByTestId('active-key').textContent).toBe('answer-8');
		});
		expect(screen.getAllByTestId('live-comp-coin-burst')).toHaveLength(1);
	});
});
