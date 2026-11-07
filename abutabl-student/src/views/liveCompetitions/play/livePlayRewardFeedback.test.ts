import { describe, expect, it } from 'vitest';
import {
	burstFromAnswerConfirmation,
	burstFromClaimConfirmation,
	burstFromReinforceConfirmation,
	sessionCoinDelta,
} from './livePlayRewardFeedback';

describe('livePlayRewardFeedback', () => {
	it('computes only positive session coin deltas from confirmed balances', () => {
		expect(sessionCoinDelta(20, 30)).toBe(10);
		expect(sessionCoinDelta(20, 20)).toBe(0);
		expect(sessionCoinDelta(20, 15)).toBe(0);
		expect(sessionCoinDelta(undefined, 30)).toBe(0);
	});

	it('classic correct answer with +10 confirmed balance shows celebrate burst', () => {
		expect(
			burstFromAnswerConfirmation({
				questionId: 8,
				correct: true,
				timedOut: false,
				previousCoins: 20,
				confirmedCoins: 30,
				celebrate: true,
			})
		).toEqual({ key: 'answer-8', amount: 10, celebrate: true });
	});

	it('classic incorrect answer shows no coin reward', () => {
		expect(
			burstFromAnswerConfirmation({
				questionId: 8,
				correct: false,
				timedOut: false,
				previousCoins: 20,
				confirmedCoins: 20,
				celebrate: true,
			})
		).toBeNull();
	});

	it('gold quest / hacking correct with pending reward (0 delta) shows no answer burst', () => {
		expect(
			burstFromAnswerConfirmation({
				questionId: 9,
				correct: true,
				timedOut: false,
				previousCoins: 20,
				confirmedCoins: 20,
				celebrate: false,
			})
		).toBeNull();
	});

	it('reinforce success shows +3 from coins_awarded', () => {
		expect(
			burstFromReinforceConfirmation({
				questionId: 8,
				coinsAwarded: 3,
			})
		).toEqual({ key: 'reinforce-8', amount: 3, celebrate: false });
		expect(
			burstFromReinforceConfirmation({
				questionId: 8,
				coinsAwarded: 0,
			})
		).toBeNull();
	});

	it('claim confirmation shows burst only for positive coins_awarded', () => {
		expect(
			burstFromClaimConfirmation({
				claimKey: '55-chest-0',
				coinsAwarded: 5,
			})
		).toEqual({ key: 'claim-55-chest-0', amount: 5, celebrate: false });
		expect(
			burstFromClaimConfirmation({
				claimKey: '55-chest-1',
				coinsAwarded: -15,
			})
		).toBeNull();
	});
});
