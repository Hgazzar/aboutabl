import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useMemo } from 'react';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { DashboardXpPayload } from 'lib/dashboardApi';
import barFrameGapRaw from 'assets/images/figma/dashboard/bar-frame-gap.svg?raw';
import {
	BAR_TRACK_HEIGHT_PERCENT,
	BAR_TRACK_LEFT_PERCENT,
	BAR_TRACK_TOP_PERCENT,
	BAR_TRACK_WIDTH_PERCENT,
	applyEqualTrackMarkerSpacing,
	applyTrackLevelStates,
	clampFillPercent,
	formatSignedWeeklyXp,
	formatXpCount,
	stripBakedBarFillFromSvg,
	weeklyXpTrend,
} from './myProgressBarUtils';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');
const RANKING_TROPHY = figmaDashboardAssetUrl('ranking-trophy.png');
const PROGRESS_ARROW_UP = figmaDashboardAssetUrl('progress-arrow-up.svg');
const ACHIEVER_BADGE = figmaDashboardAssetUrl('achiever-badge.svg');
const FLASH_ICON = figmaDashboardAssetUrl('flash-4.svg');

/** Figma `Frame 427319668` / `subHead1` (1960:1472) inside `myProgressFrame`. */
const WIDGET_PADDING_X = 32;
const WIDGET_PADDING_Y = 24;

const WidgetCard = styled.section`
	background: ${theme.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: ${WIDGET_PADDING_Y}px ${WIDGET_PADDING_X}px;
	box-sizing: border-box;
`;

const SubHead = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
	min-height: 66px;
	margin-bottom: 8px;
`;

const Title = styled.h2`
	margin: 0;
	flex: 0 0 auto;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.35;
	color: #442817;
`;

const StatPills = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 25px;
	flex: 1 1 auto;
	justify-content: flex-start;
`;

const StatPill = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
	min-width: 212px;
	min-height: 61px;
	padding: 10px 20px;
	border-radius: 16px;
	background: linear-gradient(135deg, #42b5a1 0%, #399f8d 100%);
	box-sizing: border-box;

	img {
		width: 34px;
		height: 32px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.label {
		display: block;
		font-family: ${theme.fonts.Nunito};
		font-size: 14px;
		line-height: 1.3;
		color: rgba(255, 255, 255, 0.92);
		text-transform: capitalize;
	}

	.value {
		display: block;
		font-family: ${theme.fonts.Fredoka};
		font-weight: 500;
		font-size: 20px;
		line-height: 1.2;
		color: ${theme.colours.white};
	}
`;

const ViewMoreLink = styled(Link)`
	margin-inline-start: auto;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: #408fd1;
	white-space: nowrap;

	&:hover {
		filter: brightness(1.05);
	}
`;

const ProgressFrame = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 110px;
	grid-template-rows: auto auto;
	column-gap: 12px;
	row-gap: 8px;
	box-sizing: border-box;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const LevelRow = styled.div`
	grid-column: 1;
	grid-row: 1;
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
	transform: translateY(-27px);

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 1;
	}
`;

const LevelLeft = styled.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 8px;
	min-width: 0;
`;

const LevelLabel = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
`;

const LevelBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 37px;
	height: 32px;
	padding: 0 8px;
	border-radius: 8px;
	background: #1ebba3;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1;
	color: ${theme.colours.white};
`;

const BadgeName = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	text-transform: capitalize;
	white-space: nowrap;
`;

const XpRatio = styled.div`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 5px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	white-space: nowrap;

	img {
		width: 26px;
		height: 24px;
		object-fit: contain;
	}
`;

const BarWrap = styled.div`
	grid-column: 1;
	grid-row: 2;
	position: relative;
	width: 100%;
	max-width: 568px;
	line-height: 0;
	align-self: end;
	transform: translateY(-36px);

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 2;
	}

	svg,
	img {
		display: block;
		width: 100%;
		height: auto;
		isolation: isolate;
	}
`;

const BarFill = styled.div<{ $percent: number }>`
	position: absolute;
	left: ${BAR_TRACK_LEFT_PERCENT}%;
	top: ${BAR_TRACK_TOP_PERCENT}%;
	height: ${BAR_TRACK_HEIGHT_PERCENT}%;
	width: calc(${BAR_TRACK_WIDTH_PERCENT}% * ${({ $percent }) => $percent / 100});
	border-radius: 6px;
	background: linear-gradient(
		90deg,
		#72d8b9 16.83%,
		#d5b454 38.94%,
		#d1b658 60.1%,
		#eac65c 77.4%,
		#e5b314 100%
	);
	pointer-events: none;
`;

const AchieverBadgeImg = styled.img<{ $unlocked: boolean }>`
	width: 110px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
	filter: ${({ $unlocked }) => ($unlocked ? 'none' : 'grayscale(1) brightness(0.92)')};
	transition: filter 0.2s ease;
`;

const AchieverBadgeWrap = styled.div`
	grid-column: 2;
	grid-row: 1;
	display: flex;
	justify-content: center;
	align-items: flex-start;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
	}
`;

const AchieverLabel = styled.span`
	grid-column: 2;
	grid-row: 2;
	justify-self: center;
	align-self: end;
	transform: translateY(-36px);
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1;
	color: #937c61;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 4;
		justify-self: center;
	}
`;

const FooterRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-top: 12px;
	width: 100%;
`;

const LevelsAway = styled.p`
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	min-width: 0;
	flex: 1 1 auto;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 16px;
	line-height: 1.4;
	color: #ea780c;

	img {
		width: 23px;
		height: 23px;
		object-fit: contain;
		flex-shrink: 0;
	}
`;

const WeeklyXpBlock = styled.div<{ $trend: 'up' | 'down' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
	min-height: 23px;
	white-space: nowrap;
	color: ${({ $trend }) => ($trend === 'up' ? '#1ebba3' : '#e05a5a')};
`;

const WeeklyXpArrow = styled.img<{ $trend: 'up' | 'down' }>`
	width: 14px;
	height: 14px;
	flex-shrink: 0;
	object-fit: contain;
	transform: ${({ $trend }) => ($trend === 'down' ? 'rotate(180deg)' : 'none')};
	filter: ${({ $trend }) =>
		$trend === 'down'
			? 'brightness(0) saturate(100%) invert(40%) sepia(62%) saturate(1400%) hue-rotate(330deg)'
			: 'none'};
`;

const WeeklyXpValue = styled.strong<{ $trend: 'up' | 'down' }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 8px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 16px;
	line-height: 1.25;
	background: ${({ $trend }) => ($trend === 'up' ? '#d8f4ee' : '#fde8e8')};
	color: ${({ $trend }) => ($trend === 'up' ? '#1ebba3' : '#e05a5a')};
`;

const WeeklyXpLabel = styled.span<{ $trend: 'up' | 'down' }>`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.25;
	color: ${({ $trend }) => ($trend === 'up' ? '#1ebba3' : '#e05a5a')};
`;

type Props = {
	xp: DashboardXpPayload;
	classRank?: number | null;
};

export default function MyProgressWidget({ xp, classRank }: Props) {
	const { formatMessage } = useIntl();

	const barFrameSvg = useMemo(
		() =>
			barFrameGapRaw
				? applyEqualTrackMarkerSpacing(
						applyTrackLevelStates(stripBakedBarFillFromSvg(barFrameGapRaw), xp.level)
				  )
				: '',
		[xp.level]
	);
	const fillPercent = clampFillPercent(xp.track?.fill_percent ?? 0);

	const xpRatioLabel =
		xp.next_level_threshold != null
			? `${xp.total_xp} / ${xp.next_level_threshold} XP`
			: `${xp.total_xp} XP`;

	const levelsAway = xp.levels_away_from_achiever;
	const isAchieverUnlocked = xp.level >= xp.achiever_level;
	const xpTrend = weeklyXpTrend(xp.weekly_xp, xp.previous_weekly_xp);

	return (
		<WidgetCard>
			<SubHead>
				<Title>{formatMessage({ id: 'dashboard-my-progress' })}</Title>
				<StatPills>
					<StatPill>
						<img src={STAR_ICON} alt="" />
						<div>
							<span className="label">{formatMessage({ id: 'dashboard-total-points' })}</span>
							<strong className="value">{formatXpCount(xp.total_xp)}</strong>
						</div>
					</StatPill>
					{classRank != null ? (
						<StatPill>
							<img src={RANKING_TROPHY} alt="" />
							<div>
								<span className="label">{formatMessage({ id: 'dashboard-current-ranking' })}</span>
								<strong className="value">#{classRank}</strong>
							</div>
						</StatPill>
					) : null}
				</StatPills>
				<ViewMoreLink to="/progress">{formatMessage({ id: 'dashboard-view-more' })}</ViewMoreLink>
			</SubHead>

			<ProgressFrame>
				<LevelRow>
					<LevelLeft>
						<LevelLabel>{formatMessage({ id: 'dashboard-level' })}</LevelLabel>
						<LevelBadge>{xp.level}</LevelBadge>
						<BadgeName>
							{formatMessage(
								{ id: 'dashboard-level-badge' },
								{ badge: xp.level_badge_label }
							)}
						</BadgeName>
					</LevelLeft>
					<XpRatio>
						<img src={STAR_ICON} alt="" />
						<span>{xpRatioLabel}</span>
					</XpRatio>
				</LevelRow>

				<BarWrap aria-hidden>
					<div dangerouslySetInnerHTML={{ __html: barFrameSvg }} />
					<BarFill $percent={fillPercent} data-fill-percent={fillPercent} />
				</BarWrap>

				<AchieverBadgeWrap>
					<AchieverBadgeImg
						src={ACHIEVER_BADGE}
						alt=""
						$unlocked={isAchieverUnlocked}
					/>
				</AchieverBadgeWrap>

				<AchieverLabel>{formatMessage({ id: 'dashboard-achiever' })}</AchieverLabel>
			</ProgressFrame>

			<FooterRow>
				<LevelsAway>
					<img src={FLASH_ICON} alt="" />
					{levelsAway > 0
						? formatMessage({ id: 'dashboard-levels-away' }, { count: levelsAway })
						: formatMessage({ id: 'dashboard-achiever-unlocked' })}
				</LevelsAway>
				<WeeklyXpBlock $trend={xpTrend}>
					<WeeklyXpArrow src={PROGRESS_ARROW_UP} alt="" $trend={xpTrend} />
					<WeeklyXpValue $trend={xpTrend}>
						{formatSignedWeeklyXp(xp.weekly_xp, xp.previous_weekly_xp)}
					</WeeklyXpValue>
					<WeeklyXpLabel $trend={xpTrend}>
						{formatMessage({ id: 'dashboard-this-week' })}
					</WeeklyXpLabel>
				</WeeklyXpBlock>
			</FooterRow>
		</WidgetCard>
	);
}
