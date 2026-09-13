import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { DashboardQuestItem, DashboardQuestsPayload } from 'lib/dashboardApi';
import {
	isWeeklyXpQuest,
	popupQuestItems,
	questPopupIconFile,
	questProgressPercent,
	questRewardXpAmount,
	safeQuestProgressCounts,
} from './myQuestsUtils';

/** Figma quests popup frame — 881×636 (original reference). */
const FRAME_W = 881;
const FRAME_H = 636;

const PARCHMENT = figmaDashboardAssetUrl('quests-popup-parchment.png');
const RIBBON = figmaDashboardAssetUrl('quests-popup-ribbon.png');
const BIRD = figmaDashboardAssetUrl('quests-popup-bird.png');
const TREASURE_REWARD = figmaDashboardAssetUrl('quests-popup-treasure-reward.png');

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

const PopupCanvas = styled.div`
	position: relative;
	width: min(${FRAME_W}px, calc(100vw - 32px));
	line-height: 0;
`;

const ParchmentBg = styled.img`
	display: block;
	width: 100%;
	height: auto;
	pointer-events: none;
	user-select: none;
`;

const PopupLayer = styled.div`
	position: absolute;
	inset: 0;
	line-height: normal;
`;

const CloseButton = styled.button`
	position: absolute;
	z-index: 5;
	left: 3.2%;
	top: 3.5%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	padding: 0;
	border: none;
	background: transparent;
	color: #442817;
	font-family: ${theme.fonts.Nunito};
	font-size: 28px;
	font-weight: 800;
	line-height: 1;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
		border-radius: 6px;
	}
`;

const Ribbon = styled.img`
	position: absolute;
	z-index: 3;
	left: 5.9%;
	top: 6%;
	width: 32.35%;
	height: auto;
	object-fit: contain;
	pointer-events: none;
	user-select: none;
`;

const BirdArt = styled.img`
	position: absolute;
	z-index: 2;
	top: 1.5%;
	right: 2%;
	width: 50%;
	height: auto;
	object-fit: contain;
	object-position: top right;
	pointer-events: none;
	user-select: none;
`;

/** Figma RR subtitle — Fredoka Medium 29.95px, aligned with quest icons. */
const Subtitle = styled.p`
	position: absolute;
	z-index: 3;
	left: 5.9%;
	top: 31.8%;
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(20px, calc(min(${FRAME_W}px, 100vw - 32px) * 0.034), 29.95px);
	line-height: 100%;
	letter-spacing: 0.2px;
	text-align: left;
	text-transform: capitalize;
	white-space: nowrap;
	color: #442817;
`;

const QuestList = styled.div`
	position: absolute;
	z-index: 3;
	left: 5.9%;
	right: 5.9%;
	top: 39%;
	bottom: 5.5%;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 22px;
	overflow-y: auto;
	overscroll-behavior: contain;
	padding-right: 4px;
	box-sizing: border-box;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(30, 187, 163, 0.35);
	}
`;

/** Reward block — full chest + beige bar (quests-popup-treasure-reward.png). */
const TREASURE_IMG_WIDTH = 150;
const TREASURE_BEIGE_LEFT = Math.round((90 / 186) * TREASURE_IMG_WIDTH);
const TREASURE_BEIGE_WIDTH = TREASURE_IMG_WIDTH - TREASURE_BEIGE_LEFT;
const TREASURE_IMG_HEIGHT = Math.round((93 / 186) * TREASURE_IMG_WIDTH);
const PROGRESS_BAR_SHRINK = 350;
const REWARD_BLOCK_SHIFT = 180;
const REWARD_FONT_SCALE = TREASURE_IMG_WIDTH / 88;

const QUEST_TITLE_LINE_HEIGHT = Math.round(16 * 1.3);
/** Push title down so its top aligns with icon top while icon stays bottom-aligned with progress. */
const QUEST_TITLE_SHIFT_DOWN =
	QUEST_TITLE_LINE_HEIGHT + 4 + TREASURE_IMG_HEIGHT - 62;

const QuestRow = styled.div`
	display: grid;
	grid-template-columns: 62px minmax(0, 1fr);
	align-items: end;
	column-gap: 0;
	row-gap: 4px;
`;

const QuestIcon = styled.img`
	width: 62px;
	height: 62px;
	object-fit: contain;
	display: block;
	align-self: end;

	@media (max-width: 640px) {
		width: 52px;
		height: 52px;
	}
`;

const QuestMain = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
	margin-left: 20px;
	overflow: visible;
`;

const QuestTitle = styled.p`
	margin: 0;
	transform: translateY(${QUEST_TITLE_SHIFT_DOWN}px);
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 16px;
	line-height: 1.3;
	color: #442817;
`;

const ProgressRow = styled.div`
	position: relative;
	width: 100%;
	min-width: 0;
	min-height: ${TREASURE_IMG_HEIGHT}px;
	overflow: visible;
`;

const ProgressColumn = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	box-sizing: border-box;
`;

const PROGRESS_META_SHIFT_UP = 5;

const ProgressMeta = styled.div`
	width: max(80px, calc(100% - ${PROGRESS_BAR_SHRINK}px));
	max-width: max(80px, calc(100% - ${PROGRESS_BAR_SHRINK}px));
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1.2;
	color: ${theme.colours.LightSeaGreen};
	text-align: end;
	transform: translateY(-${PROGRESS_META_SHIFT_UP}px);
`;

const ProgressTrack = styled.div`
	width: max(80px, calc(100% - ${PROGRESS_BAR_SHRINK}px));
	max-width: max(80px, calc(100% - ${PROGRESS_BAR_SHRINK}px));
	height: 14px;
	border-radius: 999px;
	background: #4b6f74;
	overflow: hidden;
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
`;

const ProgressFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => $percent}%;
	border-radius: 999px;
	background: linear-gradient(90deg, #1ebbb3 0%, #23b8a2 55%, #4fd4b8 100%);
	transition: width 0.25s ease;
`;

const RewardBlock = styled.div`
	position: absolute;
	right: ${REWARD_BLOCK_SHIFT}px;
	bottom: 0;
	width: ${TREASURE_IMG_WIDTH}px;
	height: ${TREASURE_IMG_HEIGHT}px;
	overflow: visible;
	pointer-events: none;
`;

/** Chest image + reward label — same unit, no clipping. */
const RewardVisual = styled.div`
	position: relative;
	width: ${TREASURE_IMG_WIDTH}px;
	height: ${TREASURE_IMG_HEIGHT}px;
	overflow: visible;
`;

const TREASURE_ICON_SHIFT_DOWN = 7;
const REWARD_TEXT_SHIFT_DOWN = 7;

const TreasureImg = styled.img`
	display: block;
	width: ${TREASURE_IMG_WIDTH}px;
	max-width: none;
	height: auto;
	transform: translateY(${TREASURE_ICON_SHIFT_DOWN}px);
	pointer-events: none;
	user-select: none;
`;

const RewardBox = styled.div`
	position: absolute;
	left: ${TREASURE_BEIGE_LEFT}px;
	top: 50%;
	transform: translateY(calc(-50% + ${REWARD_TEXT_SHIFT_DOWN}px));
	width: ${TREASURE_BEIGE_WIDTH}px;
	min-width: 0;
	min-height: 0;
	padding: 0 4px;
	background: transparent;
	border: none;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 2px;
`;

const RewardLabel = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: ${Math.round(8 * REWARD_FONT_SCALE)}px;
	line-height: 1.1;
	color: #442817;
	text-align: center;
`;

const RewardValue = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: ${Math.round(10 * REWARD_FONT_SCALE)}px;
	line-height: 1.1;
	color: #442817;
	text-align: center;
`;

const EmptyText = styled.p`
	position: absolute;
	z-index: 3;
	left: 5.9%;
	right: 5.9%;
	top: 45%;
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #5a4638;
	text-align: center;
`;

type Props = {
	opened: boolean;
	onClose: () => void;
	quests: DashboardQuestsPayload;
};

function PopupQuestRow({ quest }: { quest: DashboardQuestItem }) {
	const { formatMessage } = useIntl();
	const { current, target } = safeQuestProgressCounts(quest);
	const percent = questProgressPercent(quest);
	const weeklyXp = isWeeklyXpQuest(quest);
	const rewardXp = questRewardXpAmount(quest);
	const lessonsLabel = formatMessage(
		{ id: 'dashboard-quest-lessons-total' },
		{ count: Math.max(1, target) }
	).toLowerCase();

	const title = weeklyXp
		? formatMessage({ id: 'dashboard-quest-sidebar-earn-xp' }, { xp: target })
		: formatMessage(
				{ id: 'dashboard-quest-sidebar-goal' },
				{
					lessons: lessonsLabel,
					subject: quest.subject_name,
				}
			);

	const progressText = weeklyXp
		? formatMessage({ id: 'dashboard-quest-lessons' }, { current, total: target })
		: `${formatMessage({ id: 'dashboard-quest-lessons' }, { current, total: target })} ${lessonsLabel}`;

	return (
		<QuestRow>
			<QuestIcon src={figmaDashboardAssetUrl(questPopupIconFile(quest))} alt="" aria-hidden />
			<QuestMain>
				<QuestTitle>{title}</QuestTitle>
				<ProgressRow>
					<ProgressColumn>
						<ProgressMeta>{progressText}</ProgressMeta>
						<ProgressTrack aria-hidden>
							<ProgressFill $percent={percent} />
						</ProgressTrack>
					</ProgressColumn>
					<RewardBlock>
						<RewardVisual>
							<TreasureImg src={TREASURE_REWARD} alt="" aria-hidden />
							<RewardBox>
								<RewardLabel>{formatMessage({ id: 'dashboard-quest-reward-label' })}</RewardLabel>
								<RewardValue>
									{rewardXp != null
										? formatMessage({ id: 'dashboard-quest-reward-xp' }, { xp: rewardXp })
										: formatMessage({ id: 'dashboard-quest-reward-xp-generic' })}
								</RewardValue>
							</RewardBox>
						</RewardVisual>
					</RewardBlock>
				</ProgressRow>
			</QuestMain>
		</QuestRow>
	);
}

export default function YourQuestsPopup({ opened, onClose, quests }: Props) {
	const { formatMessage } = useIntl();
	const items = popupQuestItems(quests);

	useEffect(() => {
		if (!opened) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [opened]);

	if (!opened) return null;

	return createPortal(
		<Overlay
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<PopupCanvas
				role="dialog"
				aria-modal="true"
				aria-label={formatMessage({ id: 'dashboard-my-quests' })}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<ParchmentBg src={PARCHMENT} alt="" aria-hidden />
				<PopupLayer>
					<CloseButton type="button" onClick={onClose} aria-label={formatMessage({ id: 'dashboard-quests-popup-close' })}>
						×
					</CloseButton>
					<Ribbon src={RIBBON} alt={formatMessage({ id: 'dashboard-my-quests' })} />
					<BirdArt src={BIRD} alt="" aria-hidden />
					<Subtitle>{formatMessage({ id: 'dashboard-quests-popup-subtitle' })}</Subtitle>

					{items.length > 0 ? (
						<QuestList>
							{items.map((quest) => (
								<PopupQuestRow key={quest.id} quest={quest} />
							))}
						</QuestList>
					) : (
						<EmptyText>{formatMessage({ id: 'dashboard-quests-empty' })}</EmptyText>
					)}
				</PopupLayer>
			</PopupCanvas>
		</Overlay>,
		document.body
	);
}
