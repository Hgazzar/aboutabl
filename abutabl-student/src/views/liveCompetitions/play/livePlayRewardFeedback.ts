/**
 * Derive visible session-coin bursts from authoritative API payloads only.
 * Never invents reward amounts — positive confirmed deltas / coins_awarded only.
 */

export type LivePlayRewardBurstInput = {
	/** Stable id so poll/rerender cannot replay the same reward. */
	key: string;
	amount: number;
	/** Classic correct-answer celebration (confetti). */
	celebrate?: boolean;
};

export type LivePlayRewardBurst = {
	key: string;
	amount: number;
	celebrate: boolean;
};

/** Positive session-coin gain from before/after balances confirmed by the server. */
export function sessionCoinDelta(
	previousCoins: number | null | undefined,
	confirmedCoins: number | null | undefined
): number {
	if (
		previousCoins === null ||
		previousCoins === undefined ||
		confirmedCoins === null ||
		confirmedCoins === undefined ||
		!Number.isFinite(previousCoins) ||
		!Number.isFinite(confirmedCoins)
	) {
		return 0;
	}
	const delta = confirmedCoins - previousCoins;
	return delta > 0 ? delta : 0;
}

/**
 * Classic/GQ/Hacking answer: show burst only when the server raised session coins.
 * Incorrect / pending-chest (0 delta) → no burst.
 */
export function burstFromAnswerConfirmation(args: {
	questionId: number;
	correct: boolean;
	timedOut: boolean;
	previousCoins: number | null | undefined;
	confirmedCoins: number | null | undefined;
	celebrate: boolean;
}): LivePlayRewardBurst | null {
	if (!args.correct || args.timedOut) {
		return null;
	}
	const amount = sessionCoinDelta(args.previousCoins, args.confirmedCoins);
	if (amount <= 0) {
		return null;
	}
	return {
		key: `answer-${args.questionId}`,
		amount,
		celebrate: args.celebrate,
	};
}

/** Reinforce: use server coins_awarded when positive. */
export function burstFromReinforceConfirmation(args: {
	questionId: number;
	coinsAwarded: number | null | undefined;
}): LivePlayRewardBurst | null {
	const amount =
		args.coinsAwarded != null && Number.isFinite(args.coinsAwarded)
			? Math.trunc(args.coinsAwarded)
			: 0;
	if (amount <= 0) {
		return null;
	}
	return {
		key: `reinforce-${args.questionId}`,
		amount,
		celebrate: false,
	};
}

/** Gold Quest / Hacking claim: only after authoritative claim confirms a positive gain. */
export function burstFromClaimConfirmation(args: {
	claimKey: string;
	coinsAwarded: number | null | undefined;
}): LivePlayRewardBurst | null {
	const amount =
		args.coinsAwarded != null && Number.isFinite(args.coinsAwarded)
			? Math.trunc(args.coinsAwarded)
			: 0;
	if (amount <= 0) {
		return null;
	}
	return {
		key: `claim-${args.claimKey}`,
		amount,
		celebrate: false,
	};
}
