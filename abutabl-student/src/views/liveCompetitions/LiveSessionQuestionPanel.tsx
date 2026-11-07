import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
	classifyLiveCompetitionApiError,
	fetchLiveCompetitionCurrent,
	startLiveCompetitionQuestionClock,
	submitLiveCompetitionAnswer,
	submitLiveCompetitionTimeout,
	type LiveCompetitionAnswerFeedback,
	type LiveCompetitionCurrentView,
} from 'lib/liveCompetitionsStudentApi';
import { gameplayErrorMessageId } from './liveSessionJoinState';
import LivePlayAnswerCards from './play/LivePlayAnswerCards';
import { LIVE_PLAY_ASSET } from './play/livePlayAssets';
import { livePlayAudio } from './play/livePlayAudio';
import { useLivePlayHudTimer } from './play/LivePlayHudContext';
import { useLivePlayRewardFeedback } from './play/LivePlayRewardFeedbackContext';
import { burstFromAnswerConfirmation } from './play/livePlayRewardFeedback';
import { resolveLivePlayMediaUrl } from './play/livePlayMediaUrl';
import styles from './play/livePlayExperience.module.css';

/** Soft resync of server seconds_left while a question is active (display only). */
export const LIVE_SESSION_QUESTION_RESYNC_MS = 2000;

type Props = {
	sessionId: number;
	current: LiveCompetitionCurrentView;
	onCurrent: (next: LiveCompetitionCurrentView) => void;
	refreshCurrent: () => Promise<LiveCompetitionCurrentView | null>;
	setAnswerFeedbackHold?: (holding: boolean) => void;
};

function isActiveQuestion(current: LiveCompetitionCurrentView): boolean {
	return (
		current.mode === 'question' &&
		typeof current.live_game_session_question_id === 'number' &&
		current.live_game_session_question_id > 0
	);
}

export default function LiveSessionQuestionPanel({
	sessionId,
	current,
	onCurrent,
	refreshCurrent,
	setAnswerFeedbackHold,
}: Props) {
	const { formatMessage } = useIntl();
	const questionId = current.live_game_session_question_id;
	const { setTimerSeconds } = useLivePlayHudTimer();
	const { showReward } = useLivePlayRewardFeedback();

	const [selected, setSelected] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [feedback, setFeedback] = useState<LiveCompetitionAnswerFeedback | null>(null);
	const [pendingAfterFeedback, setPendingAfterFeedback] =
		useState<LiveCompetitionCurrentView | null>(null);
	const [inlineErrorId, setInlineErrorId] = useState<string | null>(null);
	const [displaySeconds, setDisplaySeconds] = useState<number | null>(
		current.clock_started && current.seconds_left !== undefined
			? current.seconds_left
			: null
	);

	const mountedRef = useRef(true);
	const generationRef = useRef(0);
	const clockReadyRef = useRef(false);
	const clockInFlightRef = useRef(false);
	const clockStartPromiseRef = useRef<Promise<void> | null>(null);
	const timeoutSentRef = useRef(false);
	const timeoutInFlightRef = useRef(false);
	const answerInFlightRef = useRef(false);
	const softResyncInFlightRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			generationRef.current += 1;
			// Delay clear so a same-question remount can re-seed before HUD flashes "--".
			window.setTimeout(() => {
				if (!mountedRef.current) {
					setTimerSeconds(null);
				}
			}, 0);
		};
	}, [setTimerSeconds]);

	useEffect(() => {
		setTimerSeconds(displaySeconds);
	}, [displaySeconds, setTimerSeconds]);

	useEffect(() => {
		livePlayAudio.playCue('question_transition');
	}, [questionId]);

	useEffect(() => {
		setFeedback(null);
		setPendingAfterFeedback(null);
		setSelected(null);
		setInlineErrorId(null);
		timeoutSentRef.current = false;
		clockReadyRef.current = Boolean(
			current.clock_started && (current.seconds_left ?? 0) > 0
		);
		generationRef.current += 1;
		setDisplaySeconds(
			current.clock_started && current.seconds_left !== undefined
				? current.seconds_left
				: null
		);
	}, [questionId]);

	useEffect(() => {
		setAnswerFeedbackHold?.(Boolean(feedback));
		return () => {
			setAnswerFeedbackHold?.(false);
		};
	}, [feedback, setAnswerFeedbackHold]);

	const applyNextCurrent = useCallback(
		(next: LiveCompetitionCurrentView | null) => {
			if (!next) {
				return;
			}
			onCurrent(next);
		},
		[onCurrent]
	);

	const continueAfterFeedback = useCallback(() => {
		const next = pendingAfterFeedback;
		// Clear hold synchronously so onCurrent(reward/reinforce) is not deferred.
		setAnswerFeedbackHold?.(false);
		setFeedback(null);
		setPendingAfterFeedback(null);
		setSelected(null);
		if (next) {
			onCurrent(next);
		}
	}, [onCurrent, pendingAfterFeedback, setAnswerFeedbackHold]);

	const holdFeedbackThenContinue = useCallback(
		(
			result: LiveCompetitionAnswerFeedback,
			next: LiveCompetitionCurrentView | null
		) => {
			const merged = next
				? {
						...next,
						...(result.coins !== undefined ? { coins: result.coins } : {}),
						...(result.score !== undefined ? { score: result.score } : {}),
						...(result.streak !== undefined ? { streak: result.streak } : {}),
					}
				: null;
			// Host End wins over answer feedback — never pin the student on a question.
			if (merged && merged.status === 'ended') {
				setAnswerFeedbackHold?.(false);
				setFeedback(null);
				setPendingAfterFeedback(null);
				setSelected(null);
				onCurrent(merged);
				return;
			}
			setAnswerFeedbackHold?.(true);
			setPendingAfterFeedback(merged);
			setFeedback(result);
			// Keep question panel mounted for feedback; only sync HUD fields.
			onCurrent({
				...current,
				...(result.coins !== undefined ? { coins: result.coins } : {}),
				...(result.score !== undefined ? { score: result.score } : {}),
				...(result.streak !== undefined ? { streak: result.streak } : {}),
			});
		},
		[current, onCurrent, setAnswerFeedbackHold]
	);

	const startClockIfNeeded = useCallback(async (): Promise<boolean> => {
		if (!sessionId || !isActiveQuestion(current) || questionId == null) {
			return false;
		}
		if (current.frozen || feedback) {
			return false;
		}
		if (clockReadyRef.current && current.clock_started && (current.seconds_left ?? 0) > 0) {
			return true;
		}
		if (current.clock_started && (current.seconds_left ?? 0) > 0) {
			clockReadyRef.current = true;
			setDisplaySeconds(current.seconds_left ?? null);
			return true;
		}
		if (clockStartPromiseRef.current) {
			await clockStartPromiseRef.current;
			return clockReadyRef.current;
		}

		const gen = generationRef.current;
		clockInFlightRef.current = true;
		const flight = (async () => {
			try {
				const next = await startLiveCompetitionQuestionClock(sessionId);
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				// Mode hop (reward/reinforce/ended) — apply quietly; never flash the timer banner.
				if (next.mode !== 'question') {
					applyNextCurrent(next);
					return;
				}
				if (!next.clock_started) {
					applyNextCurrent(next);
					return;
				}
				clockReadyRef.current = true;
				timeoutSentRef.current = false;
				setInlineErrorId(null);
				applyNextCurrent(next);
				if (next.seconds_left !== undefined) {
					setDisplaySeconds(next.seconds_left);
				} else if (next.question_seconds !== undefined) {
					setDisplaySeconds(next.question_seconds);
				}
			} catch {
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				// Background clock sync must not scare the player mid-question.
				const next = await refreshCurrent();
				if (mountedRef.current && gen === generationRef.current) {
					applyNextCurrent(next);
				}
			} finally {
				if (gen === generationRef.current) {
					clockInFlightRef.current = false;
					clockStartPromiseRef.current = null;
				}
			}
		})();
		clockStartPromiseRef.current = flight;
		await flight;
		return clockReadyRef.current;
	}, [applyNextCurrent, current, feedback, questionId, refreshCurrent, sessionId]);

	useEffect(() => {
		void startClockIfNeeded();
		// Only (re)start when the question identity / clock flags change — not every soft-resync object.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow triggers
	}, [
		sessionId,
		questionId,
		current.clock_started,
		current.frozen,
		feedback,
		startClockIfNeeded,
	]);

	useEffect(() => {
		if (!isActiveQuestion(current) || !current.clock_started || current.seconds_left === undefined) {
			return;
		}
		clockReadyRef.current = true;
		setInlineErrorId(null);
		// Soft resync can nudge seconds_left every 2s — only adopt large drifts / first tick.
		setDisplaySeconds((prev) => {
			const server = current.seconds_left!;
			if (prev == null) {
				return server;
			}
			if (server <= 0) {
				return 0;
			}
			return Math.abs(prev - server) >= 2 ? server : prev;
		});
	}, [current.clock_started, current.live_game_session_question_id, current.seconds_left]);

	useEffect(() => {
		if (!current.frozen) {
			return;
		}
		// Freeze explains the block — drop the vague sync banner.
		setInlineErrorId(null);
	}, [current.frozen]);

	const runTimeoutOnce = useCallback(async () => {
		if (!sessionId || questionId == null || !isActiveQuestion(current)) {
			return;
		}
		if (!clockReadyRef.current || !current.clock_started) {
			return;
		}
		if (timeoutSentRef.current || timeoutInFlightRef.current || feedback) {
			return;
		}

		const gen = generationRef.current;
		timeoutInFlightRef.current = true;
		timeoutSentRef.current = true;
		try {
			const result = await submitLiveCompetitionTimeout(sessionId, questionId);
			if (!mountedRef.current || gen !== generationRef.current) {
				return;
			}
			livePlayAudio.playCue('timeout');
			setInlineErrorId(null);
			// Peek next mode without applying — parent refresh would unmount feedback.
			const next = await fetchLiveCompetitionCurrent(sessionId);
			if (!mountedRef.current || gen !== generationRef.current) {
				return;
			}
			holdFeedbackThenContinue(result, next);
		} catch (err) {
			if (!mountedRef.current || gen !== generationRef.current) {
				return;
			}
			timeoutSentRef.current = false;
			const classified = classifyLiveCompetitionApiError(err);
			setInlineErrorId(gameplayErrorMessageId(classified.kind));
			const next = await refreshCurrent();
			if (mountedRef.current && gen === generationRef.current) {
				applyNextCurrent(next);
			}
		} finally {
			if (gen === generationRef.current) {
				timeoutInFlightRef.current = false;
			}
		}
	}, [
		applyNextCurrent,
		current,
		feedback,
		holdFeedbackThenContinue,
		questionId,
		refreshCurrent,
		sessionId,
	]);

	useEffect(() => {
		if (!isActiveQuestion(current) || !current.clock_started || !clockReadyRef.current || feedback) {
			return;
		}
		const timer = window.setInterval(() => {
			setDisplaySeconds((prev) => {
				if (prev == null) {
					return prev;
				}
				const next = Math.max(0, prev - 1);
				if (next <= 5 && next > 0) {
					livePlayAudio.playCue('countdown_tick');
				}
				return next;
			});
		}, 1000);
		return () => {
			window.clearInterval(timer);
		};
	}, [current.clock_started, current.live_game_session_question_id, current.mode, feedback]);

	useEffect(() => {
		if (!isActiveQuestion(current) || feedback || !current.clock_started || !clockReadyRef.current) {
			return;
		}
		if (displaySeconds == null || displaySeconds > 0) {
			return;
		}
		if (timeoutSentRef.current || timeoutInFlightRef.current) {
			return;
		}

		let cancelled = false;
		const gen = generationRef.current;
		void (async () => {
			const next = await refreshCurrent();
			if (cancelled || !mountedRef.current || gen !== generationRef.current) {
				return;
			}
			if (!next || next.mode !== 'question') {
				applyNextCurrent(next);
				return;
			}
			if (next.live_game_session_question_id !== questionId) {
				applyNextCurrent(next);
				return;
			}
			const serverLeft = next.seconds_left;
			if (serverLeft !== undefined && serverLeft > 0) {
				applyNextCurrent(next);
				setDisplaySeconds(serverLeft);
				return;
			}
			if (!next.clock_started) {
				clockReadyRef.current = false;
				applyNextCurrent(next);
				return;
			}
			applyNextCurrent(next);
			await runTimeoutOnce();
		})();

		return () => {
			cancelled = true;
		};
	}, [
		applyNextCurrent,
		current,
		displaySeconds,
		feedback,
		questionId,
		refreshCurrent,
		runTimeoutOnce,
	]);

	useEffect(() => {
		if (!isActiveQuestion(current) || !current.clock_started || !clockReadyRef.current || feedback) {
			return;
		}
		const timer = window.setInterval(() => {
			if (
				!mountedRef.current ||
				softResyncInFlightRef.current ||
				answerInFlightRef.current ||
				timeoutInFlightRef.current
			) {
				return;
			}
			softResyncInFlightRef.current = true;
			void refreshCurrent()
				.then((next) => {
					if (!mountedRef.current || !next) {
						return;
					}
					applyNextCurrent(next);
				})
				.finally(() => {
					softResyncInFlightRef.current = false;
				});
		}, LIVE_SESSION_QUESTION_RESYNC_MS);
		return () => {
			window.clearInterval(timer);
		};
	}, [
		applyNextCurrent,
		current.clock_started,
		current.live_game_session_question_id,
		current.mode,
		feedback,
		refreshCurrent,
	]);

	// Feedback pauses normal soft-resync; still detect host End so the student is not stuck.
	useEffect(() => {
		if (!feedback || !sessionId) {
			return;
		}
		const timer = window.setInterval(() => {
			if (!mountedRef.current || softResyncInFlightRef.current) {
				return;
			}
			softResyncInFlightRef.current = true;
			void fetchLiveCompetitionCurrent(sessionId)
				.then((next) => {
					if (!mountedRef.current || !next || next.status !== 'ended') {
						return;
					}
					setFeedback(null);
					setPendingAfterFeedback(null);
					setSelected(null);
					onCurrent(next);
				})
				.finally(() => {
					softResyncInFlightRef.current = false;
				});
		}, LIVE_SESSION_QUESTION_RESYNC_MS);
		return () => {
			window.clearInterval(timer);
		};
	}, [feedback, onCurrent, sessionId]);

	const submitChoice = useCallback(
		async (choice: string) => {
			if (!sessionId || questionId == null || !choice || answerInFlightRef.current || feedback) {
				return;
			}
			if (current.frozen) {
				setInlineErrorId('liveCompAnswerFrozen');
				return;
			}

			const gen = generationRef.current;
			answerInFlightRef.current = true;
			setSelected(choice);
			setSubmitting(true);
			setInlineErrorId(null);
			try {
				// Best-effort HUD clock; answer API auto-starts if the client lost the race.
				if (!current.clock_started) {
					await startClockIfNeeded();
					if (!mountedRef.current || gen !== generationRef.current) {
						return;
					}
				} else {
					clockReadyRef.current = true;
				}
				setInlineErrorId(null);
				const result = await submitLiveCompetitionAnswer(sessionId, questionId, choice);
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				livePlayAudio.playCue(result.correct ? 'correct_answer' : 'wrong_answer');
				const burst = burstFromAnswerConfirmation({
					questionId,
					correct: result.correct,
					timedOut: result.timed_out,
					previousCoins: current.coins,
					confirmedCoins: result.coins,
					celebrate: String(current.theme || '').toLowerCase() === 'classic',
				});
				if (burst) {
					showReward(burst);
				}
				// Peek next mode without applying — parent refresh would unmount feedback.
				const next = await fetchLiveCompetitionCurrent(sessionId);
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				holdFeedbackThenContinue(result, next);
			} catch (err) {
				if (!mountedRef.current || gen !== generationRef.current) {
					return;
				}
				setSelected(null);
				const classified = classifyLiveCompetitionApiError(err);
				setInlineErrorId(gameplayErrorMessageId(classified.kind));
				const next = await refreshCurrent();
				if (mountedRef.current && gen === generationRef.current) {
					applyNextCurrent(next);
				}
			} finally {
				if (gen === generationRef.current) {
					answerInFlightRef.current = false;
					setSubmitting(false);
				}
			}
		},
		[
			applyNextCurrent,
			current.clock_started,
			current.coins,
			current.frozen,
			current.theme,
			feedback,
			holdFeedbackThenContinue,
			questionId,
			refreshCurrent,
			sessionId,
			showReward,
			startClockIfNeeded,
		]
	);

	const choices = current.choices ?? [];
	const disabled =
		submitting || Boolean(feedback) || Boolean(current.frozen) || timeoutInFlightRef.current;
	const feedbackTone = feedback
		? feedback.timed_out || !feedback.correct
			? 'wrong'
			: 'correct'
		: null;

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
		<div data-testid="live-comp-panel-question" className={styles.stageBody}>
			{current.frozen ? (
				<div className={styles.inlineError} data-testid="live-comp-question-frozen">
					{formatMessage(
						{ id: 'liveCompAnswerFrozen' },
						{ seconds: current.frozen_seconds ?? 0 }
					)}
				</div>
			) : inlineErrorId ? (
				<div className={styles.inlineError} data-testid="live-comp-question-error">
					{inlineErrorId === 'liveCompAnswerFrozen'
						? formatMessage(
								{ id: 'liveCompAnswerFrozen' },
								{ seconds: current.frozen_seconds ?? 0 }
							)
						: formatMessage({ id: inlineErrorId })}
				</div>
			) : null}

			<div className={styles.questionBar}>
				{/* Question countdown lives in the HUD only — avoid a second flashing timer. */}
				{displaySeconds == null && !current.frozen && !feedback && !inlineErrorId ? (
					<p className={styles.lobbyHint} data-testid="live-comp-question-timer-pending">
						{formatMessage({ id: 'liveCompQuestionTimerPending' })}
					</p>
				) : displaySeconds != null ? (
					<span hidden data-testid="live-comp-question-timer">
						{formatMessage(
							{ id: 'liveCompQuestionTimer' },
							{ seconds: Math.ceil(displaySeconds) }
						)}
					</span>
				) : null}
				{voiceUrl ? (
					<button
						type="button"
						className={styles.micBtn}
						onClick={playVoice}
						data-testid="live-comp-question-audio"
						data-src={voiceUrl}
						aria-label={formatMessage({ id: 'liveCompQuestionAudioFallback' })}
					>
						<img src={LIVE_PLAY_ASSET.mic} alt="" />
					</button>
				) : null}
				{current.question ? (
					<h2 className={styles.questionText} data-testid="live-comp-question-text">
						{current.question}
					</h2>
				) : null}
				{questionImageUrl ? (
					<img
						src={questionImageUrl}
						alt=""
						className={styles.questionImage}
						data-testid="live-comp-question-image"
					/>
				) : null}
			</div>

			{feedback ? (
				<div
					className={`${styles.feedback} ${
						feedback.correct && !feedback.timed_out
							? styles.feedbackCorrect
							: styles.feedbackWrong
					}`}
					data-testid="live-comp-question-feedback"
					data-feedback={
						feedback.timed_out ? 'timeout' : feedback.correct ? 'correct' : 'incorrect'
					}
				>
					<p data-testid="live-comp-question-feedback-title">
						{feedback.timed_out
							? formatMessage({ id: 'liveCompQuestionFeedbackTimeout' })
							: feedback.correct
								? formatMessage({ id: 'liveCompQuestionFeedbackCorrect' })
								: formatMessage({ id: 'liveCompQuestionFeedbackWrong' })}
					</p>
					{!feedback.correct || feedback.timed_out
						? feedback.correct_answer
							? (
									<p data-testid="live-comp-question-correct-answer">
										{formatMessage(
											{ id: 'liveCompQuestionFeedbackCorrectAnswer' },
											{ answer: feedback.correct_answer }
										)}
									</p>
								)
							: null
						: null}
					{feedback.explanation ? (
						<p data-testid="live-comp-question-explanation">{feedback.explanation}</p>
					) : null}
					{feedback.coins_awarded !== undefined && feedback.coins_awarded > 0 ? (
						<p data-testid="live-comp-question-coins-awarded">
							{formatMessage(
								{ id: 'liveCompRewardCoinsAwarded' },
								{ coins: feedback.coins_awarded }
							)}
						</p>
					) : null}
					<button
						type="button"
						className={styles.cta}
						onClick={continueAfterFeedback}
						data-testid="live-comp-question-continue"
					>
						{formatMessage({ id: 'liveCompQuestionFeedbackContinue' })}
					</button>
				</div>
			) : (
				<LivePlayAnswerCards
					choices={choices}
					answerType={current.answer_type}
					disabled={disabled}
					selected={selected}
					feedbackTone={feedbackTone}
					onPick={(choice) => void submitChoice(choice)}
					testIdPrefix="live-comp-question"
				/>
			)}
		</div>
	);
}
