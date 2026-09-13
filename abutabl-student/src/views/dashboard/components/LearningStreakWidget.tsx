import { useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { DashboardStreakDay, DashboardPayload } from 'lib/dashboardApi';
import { Card } from '../styles';
import { ViewMoreLabel } from './widget6CardStyles';
import LearningStreakPopup from './LearningStreakPopup';
import {
	normalizeWeeklyDays,
	shouldShowStreakCount,
	streakMessageId,
} from './learningStreakUtils';

const FLAME_ICON = figmaDashboardAssetUrl('bomb-explode-5.svg');
const DAY_COMPLETED = figmaDashboardAssetUrl('ellipse-649.svg');
const DAY_INCOMPLETE = figmaDashboardAssetUrl('ellipse-650.svg');

const WidgetShell = styled(Card)`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 20px 18px 18px;
`;

const Title = styled.h2`
	margin: 0 0 16px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.35;
	color: #442817;
	text-align: center;
	text-transform: none;
`;

const CreamCard = styled.div`
	background: #f9f3e3;
	border-radius: 16px;
	padding: 14px 14px 12px;
`;

const SummaryCard = styled(CreamCard)`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
`;

const FlameIcon = styled.img<{ $size?: number }>`
	width: ${({ $size = 56 }) => $size}px;
	height: ${({ $size = 56 }) => $size}px;
	flex-shrink: 0;
	object-fit: contain;
`;

const SummaryText = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const StreakCount = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.2;
	color: #e86f2a;
`;

const StreakMessage = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.35;
	color: #6b5a4a;
`;

const WeeklyCard = styled(CreamCard)`
	padding: 12px 10px 10px;
`;

const WeekGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	column-gap: 4px;
`;

const DayColumn = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
	min-width: 0;
`;

const DayLabel = styled.span<{ $completed: boolean }>`
	display: block;
	width: 100%;
	text-align: center;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	color: ${({ $completed }) => ($completed ? '#e86f2a' : '#d4c4a8')};
`;

const DayBadge = styled.img`
	width: 34px;
	height: 34px;
	object-fit: contain;
	display: block;
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
	streak: DashboardPayload['streak'];
};

function WeeklyDayColumn({ day }: { day: DashboardStreakDay }) {
	return (
		<DayColumn>
			<DayLabel $completed={day.completed}>{day.label}</DayLabel>
			<DayBadge
				src={day.completed ? DAY_COMPLETED : DAY_INCOMPLETE}
				alt=""
				aria-hidden
			/>
		</DayColumn>
	);
}

function WeeklyTracker({ days }: { days: DashboardStreakDay[] }) {
	return (
		<WeeklyCard>
			<WeekGrid>
				{days.map((day) => (
					<WeeklyDayColumn key={day.date || day.label} day={day} />
				))}
			</WeekGrid>
		</WeeklyCard>
	);
}

export default function LearningStreakWidget({ streak }: Props) {
	const { formatMessage } = useIntl();
	const [popupOpen, setPopupOpen] = useState(false);
	const weeklyDays = normalizeWeeklyDays(streak.weekly_days);
	const messageId = streakMessageId(streak);
	const showCount = shouldShowStreakCount(streak);

	return (
		<>
			<WidgetShell aria-label={formatMessage({ id: 'dashboard-streak' })}>
				<Title>{formatMessage({ id: 'dashboard-streak' })}</Title>

				<SummaryCard>
					<FlameIcon src={FLAME_ICON} alt="" aria-hidden />
					<SummaryText>
						{showCount ? (
							<StreakCount>
								{formatMessage(
									{ id: 'dashboard-streak-days' },
									{ count: streak.current_streak }
								)}
							</StreakCount>
						) : null}
						<StreakMessage>{formatMessage({ id: messageId })}</StreakMessage>
					</SummaryText>
				</SummaryCard>

				<WeeklyTracker days={weeklyDays} />

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

			<LearningStreakPopup
				opened={popupOpen}
				onClose={() => setPopupOpen(false)}
				streak={streak}
			/>
		</>
	);
}
