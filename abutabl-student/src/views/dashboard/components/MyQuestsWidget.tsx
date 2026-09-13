import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { DashboardQuestItem, DashboardQuestsPayload } from 'lib/dashboardApi';
import { questCtaPath, questProgressPercent } from './myQuestsUtils';
import {
	PARCHMENT_OUTER_PADDING,
	PARCHMENT_TEXTURE,
	ParchmentInner,
	ParchmentMountContent,
	ParchmentOuter,
	ParchmentTextureImg,
} from './parchmentMountStyles';

/**
 * Figma main column `goalFrame` (`1767:1925`) — 740×251.
 * Do NOT use `goal-frame.png`: that asset is the sidebar quest list mockup (848×636)
 * with baked-in XP rows, treasure chests, and duplicate text.
 */
const QUEST_RIBBON = figmaDashboardAssetUrl('quests-ribbon.png');
const QUEST_BIRD = figmaDashboardAssetUrl('quests-bird-main.png');

const CARD_MIN_HEIGHT = 211;

const QuestInner = styled(ParchmentMountContent)`
	display: flex;
	align-items: center;
	gap: 4px;
	min-height: ${CARD_MIN_HEIGHT}px;
	padding: 12px 20px 8px;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: flex-start;
		padding: 16px;
		gap: 12px;
	}
`;

const Illustration = styled.img`
	width: 185px;
	height: 180px;
	flex-shrink: 0;
	object-fit: contain;
	object-position: left bottom;
	align-self: flex-end;
	margin-bottom: -4px;

	@media (max-width: 640px) {
		width: 150px;
		height: 146px;
		align-self: center;
		margin-bottom: 0;
	}
`;

const Content = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	flex: 1;
	min-width: 0;
	gap: 10px;
	padding: 4px 8px 8px 0;
`;

const Ribbon = styled.img`
	width: 128px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
`;

const GoalText = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 18px;
	line-height: 1.35;
	color: #442817;

	.unit {
		color: ${theme.colours.LightSeaGreen};
	}

	@media (max-width: 640px) {
		font-size: 16px;
	}
`;

const ProgressBlock = styled.div`
	width: 100%;
`;

const ProgressMeta = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-bottom: 4px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
	color: #442817;

	.total {
		color: ${theme.colours.LightSeaGreen};
	}
`;

const ProgressTrack = styled.div`
	height: 14px;
	border-radius: 999px;
	background: #d9d9d9;
	overflow: hidden;
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
`;

const ProgressFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => $percent}%;
	border-radius: 999px;
	background: ${theme.colours.LightSeaGreen};
	transition: width 0.25s ease;
`;

const StartButton = styled(Link)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 40px;
	padding: 8px 22px;
	border-radius: 12px;
	background: ${theme.colours.LightSeaGreen};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 16px;
	line-height: 1.2;
	text-decoration: none;
	box-shadow: 0 2px 6px rgba(30, 187, 163, 0.35);
	margin-top: 2px;

	&:hover {
		background: ${theme.colours.PaoloVeroneseGreen};
		color: ${theme.colours.white};
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

const EmptyText = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #5a4638;
`;

const QuestList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-height: calc((${CARD_MIN_HEIGHT}px + ${PARCHMENT_OUTER_PADDING * 2}px) * 3 + 32px);
	overflow-y: auto;
	overscroll-behavior: contain;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(30, 187, 163, 0.35);
	}
`;

type Props = {
	quests: DashboardQuestsPayload;
};

export function mainColumnQuestItems(quests: DashboardQuestsPayload): DashboardQuestItem[] {
	return (quests.items ?? []).filter((quest) => quest.quest_type === 'unit_lessons');
}

function QuestRow({ quest }: { quest: DashboardQuestItem }) {
	const { formatMessage } = useIntl();
	const percent = questProgressPercent(quest);
	const lessonsLabel = formatMessage(
		{ id: 'dashboard-quest-lessons-total' },
		{ count: quest.progress_target }
	);

	return (
		<ParchmentOuter aria-label={formatMessage({ id: 'dashboard-my-quests' })}>
			<ParchmentInner $minHeight={CARD_MIN_HEIGHT}>
				<ParchmentTextureImg src={PARCHMENT_TEXTURE} alt="" aria-hidden />
				<QuestInner>
				<Illustration src={QUEST_BIRD} alt="" aria-hidden />
				<Content>
					<Ribbon src={QUEST_RIBBON} alt={formatMessage({ id: 'dashboard-my-quests' })} />
					<GoalText>
						{formatMessage(
							{ id: 'dashboard-quest-goal' },
							{
								unit: <span className="unit">{quest.unit_label}</span>,
								subject: quest.subject_name,
							}
						)}
					</GoalText>
					<ProgressBlock>
						<ProgressMeta>
							{quest.progress_current} / <span className="total">{lessonsLabel}</span>
						</ProgressMeta>
						<ProgressTrack aria-hidden>
							<ProgressFill $percent={percent} />
						</ProgressTrack>
					</ProgressBlock>
					<StartButton to={questCtaPath(quest)}>
						{formatMessage({ id: 'dashboard-start-learning' })}
					</StartButton>
				</Content>
				</QuestInner>
			</ParchmentInner>
		</ParchmentOuter>
	);
}

export default function MyQuestsWidget({ quests }: Props) {
	const { formatMessage } = useIntl();
	const items = mainColumnQuestItems(quests);

	if (!quests.available || items.length === 0) {
		return (
			<ParchmentOuter aria-label={formatMessage({ id: 'dashboard-my-quests' })}>
				<ParchmentInner $minHeight={CARD_MIN_HEIGHT}>
					<ParchmentTextureImg src={PARCHMENT_TEXTURE} alt="" aria-hidden />
					<QuestInner>
					<Illustration src={QUEST_BIRD} alt="" aria-hidden />
					<Content>
						<Ribbon src={QUEST_RIBBON} alt={formatMessage({ id: 'dashboard-my-quests' })} />
						<EmptyText>{formatMessage({ id: 'dashboard-quests-empty-main' })}</EmptyText>
					</Content>
					</QuestInner>
				</ParchmentInner>
			</ParchmentOuter>
		);
	}

	if (items.length === 1) {
		return <QuestRow quest={items[0]} />;
	}

	return (
		<QuestList aria-label={formatMessage({ id: 'dashboard-my-quests' })}>
			{items.map((quest) => (
				<QuestRow key={quest.id} quest={quest} />
			))}
		</QuestList>
	);
}
