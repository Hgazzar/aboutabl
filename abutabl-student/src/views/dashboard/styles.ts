import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { STUDENT_SHELL_ASIDE_WIDTH, STUDENT_SHELL_GAP, STUDENT_SHELL_MAIN_COLUMN_WIDTH } from 'config/studentShellLayout';

export const DashboardPage = styled.div`
	display: grid;
	grid-template-columns: minmax(${STUDENT_SHELL_MAIN_COLUMN_WIDTH}px, 1fr) ${STUDENT_SHELL_ASIDE_WIDTH}px;
	gap: ${STUDENT_SHELL_GAP}px;
	min-width: 0;
	width: 100%;
	font-family: ${theme.fonts.Nunito};
	box-sizing: border-box;

	@media (max-width: 991px) {
		grid-template-columns: 1fr;
	}
`;

export const DashboardMain = styled.main`
	display: flex;
	flex-direction: column;
	gap: 24px;
	min-width: 0;
	box-sizing: border-box;
	padding: ${STUDENT_SHELL_GAP}px;
	background: ${theme.colours.Lotion};
	border-radius: 20px;
`;

export const DashboardAside = styled.aside`
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
	box-sizing: border-box;

	@media (max-width: 991px) {
		width: 100%;
	}
`;

/** Figma Widget 6 row (`1767:1880`) — 360px Recommended + 356px Recent. */
export const WidgetSixRow = styled.div<{ $maxWidth: number; $gap: number }>`
	display: flex;
	flex-wrap: nowrap;
	align-items: flex-start;
	gap: ${({ $gap }) => $gap}px;
	width: 100%;
	max-width: ${({ $maxWidth }) => $maxWidth}px;
	box-sizing: border-box;

	@media (max-width: 780px) {
		flex-wrap: wrap;
		max-width: 100%;
	}
`;

export const Card = styled.section`
	background: ${theme.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: 24px;
`;

export const GreetingRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;

	h1 {
		margin: 0;
		font-family: ${theme.fonts.Fredoka};
		font-size: clamp(28px, 4vw, 40px);
		color: ${theme.colours.black_2};
		text-transform: capitalize;
	}
`;

export const GreetingContent = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	min-width: 0;
`;

export const AvatarRing = styled.div`
	position: relative;
	width: 88px;
	height: 88px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;

	.ring {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.avatar {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		object-fit: cover;
	}
`;

export const BirdMascot = styled.img`
	width: min(160px, 28vw);
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
`;

export const QuickActionsRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 12px;

	button,
	a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 50px;
		padding: 0 24px;
		border-radius: 25px;
		border: none;
		font-family: ${theme.fonts.Nunito};
		font-size: 14px;
		text-transform: uppercase;
		text-decoration: none;
		cursor: pointer;
	}

	.btn-yellow {
		background: #ffc107;
		color: ${theme.colours.black_2};
	}

	.btn-teal {
		background: ${theme.colours.LightSeaGreen};
		color: ${theme.colours.white};
	}

	.btn-purple {
		background: #7b61ff;
		color: ${theme.colours.white};
	}

	.dashboard-btn {
		font-family: ${theme.fonts.Nunito} !important;
	}
`;

export const StatsRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
`;

export const StatPill = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 16px;
	border-radius: 16px;
	background: ${theme.colours.AntiFlashWhite};
	min-width: 180px;

	strong {
		display: block;
		font-family: ${theme.fonts.Fredoka};
		font-size: 18px;
		color: ${theme.colours.black_2};
	}

	span {
		font-family: ${theme.fonts.Nunito};
		font-size: 12px;
		color: ${theme.colours['Grey-body']};
	}
`;

export const ProgressCard = styled(Card)`
	position: relative;
	overflow: hidden;
`;

export const ProgressFrame = styled.img`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0.08;
	pointer-events: none;
`;

export const ProgressBody = styled.div`
	position: relative;
	z-index: 1;
`;

export const ProgressBadgeRow = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 12px;
	margin-top: 8px;
`;

export const GoldenStars = styled.img`
	width: 120px;
	height: auto;
	object-fit: contain;
`;

export const ProgressBarTrack = styled.div`
	height: 12px;
	border-radius: 999px;
	background: ${theme.colours.Platinum};
	overflow: hidden;
	margin-top: 12px;

	div {
		height: 100%;
		border-radius: 999px;
		background: ${theme.colours.LightSeaGreen};
	}
`;

export const WidgetCard = styled(Card)`
	h2 {
		margin: 0 0 16px;
		font-family: ${theme.fonts.Fredoka};
		font-size: 18px;
		text-transform: capitalize;
	}
`;

export const QuestWidget = styled(WidgetCard)`
	background-image: url(${figmaDashboardAssetUrl('goal-frame.png')});
	background-repeat: no-repeat;
	background-position: top center;
	background-size: 100% auto;
	padding-top: 48px;
`;

export const QuestIconRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12px;

	img {
		width: 72px;
		height: auto;
		object-fit: contain;
	}
`;

export const StreakWidget = styled(WidgetCard)`
	.streak-icons {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 12px;

		img {
			object-fit: contain;
		}

		.flash {
			width: 36px;
			height: auto;
		}

		.bomb {
			width: 48px;
			height: auto;
		}
	}

	.streak-visual {
		width: 100%;
		height: auto;
		border-radius: 12px;
	}
`;

export const TabRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-bottom: 16px;

	button {
		border: none;
		background: transparent;
		padding: 8px 16px;
		border-radius: 999px;
		font-family: ${theme.fonts.Nunito};
		cursor: pointer;
		color: ${theme.colours['Grey-body']};

		&.active {
			background: ${theme.colours.LightSeaGreen};
			color: ${theme.colours.white};
		}
	}
`;

export const AssignmentRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 0;
	border-bottom: 1px solid ${theme.colours.Platinum};

	&:last-child {
		border-bottom: none;
	}

	strong {
		font-family: ${theme.fonts.Fredoka};
		font-size: 16px;
		color: ${theme.colours.black_2};
	}
`;

export const RankingRow = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 0;

	.rank {
		width: 28px;
		text-align: center;
		font-family: ${theme.fonts.Fredoka};
	}

	strong {
		font-family: ${theme.fonts.Fredoka};
		font-size: 15px;
		color: ${theme.colours.black_2};
	}
`;

export const FooterLinks = styled.footer`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	justify-content: center;
	padding: 24px 0 8px;
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	color: ${theme.colours['Grey-body']};

	a {
		color: inherit;
		text-decoration: none;
	}
`;

export const ActivityRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 0;
	border-bottom: 1px solid ${theme.colours.Platinum};

	&:last-child {
		border-bottom: none;
	}

	strong {
		font-family: ${theme.fonts.Fredoka};
		font-size: 15px;
		color: ${theme.colours.black_2};
	}
`;

export const RecommendedGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 12px;
`;

export const RecommendedCard = styled(Link)`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
	border-radius: 16px;
	background: ${theme.colours.AntiFlashWhite};
	text-decoration: none;
	color: inherit;
	min-height: 100px;

	strong {
		font-family: ${theme.fonts.Fredoka};
		font-size: 15px;
		color: ${theme.colours.black_2};
	}

	span {
		font-family: ${theme.fonts.Nunito};
		font-size: 13px;
		color: ${theme.colours['Grey-body']};
	}
`;

export const ContinueLearningCard = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
	padding: 16px;
	border-radius: 16px;
	background: ${theme.colours.AntiFlashWhite};

	strong {
		font-family: ${theme.fonts.Fredoka};
		font-size: 16px;
		color: ${theme.colours.black_2};
	}
`;

export const StreakCount = styled.div`
	text-align: center;
	margin-bottom: 8px;

	strong {
		display: block;
		font-family: ${theme.fonts.Fredoka};
		font-size: 36px;
		color: ${theme.colours.LightSeaGreen};
		line-height: 1;
	}

	span {
		font-family: ${theme.fonts.Nunito};
		font-size: 13px;
		color: ${theme.colours['Grey-body']};
	}
`;

export const SectionTitle = styled.h2`
	margin: 0 0 12px;
	font-family: ${theme.fonts.Fredoka};
	font-size: 20px;
	color: ${theme.colours.black_2};
`;

export const DashboardErrorBanner = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 14px;
	border-radius: 12px;
	background: #fff4f4;
	color: #8b2e2e;
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	line-height: 1.4;

	button {
		flex-shrink: 0;
		border: 0;
		border-radius: 999px;
		padding: 6px 14px;
		background: #8b2e2e;
		color: ${theme.colours.white};
		font-family: ${theme.fonts.Nunito};
		font-weight: 700;
		font-size: 12px;
		cursor: pointer;
	}
`;

export const EmptyHint = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	color: ${theme.colours['Grey-body']};
	font-size: 14px;
`;
