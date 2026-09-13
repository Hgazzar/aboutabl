import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import { resolveStudentAvatarSrc } from 'lib/studentAvatar';
import {
	fetchStudentLeaderboard,
	type LeaderboardPayload,
	type LeaderboardRange,
	type LeaderboardScope,
} from 'lib/leaderboardApi';
import {
	LEADERBOARD_RANGES,
	LEADERBOARD_SCOPES,
	applyLeaderboardFiltersToSearchParams,
	boardTitleKey,
	formatOrdinalEn,
	formatRankDelta,
	formatSignedPoints,
	formatSignedRangeXp,
	heroTitleLine1Key,
	heroTitleLine2Key,
	isLeaderboardEmpty,
	rangeLabelKey,
	rankingTierForRank,
	readLeaderboardFiltersFromSearchParams,
	scopeLabelKey,
	summaryScopeTitleKey,
} from './leaderboardUtils';
import {
	Avatar,
	BackLink,
	BoardCard,
	DashboardAside,
	DeltaArrow,
	DeltaLine,
	EmptyState,
	ErrorBanner,
	FiltersRow,
	Hero,
	HeroArtWrap,
	HeroBird,
	HeroBoardLabel,
	HeroCopy,
	HeroSpark,
	HeroSubtitle,
	HeroTitle,
	HeroTitleLine,
	LeaderboardMainColumn,
	LeaderboardPageGrid,
	List,
	NameBlock,
	RangePill,
	RangePills,
	RankCell,
	RankNumber,
	Row,
	ScopeTab,
	ScopeTabs,
	StatBlock,
	StatLabel,
	StatLine,
	StatValue,
	StatsGrid,
	StreakPill,
	StudentName,
	SummaryAvatar,
	SummaryAvatarFrame,
	SummaryCard,
	SummaryHead,
	SummaryLevelBadge,
	SummaryName,
	SummaryProfile,
	SummaryRange,
	SummaryTitle,
	TrophyBadge,
	ViewProfileLink,
	XpValue,
	YouBadge,
} from './styles';

const HERO_BIRD = figmaDashboardAssetUrl('leaderboard-bird-trophy.png');
const HERO_SPARK = figmaDashboardAssetUrl('leaderboard-spark.png');
const STREAK_FLAME = figmaDashboardAssetUrl('bomb-explode-5.svg');
const ARROW_UP = figmaDashboardAssetUrl('progress-arrow-up.svg');

function isAbortError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const candidate = error as { code?: string; name?: string };
	return (
		candidate.code === 'ERR_CANCELED' ||
		candidate.name === 'CanceledError' ||
		candidate.name === 'AbortError'
	);
}

export default function LeaderboardPage() {
	const { formatMessage, locale } = useIntl();
	const [searchParams, setSearchParams] = useSearchParams();
	const { scope, range } = readLeaderboardFiltersFromSearchParams(searchParams);

	const [data, setData] = useState<LeaderboardPayload | null>(null);
	const [initialLoading, setInitialLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestIdRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);
	const hasDataRef = useRef(false);

	const setFilters = useCallback(
		(nextScope: LeaderboardScope, nextRange: LeaderboardRange) => {
			setSearchParams(applyLeaderboardFiltersToSearchParams(searchParams, nextScope, nextRange), {
				replace: true,
			});
		},
		[searchParams, setSearchParams]
	);

	const load = useCallback(async () => {
		const requestId = ++requestIdRef.current;
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		if (!hasDataRef.current) {
			setInitialLoading(true);
		}

		try {
			const payload = await fetchStudentLeaderboard({
				scope,
				range,
				signal: controller.signal,
			});

			if (requestId !== requestIdRef.current) return;

			hasDataRef.current = true;
			setData(payload);
			setError(null);
		} catch (err) {
			if (isAbortError(err) || requestId !== requestIdRef.current) return;
			setError(getApiErrorMessage(err, formatMessage({ id: 'leaderboard-load-error' })));
		} finally {
			if (requestId === requestIdRef.current) {
				setInitialLoading(false);
			}
		}
	}, [scope, range, formatMessage]);

	useEffect(() => {
		void load();
		return () => {
			abortRef.current?.abort();
		};
	}, [load]);

	const retry = useCallback(() => {
		void load();
	}, [load]);

	if (initialLoading && !data) {
		return (
			<LeaderboardPageGrid>
				<LeaderboardMainColumn>
					<LoadingPartially />
				</LeaderboardMainColumn>
				<DashboardAside aria-hidden />
			</LeaderboardPageGrid>
		);
	}

	if (!data) {
		return (
			<LeaderboardPageGrid>
				<LeaderboardMainColumn>
					<ErrorBanner role="alert">
						<span>{error ?? formatMessage({ id: 'leaderboard-load-error' })}</span>
						{error ? (
							<button type="button" onClick={retry}>
								{formatMessage({ id: 'dashboard-retry' })}
							</button>
						) : null}
					</ErrorBanner>
				</LeaderboardMainColumn>
				<DashboardAside aria-hidden />
			</LeaderboardPageGrid>
		);
	}

	const summary = data.current_user_summary;
	const items = data.items;
	const empty = isLeaderboardEmpty(items);
	const delta = formatRankDelta(summary.rank_delta);
	const ordinal =
		locale?.toLowerCase().startsWith('ar') && summary.rank != null
			? String(summary.rank)
			: formatOrdinalEn(summary.rank);

	const heroRanked = summary.rank != null;
	const heroTitleLine1 = heroRanked
		? formatMessage({ id: heroTitleLine1Key(scope) }, { rank: ordinal })
		: formatMessage({ id: 'leaderboard-hero-unranked' });
	const heroTitleLine2 = heroRanked
		? formatMessage({ id: heroTitleLine2Key(scope) })
		: null;

	return (
		<LeaderboardPageGrid>
			<LeaderboardMainColumn>
				{error ? (
					<ErrorBanner role="alert">
						<span>{error}</span>
						<button type="button" onClick={retry}>
							{formatMessage({ id: 'dashboard-retry' })}
						</button>
					</ErrorBanner>
				) : null}

				<Hero>
					<HeroCopy>
						<HeroTitle>
							<HeroTitleLine>{heroTitleLine1}</HeroTitleLine>
							{heroTitleLine2 ? <HeroTitleLine>{heroTitleLine2}</HeroTitleLine> : null}
						</HeroTitle>
						{heroRanked ? (
							<HeroSubtitle>{formatMessage({ id: 'leaderboard-hero-subtitle' })}</HeroSubtitle>
						) : null}
						<HeroBoardLabel>{formatMessage({ id: boardTitleKey(scope) })}</HeroBoardLabel>
					</HeroCopy>
					<HeroArtWrap aria-hidden>
						<HeroSpark src={HERO_SPARK} alt="" />
						<HeroBird src={HERO_BIRD} alt="" />
					</HeroArtWrap>
				</Hero>

				<BoardCard aria-label={formatMessage({ id: 'nav-leaderboard' })}>
					<BackLink to="/learn">{formatMessage({ id: 'todo-back-dashboard' })}</BackLink>

					<FiltersRow>
						<ScopeTabs role="tablist" aria-label={formatMessage({ id: 'leaderboard-scope-label' })}>
							{LEADERBOARD_SCOPES.map((option) => (
								<ScopeTab
									key={option}
									type="button"
									role="tab"
									aria-selected={scope === option}
									$active={scope === option}
									onClick={() => setFilters(option, range)}
								>
									{formatMessage({ id: scopeLabelKey(option) })}
								</ScopeTab>
							))}
						</ScopeTabs>

						<RangePills role="group" aria-label={formatMessage({ id: 'leaderboard-range-label' })}>
							{LEADERBOARD_RANGES.map((option) => (
								<RangePill
									key={option}
									type="button"
									aria-pressed={range === option}
									$active={range === option}
									onClick={() => setFilters(scope, option)}
								>
									{formatMessage({ id: rangeLabelKey(option) })}
								</RangePill>
							))}
						</RangePills>
					</FiltersRow>

					{empty ? (
						<EmptyState>{formatMessage({ id: 'leaderboard-empty' })}</EmptyState>
					) : (
						<List>
							{items.map((row) => {
								const tier = rankingTierForRank(row.rank);
								return (
									<Row
										key={`${row.student_id}-${row.rank}`}
										$tier={tier}
										$current={row.is_current}
									>
										<RankCell>
											{tier ? (
												<TrophyBadge $tier={tier} aria-label={`#${row.rank}`}>
													{row.rank}
												</TrophyBadge>
											) : (
												<RankNumber>{row.rank}</RankNumber>
											)}
										</RankCell>
										<Avatar
											src={resolveStudentAvatarSrc({ photoUrl: row.photo_url })}
											alt=""
											width={44}
											height={44}
										/>
										<NameBlock>
											<StudentName>{row.name}</StudentName>
											{row.is_current ? (
												<YouBadge>{formatMessage({ id: 'leaderboard-you' })}</YouBadge>
											) : null}
										</NameBlock>
										<XpValue>{formatSignedRangeXp(row.xp)}</XpValue>
									</Row>
								);
							})}
						</List>
					)}
				</BoardCard>
			</LeaderboardMainColumn>

			<DashboardAside>
				<SummaryCard aria-label={formatMessage({ id: summaryScopeTitleKey(scope) })}>
					<SummaryHead>
						<SummaryTitle>{formatMessage({ id: summaryScopeTitleKey(scope) })}</SummaryTitle>
						<SummaryRange>{formatMessage({ id: rangeLabelKey(range) })}</SummaryRange>
					</SummaryHead>

					<SummaryProfile>
						<SummaryAvatarFrame>
							<SummaryAvatar
								src={resolveStudentAvatarSrc({ photoUrl: summary.photo_url })}
								alt=""
								width={100}
								height={98}
							/>
							<SummaryLevelBadge>
								{formatMessage(
									{ id: 'leaderboard-level-badge' },
									{ level: summary.level }
								)}
							</SummaryLevelBadge>
						</SummaryAvatarFrame>
						<SummaryName>{summary.name}</SummaryName>
					</SummaryProfile>

					<StatsGrid>
						<StatBlock>
							<StatLine>
								<StatLabel>{formatMessage({ id: 'leaderboard-rank-label' })}:</StatLabel>
								<StatValue>
									{summary.rank != null ? `#${summary.rank}` : '—'}
								</StatValue>
							</StatLine>
							{delta.visible ? (
								<DeltaLine $direction={delta.direction ?? 'flat'}>
									{delta.direction === 'up' ? (
										<DeltaArrow src={ARROW_UP} alt="" />
									) : delta.direction === 'down' ? (
										<DeltaArrow src={ARROW_UP} alt="" $down />
									) : null}
									<span>
										{delta.direction === 'flat'
											? formatMessage({ id: 'leaderboard-places-flat' })
											: formatMessage(
													{
														id:
															delta.direction === 'up'
																? 'leaderboard-places-up'
																: 'leaderboard-places-down',
													},
													{ count: delta.places }
												)}
									</span>
								</DeltaLine>
							) : null}
						</StatBlock>

						<StatBlock>
							<StatLine>
								<StatLabel>{formatMessage({ id: 'dashboard-total-points' })}:</StatLabel>
								<StatValue>{summary.total_xp}</StatValue>
							</StatLine>
							<DeltaLine $direction="up">
								<DeltaArrow src={ARROW_UP} alt="" />
								<span>
									{formatMessage(
										{ id: 'leaderboard-points-delta' },
										{ points: formatSignedPoints(summary.range_xp) }
									)}
								</span>
							</DeltaLine>
						</StatBlock>
					</StatsGrid>

					<StreakPill>
						<img src={STREAK_FLAME} alt="" />
						<span>
							{formatMessage(
								{ id: 'leaderboard-streak' },
								{ count: summary.current_streak }
							)}
						</span>
					</StreakPill>

					<ViewProfileLink to="/profile">
						{formatMessage({ id: 'leaderboard-view-profile' })}
					</ViewProfileLink>
				</SummaryCard>
			</DashboardAside>
		</LeaderboardPageGrid>
	);
}
