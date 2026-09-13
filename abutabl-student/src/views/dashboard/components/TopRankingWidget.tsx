import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import { resolveStudentAvatarSrc } from 'lib/studentAvatar';
import type { DashboardRankingsPayload } from 'lib/dashboardApi';
import { Card, EmptyHint } from '../styles';
import { ViewMoreLabel } from './widget6CardStyles';
import {
	formatRankingWeeklyXp,
	isTopRankingVisible,
	rankingCardWaveColor,
	rankingTierForRank,
	topRankingItems,
	type RankingTier,
} from './topRankingUtils';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');

const rankingCardWave = (waveColor: string) =>
	`url("data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 36' preserveAspectRatio='none'><path d='M0 22 C60 8 120 30 180 18 C240 6 300 28 360 14 L360 36 L0 36 Z' fill='${waveColor}'/></svg>`
	)}")`;

const tierSurfaceStyles: Record<
	RankingTier,
	ReturnType<typeof css>
> = {
	gold: css`
		background: linear-gradient(180deg, #fff8dc 0%, #fef0b8 58%, #f5e090 100%);
	`,
	silver: css`
		background: linear-gradient(180deg, #f0f4f8 0%, #e4eaf0 58%, #d8e0e8 100%);
	`,
	bronze: css`
		background: linear-gradient(180deg, #fdf0e6 0%, #f5e0d0 58%, #ecd0bc 100%);
	`,
};

const tierBadgeStyles: Record<RankingTier, ReturnType<typeof css>> = {
	gold: css`
		background: #f5c518;
		color: #5c4a10;
	`,
	silver: css`
		background: #c0c8d0;
		color: #3d4852;
	`,
	bronze: css`
		background: #cd9a6b;
		color: #4a3020;
	`,
};

const WidgetShell = styled(Card)`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 18px 16px 16px;
`;

const Title = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.35;
	color: #442817;
	text-align: center;
	text-transform: none;
`;

const Subtitle = styled(EmptyHint)`
	margin: 4px 0 14px;
	text-align: center;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.35;
	color: #8a7568;
`;

const RankingList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const RankingCard = styled.div<{ $tier: RankingTier }>`
	position: relative;
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 72px;
	padding: 10px 12px 18px;
	border-radius: 14px;
	overflow: hidden;
	box-sizing: border-box;
	${({ $tier }) => tierSurfaceStyles[$tier]};

	&::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 22px;
		background-image: ${({ $tier }) => rankingCardWave(rankingCardWaveColor($tier))};
		background-repeat: no-repeat;
		background-size: 100% 100%;
		pointer-events: none;
	}
`;

const RankBadge = styled.span<{ $tier: RankingTier }>`
	flex-shrink: 0;
	min-width: 34px;
	padding: 4px 6px;
	border-radius: 8px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 14px;
	line-height: 1;
	text-align: center;
	${({ $tier }) => tierBadgeStyles[$tier]};
`;

const Avatar = styled.img`
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid rgba(255, 255, 255, 0.85);
`;

const StudentBlock = styled.div`
	min-width: 0;
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const StudentName = styled.strong`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1.25;
	color: #442817;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const XpRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	min-width: 0;
`;

const XpIcon = styled.img`
	width: 16px;
	height: 16px;
	flex-shrink: 0;
	object-fit: contain;
	display: block;
`;

const XpValue = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	color: #6e5c4e;
	white-space: nowrap;
`;

const ViewMoreFooter = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 12px;
`;

const ViewMoreLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: none;
	background: transparent;
	text-decoration: none;
	cursor: pointer;

	&:hover ${ViewMoreLabel} {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: 2px solid ${theme.colours.LightSeaGreen};
		outline-offset: 3px;
		border-radius: 4px;
	}
`;

type Props = {
	rankings: DashboardRankingsPayload;
};

export default function TopRankingWidget({ rankings }: Props) {
	const { formatMessage } = useIntl();

	if (!isTopRankingVisible(rankings)) {
		return null;
	}

	const items = topRankingItems(rankings.items);
	const viewMoreLabel = formatMessage({ id: 'dashboard-recent-view-more' });

	return (
		<WidgetShell aria-label={formatMessage({ id: 'dashboard-top-ranking' })}>
			<Title>{formatMessage({ id: 'dashboard-top-ranking' })}</Title>
			<Subtitle>{formatMessage({ id: 'dashboard-this-week' })}</Subtitle>

			<RankingList>
				{items.map((row) => {
					const tier = rankingTierForRank(row.rank);
					if (!tier) {
						return null;
					}

					return (
						<RankingCard key={row.student_id} $tier={tier}>
							<RankBadge $tier={tier}>#{row.rank}</RankBadge>
							<Avatar
								src={resolveStudentAvatarSrc({ photoUrl: row.photo_url })}
								alt=""
								width={40}
								height={40}
							/>
							<StudentBlock>
								<StudentName>{row.name}</StudentName>
								<XpRow>
									<XpIcon src={STAR_ICON} alt="" aria-hidden />
									<XpValue>{formatRankingWeeklyXp(row.weekly_xp)}</XpValue>
								</XpRow>
							</StudentBlock>
						</RankingCard>
					);
				})}
			</RankingList>

			<ViewMoreFooter>
				<ViewMoreLink to="/leaderboard" aria-label={viewMoreLabel}>
					<ViewMoreLabel>{viewMoreLabel}</ViewMoreLabel>
				</ViewMoreLink>
			</ViewMoreFooter>
		</WidgetShell>
	);
}
