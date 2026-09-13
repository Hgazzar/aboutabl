import { Link, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { theme } from 'global-styles';
import { resolveCurrentStudentAvatarSrc } from 'lib/studentAvatar';
import { formatAssignmentsBadgeCount } from './newAssignmentsBannerUtils';

/** Figma `nameFrame` (1583:1292) + `quickActions` (2153:2180) inside `myProgressFrame`. */
const WIDGET_PADDING_X = 32;
const WIDGET_PADDING_Y = 24;
const AVATAR_SIZE = 100;
const AVATAR_TEXT_GAP = 15;
const QUICK_ACTIONS_TITLE_GAP = 20;
const ACTION_BUTTON_GAP = 19;
const ACTION_BUTTON_HEIGHT = 50;

const WidgetCard = styled.section`
	background: ${theme.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: ${WIDGET_PADDING_Y}px ${WIDGET_PADDING_X}px;
	box-sizing: border-box;
`;

const NameRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${AVATAR_TEXT_GAP}px;
	min-height: 122px;
`;

const AvatarFrame = styled(Link)`
	width: ${AVATAR_SIZE}px;
	height: 98px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	text-decoration: none;

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
`;

const HelloTitle = styled.h1`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(32px, 4vw, 40px);
	line-height: 1.1;
	color: #442817;
	text-transform: capitalize;
`;

const QuickActionsBlock = styled.div`
	margin-top: 0;
`;

const QuickActionsTitle = styled.h2`
	margin: 0 0 ${QUICK_ACTIONS_TITLE_GAP}px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.35;
	color: #442817;
`;

const ActionsRow = styled.div`
	display: flex;
	flex-wrap: nowrap;
	gap: ${ACTION_BUTTON_GAP}px;
`;

const actionShell = `
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: ${ACTION_BUTTON_HEIGHT}px;
	padding: 4px;
	border-radius: 999px;
	border: none;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	cursor: pointer;
	white-space: nowrap;
	transition: filter 0.15s ease;

	&:hover {
		filter: brightness(1.03);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}

	.action-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: ${ACTION_BUTTON_HEIGHT - 8}px;
		padding: 0 22px;
		border-radius: 999px;
		color: ${theme.colours.white};
	}
`;

const AssignmentsAction = styled(Link)`
	${actionShell};
	flex: 1 1 240px;
	max-width: 240px;
	background: #ffe082;
	box-shadow: 0 2px 0 rgba(255, 193, 7, 0.45);

	.action-label {
		background: linear-gradient(90deg, #ffb300 0%, #ff9800 100%);
	}
`;

const LearningAction = styled.button`
	${actionShell};
	flex: 1 1 231px;
	max-width: 231px;
	background: #b3e5fc;
	box-shadow: 0 2px 0 rgba(3, 169, 244, 0.35);

	.action-label {
		background: linear-gradient(90deg, #4fc3f7 0%, #039be5 100%);
	}
`;

const GameAction = styled.button`
	${actionShell};
	flex: 1 1 231px;
	max-width: 231px;
	background: #e1bee7;
	box-shadow: 0 2px 0 rgba(171, 71, 188, 0.35);

	.action-label {
		background: linear-gradient(90deg, #ba68c8 0%, #8e24aa 100%);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		filter: grayscale(0.15);
	}

	&:disabled:hover {
		filter: grayscale(0.15);
	}
`;

const CountBadge = styled.span`
	position: absolute;
	top: -8px;
	inset-inline-end: -6px;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 28px;
	height: 28px;
	padding: 0 6px;
	border-radius: 999px;
	border: 2px solid ${theme.colours.white};
	background: #e53935;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	color: ${theme.colours.white};
	box-shadow: 0 2px 4px rgba(68, 40, 23, 0.2);
	z-index: 1;
`;

type Props = {
	studentName: string;
	photoUrl?: string | null;
	newAssignmentsCount: number;
};

/** Dashboard Quick Action — always opens My Books (`/learn/books`). */
const START_LEARNING_PATH = '/learn/books';

export default function HelloQuickActions({
	studentName,
	photoUrl,
	newAssignmentsCount,
}: Props) {
	const { formatMessage } = useIntl();
	const navigate = useNavigate();
	const avatarSrc = resolveCurrentStudentAvatarSrc(photoUrl);
	const badgeLabel = formatAssignmentsBadgeCount(newAssignmentsCount);

	return (
		<WidgetCard>
			<NameRow>
				<AvatarFrame to="/profile" aria-label={formatMessage({ id: 'Profile' })}>
					<img src={avatarSrc} alt="" />
				</AvatarFrame>
				<HelloTitle>{formatMessage({ id: 'dashboard-hello' }, { name: studentName })}</HelloTitle>
			</NameRow>

			<QuickActionsBlock>
				<QuickActionsTitle>{formatMessage({ id: 'dashboard-quick-actions' })}</QuickActionsTitle>
				<ActionsRow>
					<AssignmentsAction to="/todo" aria-describedby={badgeLabel ? 'dashboard-assignments-badge' : undefined}>
						<span className="action-label">
							{formatMessage({ id: 'dashboard-view-assignments' })}
						</span>
						{badgeLabel ? (
							<CountBadge id="dashboard-assignments-badge" aria-label={formatMessage({ id: 'dashboard-new-assignments' }, { count: newAssignmentsCount })}>
								{badgeLabel}
							</CountBadge>
						) : null}
					</AssignmentsAction>
					<LearningAction type="button" onClick={() => navigate(START_LEARNING_PATH)}>
						<span className="action-label">
							{formatMessage({ id: 'dashboard-start-learning' })}
						</span>
					</LearningAction>
					<GameAction type="button" disabled aria-disabled="true">
						<span className="action-label">
							{formatMessage({ id: 'dashboard-play-game' })}
						</span>
					</GameAction>
				</ActionsRow>
			</QuickActionsBlock>
		</WidgetCard>
	);
}
