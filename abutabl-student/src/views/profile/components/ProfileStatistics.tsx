import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import { formatXpCount } from 'views/dashboard/components/myProgressBarUtils';
import { formatClassRankLabel } from '../profileUtils';
import { PocketCard } from './profileLayout';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');
const RANKING_TROPHY = figmaDashboardAssetUrl('ranking-trophy.png');
const STREAK_ICON = figmaDashboardAssetUrl('bomb-explode-5.svg');

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const Title = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	color: #1f1e1e;
`;

const Cards = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;

	@media (max-width: 780px) {
		grid-template-columns: 1fr;
	}
`;

const StatCard = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 72px;
	padding: 12px 16px;
	border-radius: 16px;
	background: linear-gradient(135deg, #42b5a1 0%, #399f8d 100%);
	box-sizing: border-box;

	img {
		width: 34px;
		height: 34px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.label {
		display: block;
		font-family: ${theme.fonts.Nunito};
		font-weight: 700;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.9);
	}

	.value {
		display: block;
		font-family: ${theme.fonts.Fredoka};
		font-weight: 500;
		font-size: 22px;
		line-height: 1.15;
		color: ${theme.colours.white};
	}
`;

type Props = {
	totalXp: number;
	classRank?: number | null;
	streakDays: number;
};

export default function ProfileStatistics({ totalXp, classRank, streakDays }: Props) {
	const { formatMessage } = useIntl();
	const rankLabel = formatClassRankLabel(classRank);

	return (
		<Section>
			<Title>{formatMessage({ id: 'profile-statistics' })}</Title>
			<PocketCard>
				<Cards>
					<StatCard>
						<img src={STAR_ICON} alt="" />
						<div>
							<span className="label">{formatMessage({ id: 'dashboard-total-points' })}</span>
							<strong className="value">{formatXpCount(totalXp)}</strong>
						</div>
					</StatCard>
					<StatCard>
						<img src={RANKING_TROPHY} alt="" />
						<div>
							<span className="label">{formatMessage({ id: 'dashboard-current-ranking' })}</span>
							<strong className="value">{rankLabel ?? '—'}</strong>
						</div>
					</StatCard>
					<StatCard>
						<img src={STREAK_ICON} alt="" />
						<div>
							<span className="label">{formatMessage({ id: 'profile-day-streak' })}</span>
							<strong className="value">{streakDays}</strong>
						</div>
					</StatCard>
				</Cards>
			</PocketCard>
		</Section>
	);
}
