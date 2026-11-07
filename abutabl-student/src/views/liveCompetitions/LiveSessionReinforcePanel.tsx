import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
	classifyLiveCompetitionApiError,
	submitLiveCompetitionReinforce,
	type LiveCompetitionCurrentView,
	type LiveCompetitionReinforceResult,
} from 'lib/liveCompetitionsStudentApi';
import { gameplayErrorMessageId } from './liveSessionJoinState';
import LivePlayAnswerCards from './play/LivePlayAnswerCards';
import { LIVE_PLAY_ASSET } from './play/livePlayAssets';
import { livePlayAudio } from './play/livePlayAudio';
import { useLivePlayRewardFeedback } from './play/LivePlayRewardFeedbackContext';
import { burstFromReinforceConfirmation } from './play/livePlayRewardFeedback';
import { resolveLivePlayMediaUrl } from './play/livePlayMediaUrl';
import styles from './play/livePlayExperience.module.css';

type Props = {
	sessionId: number;
	current: LiveCompetitionCurrentView;
	onCurrent: (next: LiveCompetitionCurrentView) => void;
	refreshCurrent: () => Promise<LiveCompetitionCurrentView | null>;
};

export default function LiveSessionReinforcePanel({
	sessionId,
	current,
	onCurrent,
	refreshCurrent,
}: Props) {
	const { formatMessage } = useIntl();
	const questionId = current.live_game_session_question_id;
	const { showReward } = useLivePlayRewardFeedback();

	const [selected, setSelected] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<LiveCompetitionReinforceResult | null>(null);
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
		setSelected(null);
		setResult(null);
		setInlineErrorId(null);
		setSubmitting(false);
		submitInFlightRef.current = false;
	}, [questionId]);

	const submitChoice = useCallback(
		async (choice: string) => {
			if (!sessionId || !choice || submitInFlightRef.current || result || current.frozen) {
				return;
			}
			const gen = generationRef.current;
			submitInFlightRef.current = true;
			setSelected(choice);
			setSubmitting(true);
			setInlineErrorId(null);
			try {
				const feedback = await submitLiveCompetitionReinforce(sessionId, choice);
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				livePlayAudio.playCue(feedback.correct ? 'correct_answer' : 'wrong_answer');
				if (questionId != null) {
					const burst = burstFromReinforceConfirmation({
						questionId,
						coinsAwarded: feedback.coins_awarded,
					});
					if (burst) {
						showReward(burst);
					}
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
				setSelected(null);
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
		[current.frozen, onCurrent, questionId, refreshCurrent, result, sessionId, showReward]
	);

	const choices = current.choices ?? [];
	const disabled = submitting || Boolean(result) || Boolean(current.frozen);
	const feedbackTone = result ? (result.correct ? 'correct' : 'wrong') : null;
	const questionImageUrl = resolveLivePlayMediaUrl(current.image);
	const voiceUrl = resolveLivePlayMediaUrl(current.voice_url);

	const playVoice = () => {
		if (!voiceUrl) {
			return;
		}
		try {
			void new Audio(voiceUrl).play();
		} catch {
			/* ignore */
		}
	};

	return (
		<div data-testid="live-comp-panel-reinforce" className={styles.stageBody}>
			<div className={styles.panelCard} style={{ marginBottom: 16 }}>
				<h2 className={styles.lobbyTitle} style={{ fontSize: 22 }}>
					{formatMessage({ id: 'liveCompArenaReinforceTitle' })}
				</h2>
				{current.timed_out ? (
					<p className={styles.lobbyHint} data-testid="live-comp-reinforce-timed-out">
						{formatMessage({ id: 'liveCompReinforceTimedOut' })}
					</p>
				) : null}
			</div>

			{inlineErrorId ? (
				<div className={styles.inlineError} data-testid="live-comp-reinforce-error">
					{formatMessage({ id: inlineErrorId })}
				</div>
			) : null}

			{current.frozen ? (
				<div className={styles.inlineError} data-testid="live-comp-reinforce-frozen">
					{formatMessage(
						{ id: 'liveCompArenaFrozen' },
						{ seconds: current.frozen_seconds ?? 0 }
					)}
				</div>
			) : null}

			<div className={styles.questionBar}>
				{voiceUrl ? (
					<button
						type="button"
						className={styles.micBtn}
						onClick={playVoice}
						data-testid="live-comp-reinforce-audio"
						data-src={voiceUrl}
						aria-label={formatMessage({ id: 'liveCompQuestionAudioFallback' })}
					>
						<img src={LIVE_PLAY_ASSET.mic} alt="" />
					</button>
				) : null}
				{current.question ? (
					<h2 className={styles.questionText} data-testid="live-comp-reinforce-question">
						{current.question}
					</h2>
				) : null}
				{current.explanation ? (
					<p className={styles.lobbyHint} data-testid="live-comp-reinforce-explanation">
						{current.explanation}
					</p>
				) : null}
				{current.wrong_answer ? (
					<p className={styles.lobbyHint} data-testid="live-comp-reinforce-wrong-answer">
						{formatMessage(
							{ id: 'liveCompReinforcePreviousAnswer' },
							{ answer: current.wrong_answer }
						)}
					</p>
				) : null}
				{questionImageUrl ? (
					<img
						src={questionImageUrl}
						alt=""
						className={styles.questionImage}
						data-testid="live-comp-reinforce-image"
					/>
				) : null}
			</div>

			{result ? (
				<div
					className={`${styles.feedback} ${
						result.correct ? styles.feedbackCorrect : styles.feedbackWrong
					}`}
					data-testid="live-comp-reinforce-feedback"
				>
					<p>
						{result.correct
							? formatMessage({ id: 'liveCompReinforceFeedbackCorrect' })
							: formatMessage({ id: 'liveCompReinforceFeedbackWrong' })}
					</p>
					{result.coins_awarded !== undefined ? (
						<p data-testid="live-comp-reinforce-coins-awarded">
							{formatMessage(
								{ id: 'liveCompReinforceCoinsAwarded' },
								{ coins: result.coins_awarded }
							)}
						</p>
					) : null}
					{result.coins !== undefined ? (
						<p>
							{formatMessage({ id: 'liveCompArenaCoins' }, { coins: result.coins })}
						</p>
					) : null}
				</div>
			) : (
				<LivePlayAnswerCards
					choices={choices}
					answerType={current.answer_type}
					disabled={disabled}
					selected={selected}
					feedbackTone={feedbackTone}
					onPick={(choice) => void submitChoice(choice)}
					testIdPrefix="live-comp-reinforce"
				/>
			)}
		</div>
	);
}
