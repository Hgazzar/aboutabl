import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import { STUDENT_SHELL_MAIN_COLUMN_WIDTH } from 'config/studentShellLayout';

const TEAL = '#1ebba3';
const TEAL_DEEP = theme.colours.PaoloVeroneseGreen;
const INK = '#492613';

export const DetailPage = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
	width: 100%;
	max-width: ${STUDENT_SHELL_MAIN_COLUMN_WIDTH + 120}px;
	margin: 0 auto;
	font-family: ${theme.fonts.Nunito};
	box-sizing: border-box;
`;

export const DetailMain = styled.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 24px;
	overflow: hidden;
	background: ${TEAL_DEEP};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
`;

export const DetailHero = styled.section`
	position: relative;
	padding: 28px 28px 0;
	box-sizing: border-box;
	overflow: visible;

	@media (max-width: 640px) {
		padding: 20px 16px 0;
	}
`;

export const HeroGrid = styled.div`
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(160px, 42%);
	align-items: end;
	gap: 8px;
	min-height: 168px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
		min-height: 0;
		align-items: start;
	}
`;

export const HeroCopy = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
	padding-block: 8px 20px;
	max-width: 100%;
	text-align: start;
`;

export const HeroTitle = styled.h1`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(34px, 5.2vw, 56px);
	line-height: 1.02;
	color: ${theme.colours.white};
	-webkit-text-stroke: 1px ${INK};
	paint-order: stroke fill;
	text-shadow:
		1px 0 0 ${INK},
		-1px 0 0 ${INK},
		0 1px 0 ${INK},
		0 -1px 0 ${INK};
	text-align: start;
`;

export const HeroSubtitle = styled.p`
	margin: 0;
	max-width: 34ch;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: clamp(14px, 2vw, 17px);
	line-height: 1.35;
	color: rgba(255, 255, 255, 0.94);
	text-align: start;
`;

export const HeroIllustration = styled.div`
	position: relative;
	justify-self: end;
	width: min(280px, 100%);
	min-height: 180px;
	margin-block-end: -28px;
	pointer-events: none;
	overflow: visible;

	@media (max-width: 720px) {
		justify-self: center;
		width: min(220px, 70%);
		min-height: 140px;
		margin-block-end: -18px;
	}
`;

export const HeroSpark = styled.img`
	position: absolute;
	left: 50%;
	top: 42%;
	width: 150%;
	max-width: none;
	aspect-ratio: 1;
	transform: translate(-50%, -50%);
	object-fit: contain;
	opacity: 0.85;
	mix-blend-mode: screen;
	pointer-events: none;
	user-select: none;
	z-index: 0;
`;

export const HeroMascot = styled.img`
	position: relative;
	z-index: 1;
	display: block;
	width: 100%;
	height: auto;
	max-height: 220px;
	object-fit: contain;
	object-position: bottom center;
	filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18));
`;

export const DetailCard = styled.section`
	position: relative;
	z-index: 2;
	margin: 0 20px 20px;
	padding: 22px 24px 28px;
	border-radius: 22px;
	background: ${theme.colours.white};
	box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;

	@media (max-width: 640px) {
		margin: 0 12px 12px;
		padding: 16px;
	}
`;

export const BackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 12px;
	font-weight: 700;
	font-size: 14px;
	color: #9c9b9b;
	text-decoration: none;

	&:hover {
		color: ${TEAL};
	}
`;

export const TitleRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 14px;
`;

export const TitleBlock = styled.div`
	min-width: 0;
	flex: 1 1 220px;
	text-align: start;
`;

export const TitleMetaColumn = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8px;
	text-align: end;

	@media (max-width: 640px) {
		align-items: flex-start;
		text-align: start;
		width: 100%;
	}
`;

export const AssignTitle = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(22px, 3vw, 32px);
	line-height: 1.2;
	color: #1f1f1f;
	text-align: start;
`;

export const StatusMeta = styled.p`
	margin: 6px 0 0;
	font-size: 13px;
	font-weight: 800;
	color: ${TEAL};
	text-align: start;
`;

export const StatusMetaMuted = styled(StatusMeta)`
	color: #8a8494;
	font-weight: 700;
`;

export const ReviewBanner = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	margin: 12px 0 18px;
	padding: 14px 16px;
	border-radius: 16px;
	background: #fff6e8;
	border: 1px solid #f0d9b5;
	font-size: 14px;
	font-weight: 700;
	color: #5a4630;
	text-align: start;
	line-height: 1.4;
`;

export const ReviewBannerMascot = styled.img`
	width: 48px;
	height: 48px;
	flex: 0 0 auto;
	object-fit: contain;
`;

export const MetricsRow = styled.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: stretch;
	gap: 12px;
	margin-bottom: 22px;

	& > * {
		flex: 1 1 0;
		min-width: 0;
	}

	@media (max-width: 720px) {
		flex-wrap: wrap;
	}
`;

export const MetricCard = styled.div<{ $wide?: boolean; $solid?: boolean }>`
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 8px;
	min-height: 78px;
	padding: 14px 16px;
	border-radius: 16px;
	box-sizing: border-box;
	background: ${({ $solid }) => ($solid ? TEAL : '#e8f8f5')};
	color: ${({ $solid }) => ($solid ? theme.colours.white : '#2a5f57')};
	${({ $wide }) => ($wide ? 'flex: 1.5 1 0;' : '')}
`;

export const MetricLabel = styled.span`
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.01em;
	opacity: 0.92;
	text-align: start;
`;

export const MetricValueRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 15px;
	font-weight: 800;
	text-align: start;
`;

export const MetricIcon = styled.img`
	width: 20px;
	height: 20px;
	flex: 0 0 auto;
	object-fit: contain;
`;

export const ProgressTrack = styled.div`
	height: 10px;
	border-radius: 999px;
	background: rgba(0, 0, 0, 0.08);
	overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
	border-radius: 999px;
	background: ${TEAL};
`;

export const DuePill = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 6px;
	padding: 14px 16px;
	border-radius: 16px;
	background: ${TEAL};
	color: ${theme.colours.white};
	font-weight: 800;
	font-size: 14px;
	text-align: start;
	box-sizing: border-box;
`;

export const SectionTitle = styled.h3`
	margin: 0 0 10px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	color: #1f1f1f;
	text-align: start;
`;

export const SectionHint = styled.p`
	margin: -4px 0 12px;
	font-size: 14px;
	font-weight: 600;
	color: #8a8494;
	text-align: start;
`;

export const ActivityList = styled.ul`
	list-style: none;
	margin: 0 0 8px;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const ActivityRow = styled.li`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 16px;
	border-radius: 16px;
	background: #f7f7f8;
	border: 1px solid #ececef;
`;

export const ActivityMeta = styled.div`
	min-width: 0;
	flex: 1 1 180px;
	text-align: start;
`;

export const ActivityType = styled.span`
	display: block;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	color: ${TEAL};
`;

export const ActivityName = styled.span`
	display: block;
	margin-top: 2px;
	font-size: 15px;
	font-weight: 800;
	color: #222;
`;

export const ActivityStatus = styled.span`
	font-size: 13px;
	font-weight: 800;
	color: ${TEAL};
`;

export const ActionButton = styled.button`
	appearance: none;
	border: none;
	cursor: pointer;
	min-height: 42px;
	padding: 0 22px;
	border-radius: 12px;
	background: ${TEAL};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	box-shadow: 0 2px 0 rgba(0, 0, 0, 0.08);

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		background: #9aa7a4;
		box-shadow: none;
		text-transform: none;
	}
`;

export const FeedbackList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-bottom: 22px;
`;

export const FeedbackCard = styled.div`
	padding: 14px 16px;
	border-radius: 16px;
	background: #fff8ef;
	border: 1px solid #f0d9b5;
	text-align: start;
`;

export const FeedbackActivity = styled.div`
	font-size: 12px;
	font-weight: 800;
	color: #8a6a3d;
	margin-bottom: 6px;
`;

export const FeedbackText = styled.p`
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	color: #3d3428;
	line-height: 1.4;
`;

export const ErrorText = styled.p`
	margin: 0;
	padding: 16px;
	color: #c0392b;
	font-weight: 700;
`;

/** Phase 4C graded visual shell (data from Phase 4B). */
export const GradedShell = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
	margin: 4px 0 22px;
`;

export const GradeBadgePill = styled.div`
	position: relative;
	display: inline-flex;
	align-self: flex-start;
	align-items: center;
	justify-content: center;
	min-height: 56px;
	padding: 12px 28px;
	border-radius: 999px;
	background: ${TEAL};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(24px, 4vw, 34px);
	line-height: 1.05;
	box-shadow: 0 6px 0 rgba(0, 112, 96, 0.35);
`;

export const GradeBadgeStar = styled.img`
	position: absolute;
	inset-block-start: -10px;
	inset-inline-end: -8px;
	width: 28px;
	height: 28px;
	object-fit: contain;
`;

export const GradeScoreText = styled.p`
	margin: 0;
	font-size: 16px;
	font-weight: 800;
	color: #2a5f57;
	text-align: start;
`;

export const GradeXpPill = styled.div`
	display: inline-flex;
	align-self: flex-start;
	align-items: center;
	gap: 8px;
	padding: 12px 18px;
	border-radius: 16px;
	background: ${TEAL};
	color: ${theme.colours.white};
	font-weight: 800;
	font-size: 15px;
`;

export const AssignmentFeedbackCard = styled.div`
	width: 100%;
	max-width: 520px;
	padding: 16px 18px;
	border-radius: 18px;
	background: #e8f8f5;
	border: 1px solid #c5ebe4;
	text-align: start;
	box-sizing: border-box;
`;

export const AssignmentFeedbackLabel = styled.div`
	font-size: 12px;
	font-weight: 800;
	color: #2a5f57;
	margin-bottom: 8px;
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;
