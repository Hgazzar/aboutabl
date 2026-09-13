import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import { resolveStudentAvatarSrc } from 'lib/studentAvatar';
import type { MyProgressXpRanking } from 'lib/myProgressApi';
import { formatXpCount } from 'views/dashboard/components/myProgressBarUtils';
import {
	rankingTierForRank,
	type RankingTier,
} from 'views/dashboard/components/topRankingUtils';
import { Card } from './styles';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');

const WidgetShell = styled(Card)`
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
`;

const Subtitle = styled.p`
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
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 64px;
	padding: 10px 12px;
	border-radius: 14px;
	box-sizing: border-box;
	background: ${({ $tier }) =>
		$tier === 'gold'
			? 'linear-gradient(180deg, #fff8dc 0%, #fef0b8 100%)'
			: $tier === 'silver'
				? 'linear-gradient(180deg, #f0f4f8 0%, #e4eaf0 100%)'
				: 'linear-gradient(180deg, #fdf0e6 0%, #f5e0d0 100%)'};
`;

const RankBadge = styled.span<{ $tier: RankingTier }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 36px;
	height: 28px;
	padding: 0 8px;
	border-radius: 8px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 14px;
	background: ${({ $tier }) =>
		$tier === 'gold' ? '#f5c518' : $tier === 'silver' ? '#c0c8d0' : '#cd9a6b'};
	color: ${({ $tier }) =>
		$tier === 'gold' ? '#5c4a10' : $tier === 'silver' ? '#3d4852' : '#4a3020'};
`;

const Avatar = styled.img`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
	flex-shrink: 0;
`;

const StudentBlock = styled.div`
	min-width: 0;
	flex: 1 1 auto;
`;

const StudentName = styled.div`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	color: #442817;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const XpRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-top: 2px;
`;

const XpIcon = styled.img`
	width: 14px;
	height: 14px;
	object-fit: contain;
`;

const XpValue = styled.span`
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 13px;
	color: #6b5a4a;
`;

const ViewMore = styled(Link)`
	display: block;
	margin-top: 14px;
	text-align: center;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: #408fd1;
`;

type Props = {
	ranking: MyProgressXpRanking;
};

/** XP leaderboard preview — school / all_time from StudentLeaderboardService (not dashboard class rank). */
export default function MyProgressXpRankingWidget({ ranking }: Props) {
	const { formatMessage } = useIntl();

	if (!ranking.available || ranking.items.length === 0) {
		return null;
	}

	return (
		<WidgetShell aria-label={formatMessage({ id: 'dashboard-top-ranking' })}>
			<Title>{formatMessage({ id: 'dashboard-top-ranking' })}</Title>
			<Subtitle>{formatMessage({ id: 'my-progress-ranking-all-time' })}</Subtitle>
			<RankingList>
				{ranking.items.slice(0, 3).map((row) => {
					const tier = rankingTierForRank(row.rank);
					if (!tier) return null;
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
									<XpValue>{formatXpCount(row.xp)}</XpValue>
								</XpRow>
							</StudentBlock>
						</RankingCard>
					);
				})}
			</RankingList>
			<ViewMore to="/leaderboard?scope=school&range=all_time">
				{formatMessage({ id: 'dashboard-recent-view-more' })}
			</ViewMore>
		</WidgetShell>
	);
}
