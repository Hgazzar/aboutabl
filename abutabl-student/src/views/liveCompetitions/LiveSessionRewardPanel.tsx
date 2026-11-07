import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
	classifyLiveCompetitionApiError,
	claimLiveCompetitionReward,
	type LiveCompetitionClaimResult,
	type LiveCompetitionCurrentView,
	type LiveCompetitionIndexedRewardOption,
	type LiveCompetitionLabeledRewardOption,
	type LiveCompetitionRewardOption,
	type LiveCompetitionStealRewardOption,
} from 'lib/liveCompetitionsStudentApi';
import { gameplayErrorMessageId } from './liveSessionJoinState';
import { useLivePlayRewardFeedback } from './play/LivePlayRewardFeedbackContext';
import { burstFromClaimConfirmation } from './play/livePlayRewardFeedback';
import { resolveLivePlayChestImage, resolveLivePlayMediaUrl } from './play/livePlayMediaUrl';
import styles from './play/livePlayExperience.module.css';

type Props = {
	sessionId: number;
	current: LiveCompetitionCurrentView;
	onCurrent: (next: LiveCompetitionCurrentView) => void;
	refreshCurrent: () => Promise<LiveCompetitionCurrentView | null>;
};

type Selection =
	| { kind: 'choice'; index: number }
	| { kind: 'password'; password: string };

function isStealOption(opt: LiveCompetitionRewardOption): opt is LiveCompetitionStealRewardOption {
	return 'password' in opt && typeof (opt as LiveCompetitionStealRewardOption).password === 'string';
}

function isIndexedOption(
	opt: LiveCompetitionRewardOption
): opt is LiveCompetitionIndexedRewardOption {
	return 'index' in opt && typeof (opt as LiveCompetitionIndexedRewardOption).index === 'number';
}

function isLabeledOption(
	opt: LiveCompetitionRewardOption
): opt is LiveCompetitionLabeledRewardOption {
	return !isStealOption(opt) && !isIndexedOption(opt);
}

function rewardTypeTitleId(rewardType: string | null | undefined): string {
	switch (rewardType) {
		case 'chest':
			return 'liveCompRewardTypeChest';
		case 'protocol':
			return 'liveCompRewardTypeProtocol';
		case 'steal':
			return 'liveCompRewardTypeSteal';
		case 'gift':
			return 'liveCompRewardTypeGift';
		default:
			return 'liveCompArenaRewardTitle';
	}
}

export default function LiveSessionRewardPanel({
	sessionId,
	current,
	onCurrent,
	refreshCurrent,
}: Props) {
	const { formatMessage } = useIntl();
	const { showReward } = useLivePlayRewardFeedback();
	const rewardType = current.reward_type ?? null;
	const options = current.reward_options ?? [];
	const optionsKey = useMemo(
		() =>
			JSON.stringify({
				type: rewardType,
				options,
			}),
		[options, rewardType]
	);

	const [selection, setSelection] = useState<Selection | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<LiveCompetitionClaimResult | null>(null);
	const [inlineErrorId, setInlineErrorId] = useState<string | null>(null);

	const mountedRef = useRef(true);
	const generationRef = useRef(0);
	const submitInFlightRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			generationRef.current += 1;
		};
	}, []);

	useEffect(() => {
		setSelection(null);
		setResult(null);
		setInlineErrorId(null);
		setSubmitting(false);
		submitInFlightRef.current = false;
	}, [optionsKey]);

	const claimWithSelection = useCallback(
		async (picked: Selection) => {
			if (!sessionId || submitInFlightRef.current || result || current.frozen) {
				return;
			}
			const gen = generationRef.current;
			submitInFlightRef.current = true;
			setSelection(picked);
			setSubmitting(true);
			setInlineErrorId(null);
			try {
				const payload =
					picked.kind === 'password'
						? { password: picked.password }
						: { choice: picked.index };
				const feedback = await claimLiveCompetitionReward(sessionId, payload);
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				const burst = burstFromClaimConfirmation({
					claimKey: `${sessionId}-${optionsKey}-${
						picked.kind === 'password' ? picked.password : picked.index
					}`,
					coinsAwarded: feedback.coins_awarded,
				});
				if (burst) {
					showReward(burst);
				}
				setResult(feedback);
				const next = await refreshCurrent();
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				if (next) {
					onCurrent(
						feedback.coins !== undefined ? { ...next, coins: feedback.coins } : next
					);
				}
			} catch (err) {
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				const classified = classifyLiveCompetitionApiError(err);
				setInlineErrorId(gameplayErrorMessageId(classified.kind));
				const next = await refreshCurrent();
				if (mountedRef.current && gen === generationRef.current && next) {
					onCurrent(next);
				}
			} finally {
				if (gen === generationRef.current) {
					submitInFlightRef.current = false;
					setSubmitting(false);
				}
			}
		},
		[current.frozen, onCurrent, optionsKey, refreshCurrent, result, sessionId, showReward]
	);

	const onSubmit = useCallback(() => {
		if (!selection) {
			return;
		}
		void claimWithSelection(selection);
	}, [claimWithSelection, selection]);

	const disabled = submitting || Boolean(result) || Boolean(current.frozen);
	const isSteal = rewardType === 'steal';
	const isChest = rewardType === 'chest';
	/** Chests claim on icon tap — no separate Claim button. */
	const showClaimButton = !isChest;

	return (
		<div
			data-testid="live-comp-panel-reward"
			data-reward-type={rewardType ?? 'unknown'}
			className={styles.stageBody}
		>
			<div className={`${styles.panelCard} ${styles.rewardPanel}`}>
				<h2 className={styles.lobbyTitle} style={{ fontSize: 24 }}>
					{formatMessage({ id: 'liveCompArenaRewardTitle' })}
				</h2>
				{rewardType ? (
					<span className={styles.rewardTypeBadge} data-testid="live-comp-reward-type">
						{formatMessage({ id: rewardTypeTitleId(rewardType) })}
					</span>
				) : null}

				{inlineErrorId ? (
					<div className={styles.inlineError} data-testid="live-comp-reward-error">
						{formatMessage({ id: inlineErrorId })}
					</div>
				) : null}

				{current.frozen ? (
					<div className={styles.inlineError} data-testid="live-comp-reward-frozen">
						{formatMessage(
							{ id: 'liveCompArenaFrozen' },
							{ seconds: current.frozen_seconds ?? 0 }
						)}
					</div>
				) : null}

				{result ? (
					<div
						className={`${styles.feedback} ${styles.feedbackCorrect}`}
						data-testid="live-comp-reward-feedback"
					>
						{result.message ? (
							<p data-testid="live-comp-reward-message">{result.message}</p>
						) : (
							<p>{formatMessage({ id: 'liveCompRewardClaimed' })}</p>
						)}
						{result.coins_awarded !== undefined ? (
							<p data-testid="live-comp-reward-coins-awarded">
								{formatMessage(
									{ id: 'liveCompRewardCoinsAwarded' },
									{ coins: result.coins_awarded }
								)}
							</p>
						) : null}
						{result.shield ? (
							<p data-testid="live-comp-reward-shield">
								{formatMessage({ id: 'liveCompRewardShield' })}
							</p>
						) : null}
						{result.last_protocol ? (
							<p data-testid="live-comp-reward-last-protocol">
								{formatMessage(
									{ id: 'liveCompRewardLastProtocol' },
									{ protocol: result.last_protocol }
								)}
							</p>
						) : null}
					</div>
				) : (
					<>
						<div
							className={isChest ? styles.chestRow : styles.rewardOptions}
							data-testid="live-comp-reward-options"
						>
							{options.map((opt, arrayIndex) => {
								if (isSteal && isStealOption(opt)) {
									const selected =
										selection?.kind === 'password' &&
										selection.password === opt.password;
									return (
										<button
											key={`steal-${opt.password}-${arrayIndex}`}
											type="button"
											className={`${styles.rewardOption}${
												selected ? ` ${styles.rewardOptionSelected}` : ''
											}`}
											disabled={disabled}
											onClick={() =>
												setSelection({ kind: 'password', password: opt.password })
											}
											data-testid="live-comp-reward-option"
											data-option-kind="steal"
											data-password={opt.password}
										>
											<span className={styles.rewardOptionText}>
												<span className={styles.rewardOptionLabel}>{opt.password}</span>
												{opt.hint ? (
													<span
														className={styles.rewardOptionHint}
														data-testid="live-comp-reward-hint"
													>
														{opt.hint}
													</span>
												) : null}
											</span>
										</button>
									);
								}

								if (rewardType === 'chest' && isIndexedOption(opt)) {
									const choiceIndex = opt.index;
									const optionImage = resolveLivePlayChestImage(opt.image, arrayIndex);
									return (
										<button
											key={`chest-${choiceIndex}`}
											type="button"
											className={styles.chestOption}
											disabled={disabled}
											onClick={() =>
												void claimWithSelection({
													kind: 'choice',
													index: choiceIndex,
												})
											}
											data-testid="live-comp-reward-option"
											data-option-kind="chest"
											data-choice={String(choiceIndex)}
											aria-label={formatMessage(
												{ id: 'liveCompRewardChestChoice' },
												{ index: choiceIndex + 1 }
											)}
										>
											<img
												src={optionImage}
												alt=""
												data-testid="live-comp-reward-option-image"
												className={styles.chestOptionImage}
											/>
										</button>
									);
								}

								if (rewardType === 'gift' && isIndexedOption(opt)) {
									const choiceIndex = opt.index;
									const selected =
										selection?.kind === 'choice' && selection.index === choiceIndex;
									return (
										<button
											key={`gift-${choiceIndex}`}
											type="button"
											className={`${styles.rewardOption}${
												selected ? ` ${styles.rewardOptionSelected}` : ''
											}`}
											disabled={disabled}
											onClick={() =>
												setSelection({ kind: 'choice', index: choiceIndex })
											}
											data-testid="live-comp-reward-option"
											data-option-kind="gift"
											data-choice={String(choiceIndex)}
										>
											<span className={styles.rewardOptionLabel}>
												{formatMessage(
													{ id: 'liveCompRewardGiftChoice' },
													{ index: choiceIndex + 1 }
												)}
											</span>
										</button>
									);
								}

								if (isLabeledOption(opt) || (!isSteal && !isIndexedOption(opt))) {
									const labeled = isLabeledOption(opt) ? opt : {};
									const selected =
										selection?.kind === 'choice' && selection.index === arrayIndex;
									const primary =
										labeled.label ||
										labeled.protocol ||
										labeled.risk ||
										formatMessage(
											{ id: 'liveCompRewardChoiceFallback' },
											{ index: arrayIndex + 1 }
										);
									const optionImage = resolveLivePlayMediaUrl(labeled.image);
									return (
										<button
											key={`labeled-${arrayIndex}`}
											type="button"
											className={`${styles.rewardOption}${
												selected ? ` ${styles.rewardOptionSelected}` : ''
											}`}
											disabled={disabled}
											onClick={() => {
												const picked = {
													kind: 'choice' as const,
													index: arrayIndex,
												};
												if (isChest) {
													void claimWithSelection(picked);
													return;
												}
												setSelection(picked);
											}}
											data-testid="live-comp-reward-option"
											data-option-kind={rewardType ?? 'labeled'}
											data-choice={String(arrayIndex)}
											data-risk={labeled.risk}
											data-protocol={labeled.protocol}
										>
											<span className={styles.rewardOptionInner}>
												{optionImage ? (
													<img
														src={optionImage}
														alt=""
														data-testid="live-comp-reward-option-image"
														style={{
															maxHeight: 48,
															maxWidth: 72,
															objectFit: 'contain',
														}}
													/>
												) : null}
												<span className={styles.rewardOptionText}>
													<span className={styles.rewardOptionLabel}>{primary}</span>
													{labeled.hint ? (
														<span
															className={styles.rewardOptionHint}
															data-testid="live-comp-reward-hint"
														>
															{labeled.hint}
														</span>
													) : null}
												</span>
											</span>
										</button>
									);
								}

								return null;
							})}
						</div>
						{showClaimButton ? (
							<button
								type="button"
								className={styles.cta}
								disabled={disabled || !selection || submitting}
								onClick={() => void onSubmit()}
								data-testid="live-comp-reward-submit"
							>
								{submitting
									? formatMessage({ id: 'liveCompRewardSubmitting' })
									: formatMessage({ id: 'liveCompRewardSubmit' })}
							</button>
						) : null}
					</>
				)}
			</div>
		</div>
	);
}
