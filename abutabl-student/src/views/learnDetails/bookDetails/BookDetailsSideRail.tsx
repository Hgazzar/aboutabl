import { useIntl } from 'react-intl';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import type { DashboardQuestItem, DashboardQuestsPayload } from 'lib/dashboardApi';
import type { ProfileAchievement } from 'views/profile/types';
import { badgeStarsFilled } from 'views/myProgress/myProgressUtils';
import {
	questProgressPercent,
	safeQuestProgressCounts,
} from 'views/dashboard/components/myQuestsUtils';
import {
	AsideCard,
	AsideTitle,
	MascotBlock,
	MascotCaption,
	MascotImg,
	QuestFill,
	QuestRow,
	QuestTitle,
	QuestTrack,
	StarSlot,
	StarsRow,
	ViewAllLink,
} from './bookDetailsStyles';

const BIRD = figmaDashboardAssetUrl('recommended-bird-books.png');
const STAR_SLOTS = 4;

type Props = {
	bookTitle: string;
	achievements: ProfileAchievement[];
	quests: DashboardQuestsPayload | null | undefined;
};

export default function BookDetailsSideRail({ bookTitle, achievements, quests }: Props) {
	const { formatMessage } = useIntl();
	const filled = badgeStarsFilled(achievements, STAR_SLOTS);
	const questItems = (quests?.items ?? []).slice(0, 2);

	return (
		<>
			<AsideCard data-testid="book-details-mascot">
				<MascotBlock>
					<MascotImg src={BIRD} alt="" />
					<MascotCaption>{formatMessage({ id: 'book-details-current-book' })}</MascotCaption>
					<p style={{ margin: 0, textAlign: 'center', fontWeight: 700, color: '#442817' }}>
						{bookTitle}
					</p>
				</MascotBlock>
			</AsideCard>

			<AsideCard data-testid="book-details-achievements">
				<AsideTitle>{formatMessage({ id: 'my-progress-achievements-widget' })}</AsideTitle>
				<p style={{ margin: 0, textAlign: 'center', fontFamily: 'Fredoka, sans-serif', fontSize: 18 }}>
					{formatMessage({ id: 'book-details-stars-caption' }, { count: filled })}
				</p>
				<StarsRow
					aria-label={formatMessage(
						{ id: 'my-progress-book-stars' },
						{ filled, total: STAR_SLOTS }
					)}
				>
					{Array.from({ length: STAR_SLOTS }, (_, i) => (
						<StarSlot key={i} $filled={i < filled} />
					))}
				</StarsRow>
				<ViewAllLink to="/progress#my-progress-achievements">
					{formatMessage({ id: 'my-progress-view-all' })}
				</ViewAllLink>
			</AsideCard>

			<AsideCard data-testid="book-details-quests">
				<AsideTitle>{formatMessage({ id: 'dashboard-my-quests' })}</AsideTitle>
				{questItems.length === 0 ? (
					<p style={{ margin: 0, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
						{formatMessage({ id: 'book-details-quests-empty' })}
					</p>
				) : (
					questItems.map((quest: DashboardQuestItem) => {
						const counts = safeQuestProgressCounts(quest);
						const percent = questProgressPercent(quest);
						const label = formatMessage(
							{ id: 'dashboard-quest-goal' },
							{ unit: quest.unit_label, subject: quest.subject_name }
						);
						return (
							<QuestRow key={quest.id}>
								<QuestTitle>{label}</QuestTitle>
								<QuestTrack>
									<QuestFill $percent={percent} />
								</QuestTrack>
								<span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
									{counts.current} / {counts.target}
								</span>
							</QuestRow>
						);
					})
				)}
				<ViewAllLink to="/learn">{formatMessage({ id: 'dashboard-view-more' })}</ViewAllLink>
			</AsideCard>
		</>
	);
}
