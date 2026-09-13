import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { DashboardPayload } from 'lib/dashboardApi';
import { fetchStudentFriends } from 'lib/friendsApi';
import { FIGMA_DEFAULT_AVATAR, resolveStudentAvatarSrc } from 'lib/studentAvatar';
import { fetchStreakCalendar, type StreakCalendarPayload } from 'lib/streakApi';
import { shouldShowStreakCount } from './learningStreakUtils';
import {
	WEEKDAY_LABELS,
	buildCalendarGrid,
	canNavigateToNextMonth,
	shiftMonth,
} from './learningStreakCalendarUtils';
import {
	createIdleFriendsSession,
	friendDisplayRows,
	isFriendsEmpty,
	shouldFetchFriends,
	type FriendsSessionState,
	type StreakPopupTab,
} from './learningStreakFriendsUtils';

const FLAME_WATERMARK = figmaDashboardAssetUrl('bomb-explode-5.svg');
const FRIENDS_HERO = figmaDashboardAssetUrl('streak-friends.png');
const NO_FRIENDS_HERO = figmaDashboardAssetUrl('streak-no-friends.png');
const FRIEND_STREAK_FLAME = figmaDashboardAssetUrl('streak-friend-flame.png');

/** Friends-tab Figma tokens — do not reuse on Personal chrome. */
const FRIENDS_PEACH = '#F3AF8B';
const FRIENDS_TEAL = '#23B8A2';
const FRIENDS_INK = '#111111';
const FRIENDS_STREAK_ON = '#D55816';
const FRIENDS_STREAK_OFF = '#B0B0B0';
const FRIENDS_BORDER = '#CCCCCC';

const Overlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 10000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px 16px;
	background: rgba(18, 12, 8, 0.55);
	box-sizing: border-box;
`;

const PopupShell = styled.div<{ $friends?: boolean }>`
	position: relative;
	width: min(${({ $friends }) => ($friends ? '372px' : '390px')}, calc(100vw - 32px));
	max-height: calc(100vh - 48px);
	overflow: hidden;
	border-radius: ${({ $friends }) => ($friends ? '28px' : '24px')};
	background: ${({ $friends }) => ($friends ? FRIENDS_PEACH : '#ffffff')};
	box-shadow: 0 18px 48px rgba(68, 40, 23, 0.22);
	display: flex;
	flex-direction: column;
`;

const Header = styled.div<{ $friends?: boolean }>`
	position: relative;
	z-index: 3;
	padding: ${({ $friends }) => ($friends ? '14px 14px 0' : '18px 18px 0')};
	background: ${({ $friends }) => ($friends ? FRIENDS_PEACH : '#fff8ef')};
`;

const CloseButton = styled.button<{ $friends?: boolean }>`
	position: absolute;
	z-index: 5;
	left: ${({ $friends }) => ($friends ? '10px' : '14px')};
	top: ${({ $friends }) => ($friends ? '10px' : '14px')};
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${({ $friends }) => ($friends ? '30px' : '32px')};
	height: ${({ $friends }) => ($friends ? '30px' : '32px')};
	padding: 0;
	border: none;
	border-radius: 50%;
	background: #ffffff;
	color: ${({ $friends }) => ($friends ? '#9a9a9a' : '#6b5a4a')};
	font-family: ${theme.fonts.Nunito};
	font-size: ${({ $friends }) => ($friends ? '20px' : '22px')};
	font-weight: 800;
	line-height: 1;
	cursor: pointer;
	box-shadow: ${({ $friends }) =>
		$friends ? '0 1px 4px rgba(0, 0, 0, 0.08)' : '0 2px 8px rgba(68, 40, 23, 0.12)'};

	&:focus-visible {
		outline: 2px solid ${theme.colours.LightSeaGreen};
		outline-offset: 2px;
	}
`;

const Title = styled.h2<{ $friends?: boolean }>`
	margin: ${({ $friends }) => ($friends ? '0 0 10px' : '0 0 14px')};
	padding-top: 4px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: ${({ $friends }) => ($friends ? '24px' : '22px')};
	line-height: 1.2;
	color: ${({ $friends }) => ($friends ? FRIENDS_INK : '#442817')};
	text-align: center;
`;

const TabRow = styled.div<{ $friends?: boolean }>`
	display: grid;
	grid-template-columns: 1fr 1fr;
	border-bottom: ${({ $friends }) =>
		$friends ? 'none' : '1px solid rgba(68, 40, 23, 0.12)'};
`;

const TabButton = styled.button<{ $active?: boolean; $friendsChrome?: boolean }>`
	padding: ${({ $friendsChrome }) => ($friendsChrome ? '10px 8px 11px' : '10px 8px 12px')};
	border: none;
	background: transparent;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: ${({ $friendsChrome }) => ($friendsChrome ? '12px' : '11px')};
	letter-spacing: 0.06em;
	color: ${({ $active, $friendsChrome }) => {
		if ($friendsChrome) return $active ? FRIENDS_TEAL : FRIENDS_INK;
		return $active ? theme.colours.LightSeaGreen : '#442817';
	}};
	cursor: pointer;
	border-bottom: ${({ $active, $friendsChrome }) => {
		if ($friendsChrome) {
			return $active ? `3px solid ${FRIENDS_TEAL}` : `1px solid rgba(0, 0, 0, 0.12)`;
		}
		return $active
			? `3px solid ${theme.colours.LightSeaGreen}`
			: '3px solid rgba(68, 40, 23, 0.12)';
	}};
	margin-bottom: ${({ $friendsChrome, $active }) =>
		$friendsChrome && !$active ? '2px' : '0'};

	&:focus-visible {
		outline: 2px solid ${theme.colours.LightSeaGreen};
		outline-offset: -2px;
	}
`;

const Hero = styled.div<{ $friends?: boolean; $empty?: boolean }>`
	position: relative;
	min-height: ${({ $friends, $empty }) => {
		if (!$friends) return '108px';
		return $empty ? '168px' : '138px';
	}};
	padding: ${({ $friends, $empty }) => {
		if (!$friends) return '18px 20px';
		return $empty ? '10px 12px 0' : '4px 8px 8px';
	}};
	background: ${({ $friends }) => ($friends ? FRIENDS_PEACH : '#fff4d6')};
	overflow: hidden;
	display: flex;
	align-items: ${({ $friends }) => ($friends ? 'flex-end' : 'center')};
	justify-content: ${({ $friends }) => ($friends ? 'center' : 'flex-start')};
`;

const HeroFlame = styled.img`
	position: absolute;
	right: -8px;
	top: 50%;
	transform: translateY(-50%);
	width: 120px;
	height: 120px;
	opacity: 0.35;
	object-fit: contain;
	pointer-events: none;
	user-select: none;
`;

const HeroStreak = styled.p`
	position: relative;
	z-index: 1;
	margin: 0;
	max-width: 62%;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 28px;
	line-height: 1.15;
	color: #d9a56d;
`;

const FriendsHeroArt = styled.img<{ $empty?: boolean }>`
	display: block;
	width: ${({ $empty }) => ($empty ? '132px' : 'min(300px, 90%)')};
	height: auto;
	max-height: ${({ $empty }) => ($empty ? '152px' : '126px')};
	object-fit: contain;
	object-position: center bottom;
	pointer-events: none;
	user-select: none;
	/* Empty: keep green bottom flush with peach→white edge (no sink into white). */
	transform: none;
	margin-bottom: 0;
`;

const Body = styled.div<{ $friends?: boolean; $empty?: boolean }>`
	padding: ${({ $friends, $empty }) => {
		if (!$friends) return '18px 18px 22px';
		if ($empty) return '20px 14px 30px';
		return '14px 14px 18px';
	}};
	overflow-y: auto;
	background: #ffffff;
	border-radius: ${({ $friends }) => ($friends ? '18px 18px 0 0' : '20px 20px 0 0')};
	margin-top: ${({ $friends, $empty }) => {
		if (!$friends) return '-12px';
		/* Empty: no overlap so bird bottom sits on the peach/white seam */
		return $empty ? '0' : '-8px';
	}};
	position: relative;
	z-index: 1;
	flex: 1;
	min-height: 0;
`;

const CalendarHeading = styled.h3`
	margin: 0 0 12px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.2;
	color: #442817;
`;

const MonthNav = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 18px;
	margin-bottom: 14px;
`;

const MonthNavButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	padding: 0;
	border: none;
	background: transparent;
	color: #b7a996;
	font-size: 20px;
	line-height: 1;
	cursor: pointer;

	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid ${theme.colours.LightSeaGreen};
		outline-offset: 2px;
		border-radius: 4px;
	}
`;

const MonthLabel = styled.span`
	min-width: 120px;
	text-align: center;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.08em;
	color: #9a8775;
`;

const WeekdayRow = styled.div`
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	margin-bottom: 8px;
`;

const WeekdayLabel = styled.span`
	text-align: center;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	color: #c9b9a8;
`;

const DayGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	row-gap: 10px;
`;

const DayCell = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 34px;
`;

const DayBadge = styled.span<{ $status: string | null }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1;
	color: ${({ $status }) => {
		if ($status === 'completed' || $status === 'today_pending') return '#ffffff';
		return '#b7a996';
	}};
	background: ${({ $status }) => {
		if ($status === 'completed') return '#e86f2a';
		if ($status === 'today_pending') return '#4a4a4a';
		return 'transparent';
	}};
`;

const StatusText = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	color: #937c61;
	text-align: center;
`;

const FriendStreaksHeading = styled.h3`
	margin: 4px 0 10px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.2;
	color: ${FRIENDS_INK};
`;

const FriendList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0 10px;
	border: 1px solid ${FRIENDS_BORDER};
	border-radius: 12px;
	background: #ffffff;
	max-height: min(360px, 48vh);
	overflow-y: auto;
`;

const FriendRow = styled.li`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 2px;

	&:not(:last-child) {
		border-bottom: 1px solid #e0e0e0;
	}
`;

const FriendAvatar = styled.img`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
	flex-shrink: 0;
	background: #efe8ff;
	box-shadow: 0 2px 8px rgba(68, 40, 23, 0.18);
`;

const FriendMeta = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const FriendName = styled.span`
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.15;
	color: ${FRIENDS_INK};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const FriendStreak = styled.span<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	color: ${({ $active }) => ($active ? FRIENDS_STREAK_ON : FRIENDS_STREAK_OFF)};
`;

const FriendFlame = styled.img<{ $active: boolean }>`
	width: 13px;
	height: 15px;
	object-fit: contain;
	filter: ${({ $active }) => ($active ? 'none' : 'grayscale(1) opacity(0.72) brightness(1.2)')};
`;

const EmptyTitle = styled.h3`
	margin: 14px 0 12px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.25;
	color: ${FRIENDS_INK};
	text-align: center;
`;

const EmptyBody = styled.p`
	margin: 0 auto;
	max-width: 320px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 500;
	font-size: 14px;
	line-height: 1.45;
	color: ${FRIENDS_INK};
	text-align: center;
`;

type Props = {
	opened: boolean;
	onClose: () => void;
	streak: DashboardPayload['streak'];
};

function monthLabel(year: number, month: number, locale: string): string {
	const date = new Date(year, month - 1, 1);
	return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
		.format(date)
		.toUpperCase();
}

function friendAvatarSrc(photoUrl: string | null): string {
	if (photoUrl?.trim()) {
		return resolveStudentAvatarSrc({ photoUrl });
	}
	return FIGMA_DEFAULT_AVATAR;
}

export default function LearningStreakPopup({ opened, onClose, streak }: Props) {
	const { formatMessage, locale } = useIntl();
	const now = useMemo(() => new Date(), [opened]);
	const [tab, setTab] = useState<StreakPopupTab>('personal');
	const [visibleYear, setVisibleYear] = useState(now.getFullYear());
	const [visibleMonth, setVisibleMonth] = useState(now.getMonth() + 1);
	const [calendar, setCalendar] = useState<StreakCalendarPayload | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [friendsSession, setFriendsSession] = useState<FriendsSessionState>(createIdleFriendsSession);
	const friendsFetchedRef = useRef(false);

	useEffect(() => {
		if (!opened) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [opened]);

	useEffect(() => {
		if (!opened) return;

		setTab('personal');
		setVisibleYear(now.getFullYear());
		setVisibleMonth(now.getMonth() + 1);
		setFriendsSession(createIdleFriendsSession());
		friendsFetchedRef.current = false;
	}, [opened, now]);

	useEffect(() => {
		if (!opened) return;
		if (tab !== 'personal') return;

		const controller = new AbortController();
		setLoading(true);
		setError(null);

		fetchStreakCalendar(visibleYear, visibleMonth, controller.signal)
			.then((payload) => {
				setCalendar(payload);
			})
			.catch((fetchError: unknown) => {
				if (controller.signal.aborted) return;
				const message =
					fetchError instanceof Error
						? fetchError.message
						: formatMessage({ id: 'dashboard-streak-popup-load-error' });
				setError(message);
				setCalendar(null);
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			});

		return () => controller.abort();
	}, [opened, tab, visibleYear, visibleMonth, formatMessage]);

	useEffect(() => {
		if (!opened) return;
		if (tab !== 'friends') return;
		if (friendsFetchedRef.current) return;
		if (!shouldFetchFriends(tab, friendsSession)) return;

		const controller = new AbortController();
		setFriendsSession({ status: 'loading', payload: null, error: null });

		fetchStudentFriends(controller.signal)
			.then((payload) => {
				friendsFetchedRef.current = true;
				setFriendsSession({
					status: 'success',
					payload,
					error: null,
				});
			})
			.catch((fetchError: unknown) => {
				if (controller.signal.aborted) return;
				friendsFetchedRef.current = true;
				const message =
					fetchError instanceof Error
						? fetchError.message
						: formatMessage({ id: 'dashboard-streak-friends-load-error' });
				setFriendsSession({
					status: 'error',
					payload: null,
					error: message,
				});
			});

		return () => controller.abort();
		// friendsSession intentionally omitted — session cache is gated by friendsFetchedRef
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened, tab, formatMessage]);

	const grid = useMemo(() => {
		if (!calendar) return [];
		return buildCalendarGrid(calendar.year, calendar.month, calendar.days);
	}, [calendar]);

	const showCount = shouldShowStreakCount(streak);
	const canGoNext = canNavigateToNextMonth(visibleYear, visibleMonth, now);
	const friendsRows = friendDisplayRows(friendsSession.payload);
	const friendsEmpty = isFriendsEmpty(friendsSession.payload);
	const isFriendsTab = tab === 'friends';
	const friendsEmptyView =
		isFriendsTab && friendsSession.status === 'success' && friendsEmpty;

	if (!opened) return null;

	return createPortal(
		<Overlay
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<PopupShell
				role="dialog"
				aria-modal="true"
				$friends={isFriendsTab}
				aria-label={formatMessage({ id: 'dashboard-streak-popup-title' })}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<Header $friends={isFriendsTab}>
					<CloseButton
						type="button"
						$friends={isFriendsTab}
						onClick={onClose}
						aria-label={formatMessage({ id: 'dashboard-streak-popup-close' })}
					>
						×
					</CloseButton>
					<Title $friends={isFriendsTab}>
						{formatMessage({ id: 'dashboard-streak-popup-title' })}
					</Title>
					<TabRow $friends={isFriendsTab}>
						<TabButton
							type="button"
							$active={tab === 'personal'}
							$friendsChrome={isFriendsTab}
							aria-current={tab === 'personal' ? 'page' : undefined}
							onClick={() => setTab('personal')}
						>
							{formatMessage({ id: 'dashboard-streak-tab-personal' })}
						</TabButton>
						<TabButton
							type="button"
							$active={tab === 'friends'}
							$friendsChrome={isFriendsTab}
							aria-current={tab === 'friends' ? 'page' : undefined}
							onClick={() => setTab('friends')}
						>
							{formatMessage({ id: 'dashboard-streak-tab-friends' })}
						</TabButton>
					</TabRow>
				</Header>

				{tab === 'personal' ? (
					<>
						<Hero>
							<HeroFlame src={FLAME_WATERMARK} alt="" aria-hidden />
							{showCount ? (
								<HeroStreak>
									{formatMessage({ id: 'dashboard-streak-days' }, { count: streak.current_streak })}
								</HeroStreak>
							) : (
								<HeroStreak>{formatMessage({ id: 'dashboard-streak-empty' })}</HeroStreak>
							)}
						</Hero>

						<Body>
							<CalendarHeading>
								{formatMessage({ id: 'dashboard-streak-calendar-heading' })}
							</CalendarHeading>

							<MonthNav>
								<MonthNavButton
									type="button"
									aria-label={formatMessage({ id: 'dashboard-streak-calendar-prev' })}
									onClick={() => {
										const next = shiftMonth(visibleYear, visibleMonth, -1);
										setVisibleYear(next.year);
										setVisibleMonth(next.month);
									}}
								>
									‹
								</MonthNavButton>
								<MonthLabel>{monthLabel(visibleYear, visibleMonth, locale)}</MonthLabel>
								<MonthNavButton
									type="button"
									aria-label={formatMessage({ id: 'dashboard-streak-calendar-next' })}
									disabled={!canGoNext}
									onClick={() => {
										if (!canGoNext) return;
										const next = shiftMonth(visibleYear, visibleMonth, 1);
										setVisibleYear(next.year);
										setVisibleMonth(next.month);
									}}
								>
									›
								</MonthNavButton>
							</MonthNav>

							<WeekdayRow>
								{WEEKDAY_LABELS.map((label, index) => (
									<WeekdayLabel key={`${label}-${index}`}>{label}</WeekdayLabel>
								))}
							</WeekdayRow>

							{loading ? (
								<StatusText>{formatMessage({ id: 'dashboard-streak-calendar-loading' })}</StatusText>
							) : error ? (
								<StatusText>{error}</StatusText>
							) : (
								<DayGrid>
									{grid.map((cell, index) => (
										<DayCell key={cell.date ?? `pad-${index}`}>
											{cell.day ? <DayBadge $status={cell.status}>{cell.day}</DayBadge> : null}
										</DayCell>
									))}
								</DayGrid>
							)}
						</Body>
					</>
				) : (
					<>
						<Hero $friends $empty={friendsEmptyView}>
							<FriendsHeroArt
								$empty={friendsEmptyView}
								src={friendsEmptyView ? NO_FRIENDS_HERO : FRIENDS_HERO}
								alt=""
								aria-hidden
							/>
						</Hero>

						<Body $friends $empty={friendsEmptyView}>
							{friendsSession.status === 'loading' || friendsSession.status === 'idle' ? (
								<StatusText>{formatMessage({ id: 'dashboard-streak-friends-loading' })}</StatusText>
							) : friendsSession.status === 'error' ? (
								<StatusText>{friendsSession.error}</StatusText>
							) : friendsEmpty ? (
								<>
									<EmptyTitle>
										{formatMessage({ id: 'dashboard-streak-no-friends-title' })}
									</EmptyTitle>
									<EmptyBody>
										{formatMessage({ id: 'dashboard-streak-no-friends-body' })}
									</EmptyBody>
								</>
							) : (
								<>
									<FriendStreaksHeading>
										{formatMessage({ id: 'dashboard-streak-friend-streaks' })}
									</FriendStreaksHeading>
									<FriendList>
										{friendsRows.map((friend) => (
											<FriendRow key={friend.student_id}>
												<FriendAvatar
													src={friendAvatarSrc(friend.photo_url)}
													alt=""
												/>
												<FriendMeta>
													<FriendName>{friend.name}</FriendName>
													<FriendStreak $active={friend.streak_active}>
														<FriendFlame
															src={FRIEND_STREAK_FLAME}
															$active={friend.streak_active}
															alt=""
															aria-hidden
														/>
														{friend.current_streak}
													</FriendStreak>
												</FriendMeta>
											</FriendRow>
										))}
									</FriendList>
								</>
							)}
						</Body>
					</>
				)}
			</PopupShell>
		</Overlay>,
		document.body
	);
}
