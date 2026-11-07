import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Alert, Button, Stack } from '@mantine/core';
import LoadingPartially from 'components/loading-partially';
import {
	LIVE_SESSION_LOBBY_POLL_MS,
	classifyLiveCompetitionApiError,
	fetchLiveCompetitionCurrent,
	fetchLiveCompetitionPreview,
	joinLiveCompetitionSession,
	type LiveCompetitionCurrentView,
	type LiveCompetitionInvitePreview,
} from 'lib/liveCompetitionsStudentApi';
import { gameTypeLabel } from './gameTypeLabel';
import LiveCompetitionStudentShell from './LiveCompetitionStudentShell';
import LiveSessionArenaShell from './LiveSessionArenaShell';
import LivePlayLobby from './play/LivePlayLobby';
import LivePlayStage from './play/LivePlayStage';
import {
	InviteActionButton,
	InviteChip,
	InviteCopy,
	InviteList,
	InviteMeta,
	InviteRow,
	InviteStripe,
	InviteTitle,
	SessionStack,
} from './liveCompetitionsStudentStyles';
import {
	inviteStatusLabelId,
	sessionStatusLabelId,
} from './myLiveGamesLabels';
import {
	joinErrorMessageId,
	previewErrorMessageId,
	resolvePhaseFromCurrent,
	preserveQuestionClockOnCurrentUpdate,
	shouldAcceptCurrentUpdate,
	shouldAutoEnterCurrent,
	shouldDeferModeChangeForAnswerFeedback,
	shouldPollLobby,
	shouldShowJoinButton,
	type LiveSessionUiPhase,
} from './liveSessionJoinState';

export default function LiveSessionJoinPage() {
	const { sessionId: sessionIdParam } = useParams();
	const sessionId = Number(sessionIdParam || 0);
	const { formatMessage } = useIntl();

	const [phase, setPhase] = useState<LiveSessionUiPhase>('loading_preview');
	const [preview, setPreview] = useState<LiveCompetitionInvitePreview | null>(null);
	const [current, setCurrent] = useState<LiveCompetitionCurrentView | null>(null);
	const [errorId, setErrorId] = useState<string | null>(null);
	const [joining, setJoining] = useState(false);

	const mountedRef = useRef(true);
	const inFlightCurrentRef = useRef(false);
	const gameplayRefreshPromiseRef = useRef<Promise<LiveCompetitionCurrentView | null> | null>(
		null
	);
	const joiningRef = useRef(false);
	const currentRequestIdRef = useRef(0);
	const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const phaseRef = useRef<LiveSessionUiPhase>(phase);
	const currentRef = useRef<LiveCompetitionCurrentView | null>(current);
	/** True while post-answer explanation is on screen (Continue not pressed yet). */
	const answerFeedbackHoldRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		phaseRef.current = phase;
	}, [phase]);

	useEffect(() => {
		currentRef.current = current;
	}, [current]);

	const stopPolling = useCallback(() => {
		if (pollTimerRef.current) {
			clearInterval(pollTimerRef.current);
			pollTimerRef.current = null;
		}
	}, []);

	const setAnswerFeedbackHold = useCallback((holding: boolean) => {
		answerFeedbackHoldRef.current = holding;
	}, []);

	const applyCurrent = useCallback((next: LiveCompetitionCurrentView) => {
		if (!mountedRef.current) {
			return;
		}
		setCurrent((prev) => {
			if (!shouldAcceptCurrentUpdate(prev, next)) {
				return prev;
			}
			if (
				shouldDeferModeChangeForAnswerFeedback(
					answerFeedbackHoldRef.current,
					prev,
					next
				)
			) {
				return prev;
			}
			return preserveQuestionClockOnCurrentUpdate(prev, next);
		});
		setPhase((prevPhase) => {
			if (prevPhase === 'session_ended' && next.status !== 'ended') {
				return prevPhase;
			}
			if (
				shouldDeferModeChangeForAnswerFeedback(
					answerFeedbackHoldRef.current,
					currentRef.current,
					next
				)
			) {
				return prevPhase;
			}
			return resolvePhaseFromCurrent(next) ?? prevPhase;
		});
	}, []);

	const loadCurrent = useCallback(
		async (opts?: { silent?: boolean }) => {
			if (!sessionId || inFlightCurrentRef.current) {
				return;
			}
			const requestId = ++currentRequestIdRef.current;
			inFlightCurrentRef.current = true;
			if (!opts?.silent && mountedRef.current) {
				setPhase('loading_current');
			}
			try {
				const view = await fetchLiveCompetitionCurrent(sessionId);
				if (!mountedRef.current || requestId !== currentRequestIdRef.current) {
					return;
				}
				setErrorId(null);
				applyCurrent(view);
			} catch (err) {
				if (!mountedRef.current || requestId !== currentRequestIdRef.current) {
					return;
				}
				const classified = classifyLiveCompetitionApiError(err);
				setErrorId(previewErrorMessageId(classified.kind));
				if (!opts?.silent) {
					setPhase('error');
				}
			} finally {
				if (requestId === currentRequestIdRef.current) {
					inFlightCurrentRef.current = false;
				}
			}
		},
		[applyCurrent, sessionId]
	);

	/** Gameplay resync — coalesce callers; separate from lobby poll in-flight. */
	const refreshCurrentSilent = useCallback((): Promise<LiveCompetitionCurrentView | null> => {
		if (!sessionId) {
			return Promise.resolve(null);
		}
		if (gameplayRefreshPromiseRef.current) {
			return gameplayRefreshPromiseRef.current;
		}
		const requestId = ++currentRequestIdRef.current;
		const promise = fetchLiveCompetitionCurrent(sessionId)
			.then((view) => {
				if (!mountedRef.current || requestId !== currentRequestIdRef.current) {
					return null;
				}
				applyCurrent(view);
				return view;
			})
			.catch(() => null)
			.finally(() => {
				if (gameplayRefreshPromiseRef.current === promise) {
					gameplayRefreshPromiseRef.current = null;
				}
			});
		gameplayRefreshPromiseRef.current = promise;
		return promise;
	}, [applyCurrent, sessionId]);

	const loadPreview = useCallback(async () => {
		if (!sessionId) {
			if (mountedRef.current) {
				setErrorId('liveCompInvalidSession');
				setPhase('error');
			}
			return;
		}
		stopPolling();
		currentRequestIdRef.current += 1;
		inFlightCurrentRef.current = false;
		if (mountedRef.current) {
			setPhase('loading_preview');
			setErrorId(null);
			setPreview(null);
			setCurrent(null);
		}
		try {
			const next = await fetchLiveCompetitionPreview(sessionId);
			if (!mountedRef.current) {
				return;
			}
			setPreview(next);
			if (shouldAutoEnterCurrent(next)) {
				await loadCurrent();
				return;
			}
			setPhase('preview');
		} catch (err) {
			if (!mountedRef.current) {
				return;
			}
			const classified = classifyLiveCompetitionApiError(err);
			setErrorId(previewErrorMessageId(classified.kind));
			setPhase('error');
		}
	}, [loadCurrent, sessionId, stopPolling]);

	const onJoin = useCallback(async () => {
		if (!sessionId || joiningRef.current || !shouldShowJoinButton(preview)) {
			return;
		}
		joiningRef.current = true;
		if (mountedRef.current) {
			setJoining(true);
			setPhase('joining');
			setErrorId(null);
		}
		try {
			await joinLiveCompetitionSession(sessionId);
			if (!mountedRef.current) {
				return;
			}
			await loadCurrent();
		} catch (err) {
			if (!mountedRef.current) {
				return;
			}
			const classified = classifyLiveCompetitionApiError(err);
			setErrorId(joinErrorMessageId(classified.kind));
			setPhase('preview');
		} finally {
			joiningRef.current = false;
			if (mountedRef.current) {
				setJoining(false);
			}
		}
	}, [loadCurrent, preview, sessionId]);

	useEffect(() => {
		void loadPreview();
	}, [loadPreview]);

	useEffect(() => {
		stopPolling();
		if (!sessionId || !shouldPollLobby(phase, current)) {
			// Cancel silent polls only after host End — never during loading_current
			// (that would drop the initial /current response).
			if (phase === 'session_ended') {
				currentRequestIdRef.current += 1;
				inFlightCurrentRef.current = false;
			}
			return;
		}
		pollTimerRef.current = setInterval(() => {
			if (!mountedRef.current) {
				return;
			}
			if (!shouldPollLobby(phaseRef.current, currentRef.current)) {
				return;
			}
			void loadCurrent({ silent: true });
		}, LIVE_SESSION_LOBBY_POLL_MS);
		return () => {
			stopPolling();
		};
	}, [current, loadCurrent, phase, sessionId, stopPolling]);

	useEffect(() => {
		return () => {
			stopPolling();
			currentRequestIdRef.current += 1;
		};
	}, [stopPolling]);

	const showJoin = shouldShowJoinButton(preview) && (phase === 'preview' || phase === 'joining');
	const usePlayChrome =
		phase === 'waiting_lobby' ||
		phase === 'playing_started' ||
		phase === 'session_ended';
	const playTheme =
		current?.theme || preview?.session.theme || 'classic';
	const playGameName =
		preview?.session.game_name || formatMessage({ id: 'liveCompUntitledGame' });

	let body: ReactNode;
	if (phase === 'loading_preview' || phase === 'loading_current') {
		body = <LoadingPartially />;
	} else if (phase === 'error') {
		body = (
			<div data-testid="live-comp-error">
				<Stack spacing="md">
					<Alert color="red" title={formatMessage({ id: 'liveCompErrorTitle' })}>
						{formatMessage({ id: errorId || 'liveCompPreviewError' })}
					</Alert>
					<Button
						variant="light"
						onClick={() => void loadPreview()}
						data-testid="live-comp-retry"
					>
						{formatMessage({ id: 'liveCompRetry' })}
					</Button>
				</Stack>
			</div>
		);
	} else if (phase === 'waiting_lobby' && preview) {
		body = (
			<div data-testid="live-comp-session-panel">
				{/* Keep status chips for tests / a11y without leaving the themed lobby. */}
				<span hidden data-testid="live-comp-session-status">
					{formatMessage({ id: sessionStatusLabelId(preview.session.status) })}
				</span>
				<span hidden data-testid="live-comp-invite-status">
					{formatMessage({ id: inviteStatusLabelId(preview.invite.status) })}
				</span>
				<LivePlayLobby preview={preview} />
			</div>
		);
	} else if (phase === 'playing_started' || phase === 'session_ended') {
		body = (
			<div data-testid="live-comp-session-panel">
				<LiveSessionArenaShell
					current={current}
					sessionId={sessionId}
					onCurrent={applyCurrent}
					refreshCurrent={refreshCurrentSilent}
					setAnswerFeedbackHold={setAnswerFeedbackHold}
					gameName={playGameName}
				/>
			</div>
		);
	} else {
		body = (
			<div data-testid="live-comp-session-panel">
				<SessionStack>
					{errorId && phase === 'preview' ? (
						<Alert color="orange" data-testid="live-comp-inline-error">
							{formatMessage({ id: errorId })}
						</Alert>
					) : null}

					{preview ? (
						<div data-testid="live-comp-preview-card">
							<InviteList>
								<InviteRow>
									<InviteStripe $tone="join" aria-hidden />
									<InviteCopy>
										<InviteTitle>
											{preview.session.game_name ||
												formatMessage({ id: 'liveCompUntitledGame' })}
										</InviteTitle>
										<InviteMeta>
											{preview.session.theme ? (
												<InviteChip data-testid="live-comp-theme">
													{gameTypeLabel(preview.session.theme, formatMessage)}
												</InviteChip>
											) : null}
											<InviteChip
												$tone="muted"
												data-testid="live-comp-session-status"
											>
												{formatMessage({
													id: sessionStatusLabelId(preview.session.status),
												})}
											</InviteChip>
											<InviteChip
												$tone={
													String(preview.invite.status || '').toLowerCase() ===
													'accepted'
														? 'ok'
														: 'muted'
												}
												data-testid="live-comp-invite-status"
											>
												{formatMessage({
													id: inviteStatusLabelId(preview.invite.status),
												})}
											</InviteChip>
											{preview.session.goal_label ? (
												<span data-testid="live-comp-goal">
													{formatMessage(
														{ id: 'liveCompGoal' },
														{ goal: preview.session.goal_label }
													)}
												</span>
											) : null}
											{preview.session.question_total > 0 ? (
												<span data-testid="live-comp-questions">
													{formatMessage(
														{ id: 'liveCompQuestionTotal' },
														{ total: preview.session.question_total }
													)}
												</span>
											) : null}
										</InviteMeta>
									</InviteCopy>
									{showJoin ? (
										<InviteActionButton
											type="button"
											disabled={joining || phase === 'joining'}
											onClick={() => void onJoin()}
											data-testid="live-comp-join-button"
										>
											{joining || phase === 'joining'
												? formatMessage({ id: 'liveCompJoining' })
												: formatMessage({ id: 'liveCompJoin' })}
										</InviteActionButton>
									) : null}
								</InviteRow>
							</InviteList>
						</div>
					) : null}
				</SessionStack>
			</div>
		);
	}

	if (usePlayChrome) {
		return (
			<div
				data-testid="live-comp-join-page"
				style={{ height: '100%', minHeight: '100%', maxHeight: '100%' }}
			>
				<LivePlayStage
					theme={playTheme}
					exitLabel={formatMessage({ id: 'liveCompExit' })}
					exitTo="/live-games"
				>
					{body}
				</LivePlayStage>
			</div>
		);
	}

	return (
		<LiveCompetitionStudentShell
			title={formatMessage({ id: 'liveCompInviteTitle' })}
			subtitle={formatMessage({ id: 'liveCompInviteSubtitle' })}
			exitLabel={formatMessage({ id: 'liveCompExit' })}
			exitTo="/live-games"
			testId="live-comp-join-page"
			heroBird="gamer"
		>
			{body}
		</LiveCompetitionStudentShell>
	);
}
