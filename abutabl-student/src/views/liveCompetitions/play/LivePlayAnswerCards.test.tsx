import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LivePlayAnswerCards from './LivePlayAnswerCards';

afterEach(() => {
	cleanup();
});

describe('LivePlayAnswerCards', () => {
	it('taps submit immediately and ignores duplicate picks while disabled', async () => {
		const user = userEvent.setup();
		const onPick = vi.fn();
		const { rerender } = render(
			<LivePlayAnswerCards
				choices={['Sun', 'Wood']}
				onPick={onPick}
				disabled={false}
			/>
		);

		await user.click(screen.getByText('Wood'));
		expect(onPick).toHaveBeenCalledTimes(1);
		expect(onPick).toHaveBeenCalledWith('Wood');

		rerender(
			<LivePlayAnswerCards
				choices={['Sun', 'Wood']}
				onPick={onPick}
				disabled
				selected="Wood"
				feedbackTone="correct"
			/>
		);
		await user.click(screen.getByText('Wood'));
		expect(onPick).toHaveBeenCalledTimes(1);
	});
});
