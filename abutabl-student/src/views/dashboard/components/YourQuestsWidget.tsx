import { useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { DashboardQuestItem, DashboardQuestsPayload } from 'lib/dashboardApi';
import { Card } from '../styles';
import {
	isWeeklyXpQuest,
	questProgressPercent,
	questSidebarIconFile,
	safeQuestProgressCounts,
} from './myQuestsUtils';
import { ViewMoreLabel } from './widget6CardStyles';
import YourQuestsPopup from './YourQuestsPopup';

const TREASURE_BOX = figmaDashboardAssetUrl('treasure-box.svg');

const WidgetShell = styled(Card)`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 20px 18px 18px;
`;

const Title = styled.h2`
	margin: 0 0 18px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.35;
	color: ${theme.colours.black_2};
	text-align: center;
	text-transform: none;
`;

const QuestList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
`;

const QuestRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const QuestIcon = styled.img`
	width: 32px;
	height: 32px;
	flex-shrink: 0;
	object-fit: contain;
	display: block;
`;

const TitleRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
	padding-left: 42px;
`;

const GoalText = styled.p`
	margin: 0;
	flex: 1;
	min-width: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1.35;
	color: #442817;
`;

const ProgressMeta = styled.span`
	flex-shrink: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 12px;
	line-height: 1.35;
	color: ${theme.colours.LightSeaGreen};
	white-space: nowrap;
`;

const ProgressRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const ProgressTrack = styled.div`
	flex: 1;
	height: 8px;
	border-radius: 999px;
	background: #e8e8e8;
	overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => $percent}%;
	border-radius: 999px;
	background: linear-gradient(90deg, #1ebbb3 0%, #23b8a2 55%, #4fd4b8 100%);
	transition: width 0.25s ease;
`;

const RewardIcon = styled.img`
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	object-fit: contain;
	display: block;
`;

const EmptyBody = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 10px;
	padding: 4px 8px 8px;
`;

const EmptyIconRow = styled.div`
	display: flex;
	justify-content: center;
	margin: 2px 0 4px;

	img {
		width: 88px;
		height: auto;
		object-fit: contain;
	}
`;

const EmptyText = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	line-height: 1.4;
	color: #937c61;
	text-align: center;
`;

const ViewMoreFooter = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 14px;
`;

const ViewMoreButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid ${theme.colours.LightSeaGreen};
		outline-offset: 3px;
		border-radius: 4px;
	}
`;

type Props = {
	quests: DashboardQuestsPayload;
};

export function isYourQuestsActive(quests: DashboardQuestsPayload): boolean {
	return quests.available === true && (quests.items?.length ?? 0) > 0;
}

function SidebarQuestItem({ quest }: { quest: DashboardQuestItem }) {
	const { formatMessage } = useIntl();
	const { current, target } = safeQuestProgressCounts(quest);
	const percent = questProgressPercent(quest);
	const weeklyXp = isWeeklyXpQuest(quest);
	const lessonsLabel = formatMessage(
		{ id: 'dashboard-quest-lessons-total' },
		{ count: Math.max(1, target) }
	).toLowerCase();

	return (
		<QuestRow>
			<TitleRow>
				<GoalText>
					{weeklyXp
						? formatMessage(
								{ id: 'dashboard-quest-sidebar-earn-xp' },
								{ xp: target }
							)
						: formatMessage(
								{ id: 'dashboard-quest-sidebar-goal' },
								{
									lessons: lessonsLabel,
									subject: quest.subject_name,
								}
							)}
				</GoalText>
				{weeklyXp ? null : (
					<ProgressMeta aria-hidden>
						{formatMessage(
							{ id: 'dashboard-quest-lessons' },
							{ current, total: target }
						)}
					</ProgressMeta>
				)}
			</TitleRow>
			<ProgressRow>
				<QuestIcon src={figmaDashboardAssetUrl(questSidebarIconFile(quest))} alt="" aria-hidden />
				<ProgressTrack aria-hidden>
					<ProgressFill $percent={percent} />
				</ProgressTrack>
				<RewardIcon src={TREASURE_BOX} alt="" aria-hidden />
			</ProgressRow>
		</QuestRow>
	);
}

export default function YourQuestsWidget({ quests }: Props) {
	const { formatMessage } = useIntl();
	const [popupOpen, setPopupOpen] = useState(false);
	const items = quests.items ?? [];
	const hasActiveQuests = isYourQuestsActive(quests);

	return (
		<>
			<WidgetShell aria-label={formatMessage({ id: 'dashboard-my-quests' })}>
				<Title>{formatMessage({ id: 'dashboard-my-quests' })}</Title>

				{hasActiveQuests ? (
					<QuestList>
						{items.map((quest) => (
							<SidebarQuestItem key={quest.id} quest={quest} />
						))}
					</QuestList>
				) : (
					<EmptyBody>
						<EmptyIconRow>
							<img src={TREASURE_BOX} alt="" aria-hidden />
						</EmptyIconRow>
						<EmptyText>{formatMessage({ id: 'dashboard-quests-empty' })}</EmptyText>
					</EmptyBody>
				)}

				<ViewMoreFooter>
					<ViewMoreButton
						type="button"
						onClick={() => setPopupOpen(true)}
						aria-label={formatMessage({ id: 'dashboard-recent-view-more' })}
					>
						<ViewMoreLabel>{formatMessage({ id: 'dashboard-recent-view-more' })}</ViewMoreLabel>
					</ViewMoreButton>
				</ViewMoreFooter>
			</WidgetShell>

			<YourQuestsPopup opened={popupOpen} onClose={() => setPopupOpen(false)} quests={quests} />
		</>
	);
}
