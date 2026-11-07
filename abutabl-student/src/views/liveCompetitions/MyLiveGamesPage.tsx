import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Alert, Button, Stack } from '@mantine/core';
import LoadingPartially from 'components/loading-partially';
import {
	LIVE_INVITATIONS_PAGE_SIZE,
	LIVE_INVITATIONS_POLL_MS,
	classifyLiveCompetitionApiError,
	getLiveCompetitionInvitations,
	joinLiveCompetitionSession,
	type LiveCompetitionInvitationListItem,
} from 'lib/liveCompetitionsStudentApi';
import { gameTypeLabel } from './gameTypeLabel';
import LiveCompetitionStudentShell from './LiveCompetitionStudentShell';
import {
	InviteActionButton,
	InviteActionLink,
	InviteChip,
	InviteCopy,
	InviteEmptyBody,
	InviteEmptyCard,
	InviteEmptyTitle,
	InviteHint,
	InviteList,
	InviteMeta,
	InviteRow,
	InviteStripe,
	InviteTitle,
} from './liveCompetitionsStudentStyles';
import {
	blockReasonMessageId,
	invitationActionLabelId,
	invitationEligibility,
	invitationEligibilityLabelId,
	inviteStripeTone,
	sessionStatusLabelId,
} from './myLiveGamesLabels';

type ListPhase = 'loading' | 'ready' | 'empty' | 'error';

export default function MyLiveGamesPage() {
	const { formatMessage } = useIntl();
	const navigate = useNavigate();
	const [phase, setPhase] = useState<ListPhase>('loading');
	const [items, setItems] = useState<LiveCompetitionInvitationListItem[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [errorId, setErrorId] = useState<string | null>(null);
	const [actionErrorId, setActionErrorId] = useState<string | null>(null);
	const [joiningSessionId, setJoiningSessionId] = useState<number | null>(null);
	const mountedRef = useRef(true);
	const requestIdRef = useRef(0);
	const joiningRef = useRef(false);
	const inFlightRef = useRef(false);
	const loadMoreInFlightRef = useRef(false);
	const itemsLenRef = useRef(0);
	const phaseRef = useRef<ListPhase>(phase);

	useEffect(() => {
		phaseRef.current = phase;
	}, [phase]);

	useEffect(() => {
		itemsLenRef.current = items.length;
	}, [items.length]);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const loadInvitations = useCallback(async (opts?: { silent?: boolean }) => {
		const silent = Boolean(opts?.silent);
		if (silent && (inFlightRef.current || joiningRef.current || loadMoreInFlightRef.current)) {
			return;
		}
		const requestId = ++requestIdRef.current;
		inFlightRef.current = true;
		if (!silent) {
			setPhase('loading');
			setErrorId(null);
		}
		try {
			// Silent refresh keeps the currently visible window (page 1..N) in sync.
			const perPage = silent
				? Math.max(LIVE_INVITATIONS_PAGE_SIZE, itemsLenRef.current || LIVE_INVITATIONS_PAGE_SIZE)
				: LIVE_INVITATIONS_PAGE_SIZE;
			const result = await getLiveCompetitionInvitations({ page: 1, per_page: perPage });
			if (!mountedRef.current || requestId !== requestIdRef.current) {
				return;
			}
			setItems(result.items);
			setPage(1);
			setHasMore(result.pagination.has_more);
			setPhase(result.items.length === 0 ? 'empty' : 'ready');
			if (silent) {
				setErrorId(null);
			}
		} catch (err) {
			if (!mountedRef.current || requestId !== requestIdRef.current) {
				return;
			}
			// Silent polls keep the last good list; only hard-fail on interactive loads.
			if (silent) {
				return;
			}
			const classified = classifyLiveCompetitionApiError(err);
			if (classified.kind === 'unauthenticated') {
				setErrorId('liveCompUnauthenticated');
			} else if (classified.kind === 'disabled') {
				setErrorId('liveCompDisabled');
			} else if (classified.kind === 'network') {
				setErrorId('liveCompNetworkError');
			} else {
				setErrorId('myLiveGamesLoadError');
			}
			setItems([]);
			setHasMore(false);
			setPage(1);
			setPhase('error');
		} finally {
			if (requestId === requestIdRef.current) {
				inFlightRef.current = false;
			}
		}
	}, []);

	const loadMore = useCallback(async () => {
		if (
			!hasMore ||
			loadingMore ||
			loadMoreInFlightRef.current ||
			inFlightRef.current ||
			joiningRef.current
		) {
			return;
		}
		const nextPage = page + 1;
		loadMoreInFlightRef.current = true;
		setLoadingMore(true);
		setActionErrorId(null);
		try {
			const result = await getLiveCompetitionInvitations({
				page: nextPage,
				per_page: LIVE_INVITATIONS_PAGE_SIZE,
			});
			if (!mountedRef.current) {
				return;
			}
			setItems((prev) => {
				const seen = new Set(prev.map((row) => row.session.id));
				const appended = result.items.filter((row) => !seen.has(row.session.id));
				return [...prev, ...appended];
			});
			setPage(result.pagination.page);
			setHasMore(result.pagination.has_more);
		} catch {
			if (mountedRef.current) {
				setActionErrorId('myLiveGamesLoadError');
			}
		} finally {
			loadMoreInFlightRef.current = false;
			if (mountedRef.current) {
				setLoadingMore(false);
			}
		}
	}, [hasMore, loadingMore, page]);

	useEffect(() => {
		void loadInvitations();
	}, [loadInvitations]);

	// Keep invitations fresh while the student stays on this page (teacher invite arrival).
	useEffect(() => {
		const tick = () => {
			if (document.visibilityState === 'hidden') {
				return;
			}
			if (phaseRef.current !== 'ready' && phaseRef.current !== 'empty') {
				return;
			}
			void loadInvitations({ silent: true });
		};
		const timer = window.setInterval(tick, LIVE_INVITATIONS_POLL_MS);
		const onVisible = () => {
			if (document.visibilityState === 'visible') {
				tick();
			}
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			window.clearInterval(timer);
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, [loadInvitations]);

	const onJoinableClick = async (sessionId: number) => {
		if (joiningRef.current) {
			return;
		}
		joiningRef.current = true;
		setJoiningSessionId(sessionId);
		setActionErrorId(null);
		try {
			await joinLiveCompetitionSession(sessionId);
			if (!mountedRef.current) {
				return;
			}
			navigate(`/live-games/sessions/${sessionId}`);
		} catch (err) {
			if (!mountedRef.current) {
				return;
			}
			const classified = classifyLiveCompetitionApiError(err);
			// Classifier has no 'conflict' kind (409 → not_in_lobby); keep prior fallbacks.
			if (classified.kind === 'unauthenticated') {
				setActionErrorId('liveCompUnauthenticated');
			} else if (classified.kind === 'network') {
				setActionErrorId('liveCompNetworkError');
			} else {
				setActionErrorId('liveCompJoinFailed');
			}
			void loadInvitations({ silent: true });
		} finally {
			joiningRef.current = false;
			if (mountedRef.current) {
				setJoiningSessionId(null);
			}
		}
	};

	let body: React.ReactNode;
	if (phase === 'loading') {
		body = (
			<div data-testid="my-live-games-loading">
				<LoadingPartially />
			</div>
		);
	} else if (phase === 'error') {
		body = (
			<div data-testid="my-live-games-error">
				<Stack spacing="md">
					<Alert color="red" title={formatMessage({ id: 'myLiveGamesErrorTitle' })}>
						{formatMessage({ id: errorId || 'myLiveGamesLoadError' })}
					</Alert>
					<Button
						onClick={() => void loadInvitations()}
						data-testid="my-live-games-retry"
					>
						{formatMessage({ id: 'liveCompRetry' })}
					</Button>
				</Stack>
			</div>
		);
	} else if (phase === 'empty') {
		body = (
			<InviteEmptyCard data-testid="my-live-games-empty">
				<InviteEmptyTitle>{formatMessage({ id: 'myLiveGamesEmptyTitle' })}</InviteEmptyTitle>
				<InviteEmptyBody>{formatMessage({ id: 'myLiveGamesEmptyBody' })}</InviteEmptyBody>
			</InviteEmptyCard>
		);
	} else {
		body = (
			<div data-testid="my-live-games-list">
				{actionErrorId ? (
					<Alert color="orange" mb="md" data-testid="my-live-games-join-error">
						{formatMessage({ id: actionErrorId })}
					</Alert>
				) : null}
				<InviteList>
					{items.map((item) => {
						const eligibility = invitationEligibility(item);
						const sessionPath = `/live-games/sessions/${item.session.id}`;
						const isJoining = joiningSessionId === item.session.id;
						const blockMsgId =
							eligibility === 'unavailable'
								? blockReasonMessageId(item.block_reason)
								: null;
						const sessionStatus = item.session.status;
						const actionLabelId = invitationActionLabelId(eligibility, sessionStatus);
						const eligibilityLabelId = invitationEligibilityLabelId(
							eligibility,
							sessionStatus
						);
						const eligibilityChipTone =
							eligibility === 'joinable'
								? 'ok'
								: eligibility === 'joined' && sessionStatus === 'ended'
									? 'muted'
									: eligibility === 'joined'
										? 'default'
										: 'muted';

						return (
							<InviteRow
								key={item.session.id}
								data-testid={`my-live-games-item-${item.session.id}`}
								data-eligibility={eligibility}
								data-session-status={sessionStatus}
							>
								<InviteStripe
									$tone={inviteStripeTone(eligibility, sessionStatus)}
									aria-hidden
								/>
								<InviteCopy>
									<InviteTitle>
										{item.session.game_name ||
											formatMessage({ id: 'liveCompUntitledGame' })}
									</InviteTitle>
									<InviteMeta>
										{item.session.theme ? (
											<InviteChip data-testid={`my-live-games-theme-${item.session.id}`}>
												{gameTypeLabel(item.session.theme, formatMessage)}
											</InviteChip>
										) : null}
										<InviteChip
											$tone="muted"
											data-testid={`my-live-games-session-status-${item.session.id}`}
										>
											{formatMessage({
												id: sessionStatusLabelId(sessionStatus),
											})}
										</InviteChip>
										<InviteChip
											$tone={eligibilityChipTone}
											data-testid={`my-live-games-eligibility-${item.session.id}`}
										>
											{formatMessage({ id: eligibilityLabelId })}
										</InviteChip>
										{item.session.goal_label ? (
											<span data-testid={`my-live-games-goal-${item.session.id}`}>
												{formatMessage(
													{ id: 'liveCompGoal' },
													{ goal: item.session.goal_label }
												)}
											</span>
										) : null}
										{item.session.question_total > 0 ? (
											<span data-testid={`my-live-games-questions-${item.session.id}`}>
												{formatMessage(
													{ id: 'liveCompQuestionTotal' },
													{ total: item.session.question_total }
												)}
											</span>
										) : null}
									</InviteMeta>
									{blockMsgId ? (
										<InviteHint data-testid={`my-live-games-block-reason-${item.session.id}`}>
											{formatMessage({ id: blockMsgId })}
										</InviteHint>
									) : null}
								</InviteCopy>
								{eligibility === 'joinable' ? (
									<InviteActionButton
										type="button"
										disabled={joiningSessionId != null}
										onClick={() => void onJoinableClick(item.session.id)}
										data-testid={`my-live-games-open-${item.session.id}`}
									>
										{isJoining
											? formatMessage({ id: 'liveCompJoining' })
											: formatMessage({ id: actionLabelId })}
									</InviteActionButton>
								) : (
									<InviteActionLink
										to={sessionPath}
										data-testid={`my-live-games-open-${item.session.id}`}
									>
										{formatMessage({ id: actionLabelId })}
									</InviteActionLink>
								)}
							</InviteRow>
						);
					})}
				</InviteList>
				{hasMore ? (
					<div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
						<Button
							variant="light"
							loading={loadingMore}
							disabled={loadingMore || joiningSessionId != null}
							onClick={() => void loadMore()}
							data-testid="my-live-games-load-more"
						>
							{formatMessage({ id: 'myLiveGamesLoadMore' })}
						</Button>
					</div>
				) : null}
			</div>
		);
	}

	return (
		<LiveCompetitionStudentShell
			title={formatMessage({ id: 'myLiveGamesTitle' })}
			subtitle={formatMessage({ id: 'myLiveGamesSubtitle' })}
			exitLabel={formatMessage({ id: 'myLiveGamesBack' })}
			testId="my-live-games-page"
		>
			{body}
		</LiveCompetitionStudentShell>
	);
}
