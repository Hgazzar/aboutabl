import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';

const TEAL = '#1ebba3';
const TEAL_DEEP = theme.colours.PaoloVeroneseGreen;
const INK = '#492613';

export const DetailPage = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
	width: 100%;
	font-family: ${theme.fonts.Nunito};
	box-sizing: border-box;
`;

export const DetailMain = styled.main<{ $peekBird?: boolean }>`
	display: flex;
	flex-direction: column;
	min-width: 0;
	width: 100%;
	border-radius: 20px;
	/* Homework hero bird stays under the white card; waiting/graded peek can sit on top. */
	overflow: ${({ $peekBird }) => ($peekBird ? 'visible' : 'hidden')};
	background: ${TEAL_DEEP};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
`;

export const DetailHero = styled.section<{ $peekBird?: boolean }>`
	position: relative;
	min-height: 300px;
	padding: 12px 0 0 28px;
	box-sizing: border-box;
	overflow: ${({ $peekBird }) => ($peekBird ? 'visible' : 'hidden')};
	z-index: ${({ $peekBird }) => ($peekBird ? 3 : 1)};

	@media (max-width: 720px) {
		min-height: 0;
		padding: 16px 16px 0;
	}
`;

export const HeroGrid = styled.div`
	position: relative;
	z-index: 1;
	display: block;
	min-height: 300px;

	@media (max-width: 720px) {
		min-height: 0;
	}
`;

export const HeroCopy = styled.div<{ $waiting?: boolean; $nudgeY?: number }>`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	max-width: min(720px, 78%);
	padding-top: 10px;
	padding-bottom: 28px;
	text-align: start;
	transform: ${({ $waiting, $nudgeY = 0 }) => {
		const base = $waiting ? 15 : 0;
		const y = base + $nudgeY;
		return y ? `translateY(${y}px)` : 'none';
	}};

	@media (max-width: 720px) {
		max-width: 100%;
		padding-bottom: 12px;
	}
`;

export const HeroTitle = styled.h1`
	margin: 0;
	padding: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-style: normal;
	font-size: 104px;
	line-height: 0.92;
	letter-spacing: -0.02em;
	color: ${theme.colours.white};
	-webkit-text-stroke: 1px #000000;
	paint-order: stroke fill;
	text-shadow:
		1px 0 0 #000000,
		-1px 0 0 #000000,
		0 1px 0 #000000,
		0 -1px 0 #000000,
		1px 1px 0 #000000,
		-1px 1px 0 #000000,
		1px -1px 0 #000000,
		-1px -1px 0 #000000;
	text-align: start;

	@media (max-width: 1100px) {
		font-size: clamp(56px, 8.5vw, 104px);
	}

	@media (max-width: 720px) {
		font-size: clamp(40px, 12vw, 64px);
	}
`;

export const HeroTitleLine = styled.span`
	display: block;
	white-space: nowrap;
`;

export const HeroSubtitle = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
	text-align: start;
`;

export const HeroSubtitleLine = styled.span`
	display: block;
`;

/**
 * Clips sunburst to the teal hero (same containment as homework /assign/433).
 * Bird stays outside so waiting/graded can still peek over the white card.
 */
export const HeroSparkClip = styled.div`
	position: absolute;
	inset: 0;
	overflow: hidden;
	pointer-events: none;
	z-index: 0;
`;

export const HeroIllustration = styled.div<{ $underWhite?: boolean }>`
	position: absolute;
	z-index: ${({ $underWhite }) => ($underWhite ? 1 : 4)};
	inset-inline-end: -18px;
	bottom: -56px;
	width: min(460px, 52%);
	aspect-ratio: 530 / 420;
	overflow: visible;
	pointer-events: none;

	@media (max-width: 720px) {
		position: relative;
		inset-inline-end: auto;
		bottom: auto;
		width: min(280px, 90%);
		margin: 0 auto -36px;
		z-index: ${({ $underWhite }) => ($underWhite ? 1 : 4)};
	}
`;

/** Shared placement for sun + bird so they stay aligned. */
export const HeroArtCluster = styled.div<{ $underWhite?: boolean; $nudgeY?: number }>`
	position: relative;
	width: 100%;
	height: 100%;
	/* Homework hero: -50px left, 14px down. Waiting/graded peek: -50px left, 24px down (+ optional nudge). */
	transform: ${({ $underWhite, $nudgeY = 0 }) =>
		$underWhite
			? `translate(-50px, ${14 + $nudgeY}px)`
			: `translate(-50px, ${24 + $nudgeY}px)`};
`;

export const HeroSpark = styled.img`
	position: absolute;
	left: 50%;
	top: 40%;
	width: 150%;
	max-width: none;
	aspect-ratio: 1;
	transform: translate(-50%, -50%);
	object-fit: contain;
	opacity: 0.88;
	mix-blend-mode: screen;
	pointer-events: none;
	user-select: none;
	z-index: 0;
`;

export const HeroMascot = styled.img<{ $underWhite?: boolean }>`
	position: relative;
	z-index: ${({ $underWhite }) => ($underWhite ? 1 : 5)};
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center bottom;
	user-select: none;
	pointer-events: none;
`;

export const DetailCard = styled.section`
	position: relative;
	z-index: 2;
	margin: 0 20px 20px;
	padding: 22px 24px 28px;
	border-radius: 20px;
	background: ${theme.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;
	overflow: visible;

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
	flex: 0 0 auto;
	min-width: max-content;

	@media (max-width: 640px) {
		align-items: stretch;
		text-align: start;
		width: 100%;
	}
`;

/** Submitted label + Assignment REDO on one row (label left of REDO). */
export const TitleMetaActionsRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: 12px;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
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
	/* Subject + "Homework:" must stay on one line. */
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
`;

export const AssignTitleSuffix = styled.span`
	font-weight: 600;
	white-space: nowrap;
`;

export const HeaderAssignmentLine = styled.p`
	margin: 6px 0 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(16px, 2.2vw, 20px);
	line-height: 1.3;
	color: #3a3545;
	text-align: start;
`;

export const HeaderContextLine = styled.p`
	margin: 4px 0 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(14px, 1.8vw, 16px);
	line-height: 1.3;
	color: #5a5566;
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

/** Waiting state — under assignment title: clock + "Under review (locked)" */
export const UnderReviewStatus = styled.p`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin: 8px 0 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	font-weight: 600;
	line-height: 1.2;
	color: #9c9b9b;
	text-align: start;
`;

export const UnderReviewIcon = styled.span`
	display: inline-flex;
	flex: 0 0 auto;
	width: 14px;
	height: 14px;
	color: #9c9b9b;

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}
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

/** Waiting + REDO — Figma original3:
 * [bird] [message bubble] [Group 5 right]
 *              [Group 4 bees above right half of bubble]
 */
export const WaitingReviewScene = styled.div`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: flex-start;
	gap: 14px;
	width: 100%;
	/* Pull scene up 85px total and collapse leftover white space (no transform gap). */
	margin: -81px 0 22px;
	/* Room for Group 4 bees that sit above the bubble (must stay inside this box). */
	padding-top: 68px;
	overflow: visible;
	box-sizing: border-box;

	@media (max-width: 640px) {
		flex-wrap: wrap;
		column-gap: 8px;
		row-gap: 6px;
		padding-top: 56px;
		margin: -81px 0 18px;
	}
`;

export const WaitingReviewBird = styled.img`
	flex: 0 0 auto;
	width: 100px;
	height: auto;
	object-fit: contain;
	object-position: bottom center;
	align-self: flex-end;
	margin: 0;
	z-index: 2;
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		width: 84px;
	}
`;

/** Graded: heading above, avatar + message bubble side-by-side (same as waiting bird+bubble). */
export const TeacherFeedbackLead = styled.div`
	flex: 0 1 auto;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: flex-end;
	gap: 8px;
	align-self: flex-end;
	min-width: 0;
	z-index: 2;
`;

export const TeacherFeedbackHeading = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(15px, 1.8vw, 18px);
	line-height: 1.2;
	color: #492613;
	text-align: start;
	white-space: nowrap;
`;

export const TeacherFeedbackRow = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: flex-start;
	gap: 14px;
	min-width: 0;
	width: 100%;
`;

export const GradedTeacherAvatar = styled.img`
	flex: 0 0 auto;
	width: 100px;
	height: 100px;
	border-radius: 22px;
	object-fit: cover;
	object-position: center;
	background: #7ed4cf;
	box-shadow: 0 2px 0 rgba(0, 0, 0, 0.06);
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		width: 84px;
		height: 84px;
	}
`;

export const WaitingReviewBubbleWrap = styled.div`
	position: relative;
	flex: 0 1 auto;
	width: fit-content;
	max-width: min(560px, calc(100% - 220px));
	overflow: visible;
	z-index: 1;
`;

export const WaitingReviewBubble = styled.div`
	position: relative;
	z-index: 1;
	width: fit-content;
	max-width: 100%;
	padding: 14px 22px 16px;
	border-radius: 22px;
	background: #f9eed8;
	text-align: start;
	box-sizing: border-box;

	/* Tail toward bird head (upper-left), matching original3 */
	&::before {
		content: '';
		position: absolute;
		inset-inline-start: -11px;
		top: 22px;
		width: 20px;
		height: 20px;
		background: #f9eed8;
		transform: rotate(45deg);
		border-radius: 3px;
	}

	[dir='rtl'] &::before {
		inset-inline-start: auto;
		inset-inline-end: -11px;
	}
`;

export const WaitingReviewMessageLabel = styled.span`
	display: block;
	margin: 0 0 6px;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	font-weight: 600;
	color: #b8a07e;
`;

export const WaitingReviewMessageText = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: clamp(14px, 1.55vw, 16px);
	font-weight: 700;
	line-height: 1.4;
	color: #4a3a2a;
	white-space: pre-line;
`;

/** Group 4 — bees above the right half of the bubble (original3 ratios). */
export const WaitingReviewBees = styled.img`
	position: absolute;
	z-index: 3;
	inset-inline-start: 42%;
	bottom: calc(100% + 6px);
	width: min(280px, 90%);
	height: auto;
	object-fit: contain;
	transform: translateX(50px);
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		inset-inline-start: 28%;
		width: min(200px, 95%);
		bottom: calc(100% + 4px);
		transform: translateX(50px);
	}
`;

/** Slot that owns the white space to the right; centers Group 5 (or end-aligns grade badge). */
export const WaitingReviewDecorSlot = styled.div<{ $alignEnd?: boolean }>`
	flex: 1 1 0;
	min-width: 0;
	display: flex;
	align-items: ${({ $alignEnd }) => ($alignEnd ? 'flex-end' : 'center')};
	justify-content: ${({ $alignEnd }) => ($alignEnd ? 'flex-end' : 'center')};
	/* Match MetricsRow horizontal padding so grade badge lines up with Due Date */
	padding-inline-end: ${({ $alignEnd }) => ($alignEnd ? '18px' : '0')};
	align-self: stretch;
`;

/** Group 5 — centered in remaining white space */
export const WaitingReviewDecor = styled.img`
	flex: 0 0 auto;
	width: 248px;
	height: auto;
	object-fit: contain;
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		width: 207px;
	}
`;

export const MetricsRow = styled.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 16px;
	margin-bottom: 22px;
	padding: 16px 18px;
	border-radius: 24px;
	background: #eef8f5;
	/* Same shadow as profile PocketCard / Panel */
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;

	@media (max-width: 720px) {
		flex-wrap: wrap;
		gap: 12px;
		padding: 14px;
		border-radius: 20px;
	}
`;

export const MetricsProgress = styled.div`
	flex: 1 1 0;
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 10px;
`;

export const MetricsProgressLabel = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	font-weight: 700;
	line-height: 1.3;
	color: #3a322c;
	text-align: start;

	em {
		font-style: normal;
		font-weight: 800;
		color: ${TEAL};
	}
`;

export const MetricsPills = styled.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: stretch;
	gap: 12px;
	flex: 0 0 auto;

	@media (max-width: 720px) {
		width: 100%;
		flex-wrap: wrap;

		& > * {
			flex: 1 1 140px;
		}
	}
`;

export const MetricCard = styled.div<{ $wide?: boolean; $solid?: boolean }>`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10px;
	min-height: 64px;
	padding: 10px 14px;
	border-radius: 14px;
	box-sizing: border-box;
	background: ${({ $solid }) => ($solid ? TEAL : 'transparent')};
	color: ${({ $solid }) => ($solid ? theme.colours.white : '#2a5f57')};
	${({ $wide }) => ($wide ? '' : 'flex: 0 0 auto; min-width: 168px;')}
	${({ $solid }) =>
		$solid
			? `
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.1),
			0 4px 8px rgba(0, 0, 0, 0.14);
	`
			: ''}
`;

export const MetricTextStack = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
	min-width: 0;
	text-align: start;
`;

export const MetricLabel = styled.span`
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.01em;
	opacity: 0.95;
	text-align: start;
	line-height: 1.2;
`;

export const MetricValueRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 16px;
	font-weight: 800;
	text-align: start;
	line-height: 1.2;
`;

export const MetricIcon = styled.img`
	width: 28px;
	height: 28px;
	flex: 0 0 auto;
	object-fit: contain;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.18));
`;

export const ProgressTrack = styled.div`
	height: 8px;
	border-radius: 999px;
	background: rgba(30, 187, 163, 0.16);
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
	flex-direction: row;
	align-items: center;
	gap: 10px;
	min-height: 64px;
	padding: 10px 14px;
	border-radius: 14px;
	background: ${TEAL};
	color: ${theme.colours.white};
	font-weight: 800;
	font-size: 16px;
	text-align: start;
	box-sizing: border-box;
	flex: 0 0 auto;
	min-width: 168px;
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
`;

export const SectionTitle = styled.h3<{ $gapBefore?: boolean }>`
	margin: ${({ $gapBefore }) => ($gapBefore ? '28px' : '0')} 0 10px;
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
	gap: 12px;
`;

export const ActivityRow = styled.li<{ $completed?: boolean }>`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	padding: 14px 18px;
	border-radius: 22px;
	background: ${({ $completed }) => ($completed ? '#e7f8f4' : theme.colours.white)};
	border: none;
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;

	@media (max-width: 640px) {
		flex-wrap: wrap;
		padding: 12px 14px;
		border-radius: 18px;
	}
`;

export const ActivityLead = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
	flex: 1 1 auto;
	text-align: start;
`;

export const ActivityTypeIcon = styled.img`
	flex: 0 0 auto;
	width: 48px;
	height: 48px;
	object-fit: contain;
	display: block;
	image-rendering: -webkit-optimize-contrast;
`;

export const ActivityMeta = styled.div`
	min-width: 0;
	flex: 1 1 auto;
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
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	font-weight: 800;
	line-height: 1.3;
	color: #3a322c;
`;

export const ActivityActions = styled.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	flex: 0 0 auto;

	@media (max-width: 640px) {
		width: 100%;
		justify-content: flex-end;
	}
`;

export const ActivityStatus = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	font-weight: 800;
	color: ${TEAL};
	white-space: nowrap;
`;

/** Square refresh control next to Completed (Figma). */
export const ActivityRedoIconButton = styled.button`
	appearance: none;
	flex: 0 0 auto;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	padding: 0;
	border: 1.5px solid #c5c5c5;
	border-radius: 10px;
	background: #f3f3f3;
	color: #5a5a5a;
	cursor: pointer;
	box-shadow: 0 2px 0 rgba(0, 0, 0, 0.12);

	svg {
		width: 18px;
		height: 18px;
		display: block;
	}

	&:hover {
		background: #ececec;
	}

	&:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.12);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	&:focus-visible {
		outline: 2px solid ${TEAL};
		outline-offset: 2px;
	}
`;

export const ActionButton = styled.button<{ $secondary?: boolean; $large?: boolean }>`
	appearance: none;
	border: ${({ $secondary }) => ($secondary ? `2px solid ${TEAL}` : 'none')};
	cursor: pointer;
	min-height: ${({ $large }) => ($large ? '52px' : '40px')};
	padding: ${({ $large }) => ($large ? '0 32px' : '0 22px')};
	border-radius: 999px;
	background: ${({ $secondary }) => ($secondary ? '#fff' : '#3a322c')};
	color: ${({ $secondary }) => ($secondary ? TEAL : theme.colours.white)};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: ${({ $large }) => ($large ? '16px' : '14px')};
	letter-spacing: 0.02em;
	box-shadow: ${({ $secondary, $large }) =>
		$secondary ? 'none' : $large ? '0 3px 0 #1d9386' : '0 3px 0 #2a241f'};

	${({ $large }) =>
		$large
			? `
		background: #23b8a2;
		text-transform: uppercase;
		box-shadow: 0 3px 0 #1d9386;
	`
			: ''}

	@media (max-width: 640px) {
		${({ $large }) => ($large ? 'width: 100%;' : '')}
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		background: #9aa7a4;
		border-color: #9aa7a4;
		color: ${theme.colours.white};
		box-shadow: none;
		text-transform: none;
	}
`;

/** Figma Assignment REDO — yellow fill, maroon label, refresh icon (EN/AR). */
const REDO_YELLOW = '#fec240';
const REDO_YELLOW_EDGE = '#e49c20';
const REDO_INK = '#ba0c12';

export const AssignmentRedoButton = styled.button`
	appearance: none;
	border: none;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	min-height: 52px;
	min-width: 145px;
	padding: 0 32px;
	border-radius: 999px;
	background: ${REDO_YELLOW};
	color: ${REDO_INK};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 16px;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	box-shadow: 0 3px 0 ${REDO_YELLOW_EDGE};
	flex-shrink: 0;

	@media (max-width: 640px) {
		width: 100%;
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		background: #cfcfcf;
		color: #6b6b6b;
		box-shadow: none;
	}

	&:focus-visible {
		outline: 2px solid ${REDO_INK};
		outline-offset: 2px;
	}
`;

export const AssignmentRedoIcon = styled.span`
	display: inline-flex;
	flex-shrink: 0;
	width: 20px;
	height: 20px;
	color: inherit;

	svg {
		width: 100%;
		height: 100%;
		display: block;
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

export const GradedBadgeCluster = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	z-index: 1;
	flex: 0 0 auto;
	/* Same rail width as DuePill so right edges match */
	min-width: 168px;
	transform: translateY(-35px);

	${WaitingReviewDecor} {
		width: 168px;

		@media (max-width: 640px) {
			width: 140px;
		}
	}
`;

/** Bees to the left of the grade badge — original waiting bees scale. */
export const GradedBees = styled.img`
	position: absolute;
	z-index: 3;
	inset-inline-end: calc(100% + 13px);
	top: -6px;
	width: min(390px, 115%);
	height: auto;
	object-fit: contain;
	object-position: right center;
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		width: min(280px, 110%);
		top: -2px;
		inset-inline-end: calc(100% + 13px);
	}
`;

export const GradeBadgePill = styled.div`
	position: relative;
	display: inline-flex;
	align-self: center;
	align-items: center;
	justify-content: center;
	min-height: 64px;
	min-width: 168px;
	padding: 14px 28px;
	border-radius: 22px;
	background: ${TEAL};
	color: #ffe566;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(28px, 4.2vw, 40px);
	line-height: 1.05;
	letter-spacing: 0.01em;
	text-shadow: 0 2px 0 rgba(0, 80, 70, 0.25);
	box-sizing: border-box;
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

/** @deprecated — graded now reuses WaitingReviewScene */
export const GradedShell = styled.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 28px;
	margin: 4px 0 22px;
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

/* —— Phase 4D Rubric Card + Popup —— */

export const RubricSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin: 8px 0 4px;
	text-align: start;
`;

export const RubricCard = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 22px;
	border-radius: 28px;
	background: ${theme.colours.white};
	border: none;
	/* Same shadow as profile PocketCard */
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;
`;

export const RubricCardLead = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
`;

export const RubricGridIcon = styled.img`
	flex-shrink: 0;
	width: 36px;
	height: 36px;
	object-fit: contain;
	display: block;
`;

export const RubricCardLabel = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.3;
	color: #6b6570;
`;

export const RubricViewButton = styled.button`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 36px;
	padding: 0 22px;
	border: none;
	border-radius: 999px;
	background: #408fd1;
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.02em;
	cursor: pointer;
	/* Hard bottom shadow — matches Figma startButtonRound */
	box-shadow: 0 4px 0 #1d5f94;

	&:hover {
		filter: brightness(1.04);
	}

	&:active {
		transform: translateY(2px);
		box-shadow: 0 2px 0 #1d5f94;
	}

	&:focus-visible {
		outline: 2px solid ${INK};
		outline-offset: 3px;
	}
`;

export const RubricModalShell = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	max-height: min(88vh, 860px);
	overflow: hidden;
	border-radius: 20px;
	background: ${theme.colours.white};
`;

export const RubricModalHeader = styled.header`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 20px 24px;
	margin: 0;
	background: ${TEAL_DEEP};
	color: ${theme.colours.white};
	text-align: start;
	border-radius: 20px 20px 0 0;
`;

export const RubricModalTitle = styled.h2`
	margin: 0;
	flex: 1 1 auto;
	min-width: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(22px, 2.6vw, 30px);
	line-height: 1.15;
	color: ${theme.colours.white};
`;

export const RubricModalPoints = styled.p`
	margin: 0;
	flex-shrink: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.82);
	white-space: nowrap;
`;

export const RubricModalCloseX = styled.button`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	margin-inline-start: 4px;
	border: none;
	border-radius: 999px;
	background: transparent;
	color: rgba(255, 255, 255, 0.92);
	font-size: 26px;
	line-height: 1;
	cursor: pointer;

	&:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	&:focus-visible {
		outline: 2px solid ${theme.colours.white};
		outline-offset: 2px;
	}
`;

export const RubricModalBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 20px 22px 8px;
	overflow-y: auto;
	overscroll-behavior: contain;
	background: ${theme.colours.white};
`;

export const RubricCriterionCard = styled.article`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 18px 18px 16px;
	border-radius: 18px;
	background: ${theme.colours.white};
	box-shadow: 0 2px 14px rgba(0, 0, 0, 0.08);
	border: 1px solid #eef2f1;
	box-sizing: border-box;
`;

export const RubricCriterionTop = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
`;

export const RubricCriterionLabel = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.25;
	color: ${INK};
	text-align: start;
`;

export const RubricCriterionWeight = styled.span`
	flex-shrink: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	line-height: 1.3;
	color: #9aa0a6;
`;

export const RubricLevelsRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;

	@media (max-width: 560px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
`;

export const RubricLevelChip = styled.div<{ $active?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	min-height: 132px;
	padding: 12px 12px 14px;
	border-radius: 14px;
	background: ${({ $active }) => ($active ? TEAL : '#eceff1')};
	box-sizing: border-box;
	text-align: start;
	color: ${({ $active }) => ($active ? theme.colours.white : INK)};
`;

export const RubricLevelName = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1.2;
	color: inherit;
`;

export const RubricLevelPoints = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.2;
	color: inherit;
	opacity: 0.78;
`;

export const RubricLevelSpacer = styled.span`
	flex: 1 1 auto;
	min-height: 48px;
	width: 100%;
`;

export const RubricLevelCheck = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1 1 auto;
	width: 100%;
	min-height: 40px;
	font-size: 28px;
	line-height: 1;
	font-weight: 700;
	color: inherit;
`;

export const RubricLevelDescriptor = styled.span`
	margin-top: auto;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1.25;
	color: inherit;
`;

export const RubricModalFooter = styled.footer`
	display: flex;
	justify-content: flex-end;
	padding: 12px 22px 20px;
	background: ${theme.colours.white};
`;

export const RubricModalCloseButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 128px;
	min-height: 46px;
	padding: 0 24px;
	border: none;
	border-radius: 12px;
	background: ${TEAL};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;

	&:hover {
		filter: brightness(1.04);
	}

	&:focus-visible {
		outline: 2px solid ${INK};
		outline-offset: 3px;
	}
`;

/** Materials cards — teacher resources + student uploads (Figma row cards). */
const MATERIAL_CARD_SHADOW = `0 2px 8px rgba(0, 0, 0, 0.1)`;

export const MaterialsSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin: 28px 0 20px;
	text-align: start;
	width: 100%;
`;

export const MaterialsHeader = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-start;
	gap: 12px 22px;
`;

export const MaterialsHeaderTitle = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.2;
	color: ${INK};
	text-align: start;
	flex: 0 0 auto;
`;

export const MaterialsHeaderActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 20px;
`;

export const MaterialsHeaderAction = styled.button`
	appearance: none;
	border: none;
	background: transparent;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 4px 0;
	cursor: pointer;
	color: ${INK};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	white-space: nowrap;

	&:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	&:hover:not(:disabled) {
		opacity: 0.82;
	}

	&:focus-visible {
		outline: 2px solid ${TEAL};
		outline-offset: 3px;
		border-radius: 6px;
	}
`;

export const MaterialsHeaderActionIcon = styled.img`
	width: 18px;
	height: 18px;
	object-fit: contain;
	display: block;
	flex: 0 0 auto;
`;

export const MaterialsCardGrid = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: stretch;
	justify-content: flex-start;
	gap: 16px 18px;
`;

/**
 * Figma material tile — fixed compact card (~1.6:1 like design “on”).
 * Do NOT stretch with 1fr (that creates the long broken rectangle).
 */
const MATERIAL_TILE_W = 268;
const MATERIAL_TILE_H = 168;

export const MaterialsCard = styled.li`
	margin: 0;
	flex: 0 0 ${MATERIAL_TILE_W}px;
	width: ${MATERIAL_TILE_W}px;
	max-width: 100%;
	min-width: 0;
	box-sizing: border-box;

	@media (max-width: 560px) {
		flex-basis: min(${MATERIAL_TILE_W}px, 100%);
		width: min(${MATERIAL_TILE_W}px, 100%);
	}
`;

export const MaterialsCardDelete = styled.button`
	appearance: none;
	border: none;
	background: transparent;
	color: #ba0c12;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	cursor: pointer;
	padding: 0;
	flex: 0 0 auto;
	align-self: flex-end;
	margin-top: 4px;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid #ba0c12;
		outline-offset: 2px;
	}
`;

export const MaterialsCardSurface = styled.div`
	position: relative;
	width: 100%;
	height: ${MATERIAL_TILE_H}px;
	margin: 0;
	border-radius: 12px;
	background: ${theme.colours.white};
	border: none;
	box-shadow: ${MATERIAL_CARD_SHADOW};
	padding: 18px 16px;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: center;
	gap: 6px;
	text-align: start;
	box-sizing: border-box;
`;

/** Figma: [icon] | type + filename — single horizontal row inside the tile. */
export const MaterialsCardButton = styled.button`
	appearance: none;
	width: 100%;
	margin: 0;
	border: none;
	background: transparent;
	padding: 0;
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12px;
	text-align: start;
	cursor: pointer;
	box-sizing: border-box;
	min-width: 0;
	min-height: 0;
	flex: 1 1 auto;

	&:disabled {
		cursor: default;
	}

	&:focus-visible {
		outline: 2px solid ${TEAL};
		outline-offset: 3px;
		border-radius: 8px;
	}
`;

export const MaterialsCardTop = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	gap: 3px;
	min-width: 0;
	flex: 1 1 auto;
`;

export const MaterialsCardIcon = styled.img`
	width: 56px;
	height: 56px;
	object-fit: contain;
	object-position: center;
	display: block;
	flex: 0 0 56px;
	image-rendering: auto;
	-webkit-user-drag: none;
`;

export const MaterialsCardType = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #2f2f2f;
	min-width: 0;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	line-height: 1.2;
`;

export const MaterialsCardName = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	line-height: 1.3;
	color: #9a9a9a;
	overflow: hidden;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	white-space: normal;
	word-break: break-word;
	max-width: 100%;
`;

export const MaterialsCardFooter = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	min-width: 0;
	width: 100%;
`;

export const MaterialsAudio = styled.audio`
	width: 100%;
	max-width: 100%;
	height: 32px;
	margin-top: 8px;
`;

export const MaterialsLockedBanner = styled.p`
	margin: 0;
	padding: 10px 12px;
	border-radius: 12px;
	background: rgba(73, 38, 19, 0.08);
	color: ${INK};
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1.4;
`;

export const MaterialsEmpty = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	color: #8a8494;
`;

export const MaterialsFileInput = styled.input`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
`;

export const MaterialsStatusText = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	color: #8a8494;
`;

/** Kept for delete confirm modal. */
export const MyWorkGhostButton = styled.button`
	appearance: none;
	border: none;
	background: transparent;
	color: ${TEAL_DEEP};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	cursor: pointer;
	padding: 6px 4px;
	text-decoration: underline;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		text-decoration: none;
	}
`;

export const MyWorkConfirmActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 16px;
`;

export const MyWorkConfirmMessage = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.5;
	color: #4a4a4a;
	text-align: start;
`;

export const MaterialsImagePreviewFrame = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: min(92vw, 720px);
	max-height: min(78vh, 640px);
	padding: 8px;
	box-sizing: border-box;
	background: #f7fafb;
	border-radius: 12px;
	overflow: auto;
`;

export const MaterialsImagePreviewImg = styled.img`
	display: block;
	max-width: 100%;
	max-height: min(72vh, 600px);
	width: auto;
	height: auto;
	object-fit: contain;
	border-radius: 8px;
`;

/** @deprecated aliases — prefer Materials* */
export const MyWorkSection = MaterialsSection;
export const MyWorkSub = MaterialsStatusText;
export const MyWorkFileInput = MaterialsFileInput;
export const MyWorkEmpty = MaterialsEmpty;
export const MyWorkLockedBanner = MaterialsLockedBanner;
export const MyWorkAudio = MaterialsAudio;
