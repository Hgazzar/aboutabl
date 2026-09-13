import { useIntl } from 'react-intl';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import type { MyProgressStatistics as Stats } from 'lib/myProgressApi';
import {
	formatStatSchoolRank,
	formatStatStreakDays,
	formatStatTotalXp,
} from './myProgressUtils';
import { PocketCard, Section, SectionTitle, StatCard, StatsGrid } from './styles';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');
const RANKING_TROPHY = figmaDashboardAssetUrl('ranking-trophy.png');
const STREAK_ICON = figmaDashboardAssetUrl('bomb-explode-5.svg');

type Props = {
	statistics: Stats;
};

/** Same pocket + teal cards layout as profile `ProfileStatistics`; labels/data unchanged. */
export default function MyProgressStatistics({ statistics }: Props) {
	const { formatMessage } = useIntl();

	return (
		<Section>
			<SectionTitle>{formatMessage({ id: 'my-progress-statistics' })}</SectionTitle>
			<PocketCard>
				<StatsGrid>
					<StatCard data-stat="total-xp">
						<img src={STAR_ICON} alt="" />
						<div>
							<span className="label">{formatMessage({ id: 'my-progress-total-xp-label' })}</span>
							<strong className="value">{formatStatTotalXp(statistics.total_xp)}</strong>
						</div>
					</StatCard>
					{statistics.current_rank != null ? (
						<StatCard data-stat="rank">
							<img src={RANKING_TROPHY} alt="" />
							<div>
								<span className="label">
									{formatMessage({ id: 'my-progress-school-rank-label' })}
								</span>
								<strong className="value">
									{formatStatSchoolRank(statistics.current_rank)}
								</strong>
							</div>
						</StatCard>
					) : null}
					<StatCard data-stat="streak">
						<img src={STREAK_ICON} alt="" />
						<div>
							<span className="label">{formatMessage({ id: 'my-progress-streak-label' })}</span>
							<strong className="value">
								{formatStatStreakDays(statistics.current_streak)}
							</strong>
						</div>
					</StatCard>
				</StatsGrid>
			</PocketCard>
		</Section>
	);
}
