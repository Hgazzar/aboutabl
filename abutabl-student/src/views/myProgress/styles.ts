import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import {
	STUDENT_SHELL_ASIDE_WIDTH,
	STUDENT_SHELL_GAP,
	STUDENT_SHELL_MAIN_COLUMN_WIDTH,
} from 'config/studentShellLayout';
import {
	BAR_TRACK_HEIGHT_PERCENT,
	BAR_TRACK_LEFT_PERCENT,
	BAR_TRACK_TOP_PERCENT,
	BAR_TRACK_WIDTH_PERCENT,
} from 'views/dashboard/components/myProgressBarUtils';

export const Page = styled.div`
	display: grid;
	grid-template-columns: minmax(${STUDENT_SHELL_MAIN_COLUMN_WIDTH}px, 1fr) ${STUDENT_SHELL_ASIDE_WIDTH}px;
	gap: ${STUDENT_SHELL_GAP}px;
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
	font-family: ${theme.fonts.Nunito};

	@media (max-width: 991px) {
		grid-template-columns: 1fr;
	}
`;

export const MainColumn = styled.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: hidden;
	background: ${theme.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
	box-sizing: border-box;
`;

export const BoardCard = styled.section`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 24px;
	margin: 0 20px 20px;
	padding: 18px 22px 22px;
	border-radius: 24px 24px 20px 20px;
	background: ${theme.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;

	@media (max-width: 640px) {
		margin: 0 12px 12px;
		padding: 14px 12px 16px;
	}
`;

/** Leaderboard-matched hero shell for My Progress. */
export const ProgressHero = styled.header`
	position: relative;
	min-height: 300px;
	padding: 12px 0 0 28px;
	box-sizing: border-box;
	overflow: hidden;

	@media (max-width: 720px) {
		min-height: 0;
		padding: 16px 16px 0;
	}
`;

export const ProgressHeroCopy = styled.div`
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

	@media (max-width: 720px) {
		max-width: 100%;
		padding-bottom: 12px;
	}
`;

export const ProgressHeroTitle = styled.h1`
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

	@media (max-width: 1100px) {
		font-size: clamp(56px, 8.5vw, 104px);
	}

	@media (max-width: 720px) {
		font-size: clamp(40px, 12vw, 64px);
	}
`;

export const ProgressHeroTitleLine = styled.span`
	display: block;
	white-space: nowrap;
`;

export const ProgressHeroSubtitle = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
`;

export const ProgressHeroPageLabel = styled.p`
	margin: 6px 0 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(28px, 3.6vw, 40px);
	line-height: 1.15;
	color: #ffb300;
	-webkit-text-stroke: 1px #000000;
	paint-order: stroke fill;
	text-shadow:
		1px 0 0 #000000,
		-1px 0 0 #000000,
		0 1px 0 #000000,
		0 -1px 0 #000000;
`;

export const ProgressHeroArtWrap = styled.div`
	position: absolute;
	z-index: 1;
	inset-inline-end: -18px;
	bottom: -36px;
	width: min(460px, 52%);
	aspect-ratio: 530 / 420;
	overflow: visible;
	pointer-events: none;

	@media (max-width: 720px) {
		position: relative;
		inset-inline-end: auto;
		bottom: auto;
		width: min(280px, 90%);
		margin: 0 auto -20px;
	}
`;

export const ProgressHeroSpark = styled.img`
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

export const ProgressHeroBird = styled.img`
	position: relative;
	z-index: 1;
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center bottom;
	user-select: none;
	pointer-events: none;
`;

export const AsideColumn = styled.aside`
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
	box-sizing: border-box;

	@media (max-width: 991px) {
		width: 100%;
	}
`;

export const ErrorBanner = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	border-radius: 12px;
	background: #fde8e8;
	color: #b42318;
	font-weight: 600;
	font-size: 14px;

	button {
		border: none;
		background: transparent;
		color: #408fd1;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
	}
`;

export const EmptyHint = styled.div`
	margin: 0;
	padding: 24px;
	text-align: center;
	color: #9a9288;
	font-weight: 600;

	button {
		border: none;
		background: transparent;
		color: #408fd1;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
	}
`;

export const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	min-width: 0;
`;

export const SectionTitle = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;
`;

export const Card = styled.div`
	background: ${theme.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: 24px;
	box-sizing: border-box;
`;

export const BackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 8px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	color: #408fd1;
	text-decoration: none;

	&:hover {
		filter: brightness(1.05);
	}
`;

export const ProgressFrame = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 110px;
	grid-template-rows: auto auto;
	column-gap: 12px;
	row-gap: 4px;
	box-sizing: border-box;
	width: 100%;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

/** Mirrors profile `CurrentLevelCard` ProgressFrame spacing. */
export const PocketCard = styled.div`
	position: relative;
	width: 100%;
	max-width: 720px;
	background: ${theme.colours.white};
	border-radius: 16px;
	padding: 16px 32px 18px;
	box-sizing: border-box;
	clip-path: inset(0 -16px -16px -16px);
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);

	@media (max-width: 767px) {
		padding: 14px 16px 16px;
	}
`;

export const LevelRow = styled.div`
	grid-column: 1;
	grid-row: 1;
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
	transform: translateY(-8px);

	@media (max-width: 640px) {
		flex-wrap: wrap;
		transform: none;
	}
`;

export const LevelLeft = styled.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 8px;
	min-width: 0;
`;

export const LevelLabel = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
`;

export const LevelBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 37px;
	height: 32px;
	padding: 0 8px;
	border-radius: 8px;
	background: #1ebba3;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1;
	color: ${theme.colours.white};
`;

export const BadgeName = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	text-transform: capitalize;
	white-space: nowrap;
`;

export const XpRatio = styled.div`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 5px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	white-space: nowrap;

	img {
		width: 26px;
		height: 24px;
		object-fit: contain;
	}
`;

export const BarWrap = styled.div`
	grid-column: 1;
	grid-row: 2;
	position: relative;
	width: 100%;
	max-width: 568px;
	line-height: 0;
	align-self: end;
	transform: translateY(-15px);

	@media (max-width: 640px) {
		max-width: 100%;
		transform: none;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		isolation: isolate;
	}
`;

export const BarFill = styled.div<{ $percent: number }>`
	position: absolute;
	left: ${BAR_TRACK_LEFT_PERCENT}%;
	top: ${BAR_TRACK_TOP_PERCENT}%;
	height: ${BAR_TRACK_HEIGHT_PERCENT}%;
	width: calc(${BAR_TRACK_WIDTH_PERCENT}% * ${({ $percent }) => $percent / 100});
	border-radius: 6px;
	background: linear-gradient(
		90deg,
		#72d8b9 16.83%,
		#d5b454 38.94%,
		#d1b658 60.1%,
		#eac65c 77.4%,
		#e5b314 100%
	);
	pointer-events: none;
`;

export const AchieverBadgeWrap = styled.div`
	grid-column: 2;
	grid-row: 1;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	transform: translateY(20px);

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
		justify-content: flex-start;
		transform: none;
	}
`;

export const AchieverBadgeImg = styled.img<{ $unlocked: boolean }>`
	width: 110px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
	filter: ${({ $unlocked }) => ($unlocked ? 'none' : 'grayscale(1) brightness(0.92)')};
`;

export const AchieverLabel = styled.span`
	grid-column: 2;
	grid-row: 2;
	justify-self: center;
	align-self: end;
	transform: translateY(-15px);
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1;
	color: #937c61;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 4;
		justify-self: start;
		transform: none;
	}
`;

export const HeroFooter = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
	max-width: 720px;
	margin-top: 16px;
`;

export const LevelsAway = styled.p`
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	min-width: 0;
	flex: 1 1 auto;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 16px;
	line-height: 1.4;
	color: #ea780c;

	img {
		width: 23px;
		height: 23px;
		object-fit: contain;
		flex-shrink: 0;
	}
`;

export const WeeklyXpBlock = styled.div<{ $trend: 'up' | 'down' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
	white-space: nowrap;
	color: ${({ $trend }) => ($trend === 'up' ? '#1ebba3' : '#e05a5a')};
`;

export const WeeklyXpArrow = styled.img<{ $trend: 'up' | 'down' }>`
	width: 14px;
	height: 14px;
	flex-shrink: 0;
	object-fit: contain;
	transform: ${({ $trend }) => ($trend === 'down' ? 'rotate(180deg)' : 'none')};
	filter: ${({ $trend }) =>
		$trend === 'down'
			? 'brightness(0) saturate(100%) invert(40%) sepia(62%) saturate(1400%) hue-rotate(330deg)'
			: 'none'};
`;

export const WeeklyXpValue = styled.strong<{ $trend: 'up' | 'down' }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 8px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 16px;
	line-height: 1.25;
	background: ${({ $trend }) => ($trend === 'up' ? '#d8f4ee' : '#fde8e8')};
	color: ${({ $trend }) => ($trend === 'up' ? '#1ebba3' : '#e05a5a')};
`;

export const WeeklyXpLabel = styled.span<{ $trend: 'up' | 'down' }>`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.25;
	color: ${({ $trend }) => ($trend === 'up' ? '#1ebba3' : '#e05a5a')};
`;

export const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;

	@media (max-width: 780px) {
		grid-template-columns: 1fr;
	}
`;

export const StatCard = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 72px;
	padding: 12px 16px;
	border-radius: 16px;
	background: linear-gradient(135deg, #42b5a1 0%, #399f8d 100%);
	box-sizing: border-box;

	img {
		width: 34px;
		height: 34px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.label {
		display: block;
		font-family: ${theme.fonts.Nunito};
		font-weight: 700;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.9);
	}

	.value {
		display: block;
		font-family: ${theme.fonts.Fredoka};
		font-weight: 500;
		font-size: 22px;
		line-height: 1.15;
		color: ${theme.colours.white};
	}
`;

export const BooksList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

/** Figma goalFrame book shell accents by rotating theme. */
const THEME: Record<
	string,
	{
		shell: string;
		shellBorder: string;
		panelBorder: string;
		title: string;
		subtitle: string;
		units: string;
		bar: string;
		iconBg: string;
		goalBg: string;
		goalBorder: string;
		cta: string;
	}
> = {
	lavender: {
		shell: '#EACBFC40',
		shellBorder: '#dfbefa',
		panelBorder: '#d8cff3',
		title: '#3D2A5C',
		subtitle: '#5C4A7A',
		units: '#7B61FF',
		bar: 'linear-gradient(90deg, #7B61FF 0%, #B8A6FF 100%)',
		iconBg: '#7B61FF',
		goalBg: '#E6D9F8',
		goalBorder: '#d8cff3',
		cta: '#7B61FF',
	},
	cream: {
		shell: '#F8EFD880',
		shellBorder: '#EED9A4',
		panelBorder: '#EED9A4',
		title: '#442817',
		subtitle: '#6B635A',
		units: '#C9A227',
		bar: 'linear-gradient(90deg, #E8A317 0%, #F0C66A 100%)',
		iconBg: '#E8A317',
		goalBg: '#F8EFD8',
		goalBorder: '#EED9A4',
		cta: '#20B8A0',
	},
	mint: {
		shell: '#F0F7E3',
		shellBorder: '#DDEAC8',
		panelBorder: '#DDEAC8',
		title: '#3A4A28',
		subtitle: '#5C6B4A',
		units: '#9ec851',
		bar: 'linear-gradient(90deg, #9ec851 0%, #b8d86e 100%)',
		iconBg: '#9ec851',
		goalBg: '#e3eecd',
		goalBorder: '#DDEAC8',
		cta: '#9ec851',
	},
	pink: {
		shell: '#FFF5F8',
		shellBorder: '#FAD2E1',
		panelBorder: '#F8B4CB',
		title: '#7A2240',
		subtitle: '#9A4A62',
		units: '#E85A9B',
		bar: 'linear-gradient(90deg, #E85A9B 0%, #F5A0C4 100%)',
		iconBg: '#E85A9B',
		goalBg: '#FFE4EF',
		goalBorder: '#F8B4CB',
		cta: '#E85A9B',
	},
};

export const BookCard = styled.article<{ $theme: string }>`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 14px;
	border-radius: 28px;
	background: ${({ $theme }) => THEME[$theme]?.shell ?? THEME.lavender.shell};
	border: 2px solid
		${({ $theme }) => THEME[$theme]?.shellBorder ?? THEME.lavender.shellBorder};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;
	overflow: hidden;
`;

export const BookHeader = styled.div<{ $theme: string }>`
	position: relative;
	display: flex;
	align-items: center;
	gap: 14px;
	min-height: 112px;
	padding: 18px 20px;
	border-radius: 20px;
	overflow: hidden;
	box-sizing: border-box;
	isolation: isolate;
	background: ${({ $theme }) =>
		$theme === 'lavender'
			? '#efe6ff'
			: $theme === 'cream'
				? '#f7efdb'
				: $theme === 'mint'
					? '#e8f2d8'
					: '#FFF5F8'};
`;

export const BookHeaderFrame = styled.img<{ $opacity?: number }>`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: fill;
	pointer-events: none;
	user-select: none;
	z-index: 0;
	opacity: ${({ $opacity }) => ($opacity != null ? $opacity : 1)};
`;

export const BookCover = styled.img`
	position: relative;
	z-index: 1;
	width: 64px;
	height: 86px;
	object-fit: cover;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.85);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	flex-shrink: 0;
`;

export const BookCoverFallback = styled.div`
	position: relative;
	z-index: 1;
	width: 64px;
	height: 86px;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.85);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	flex-shrink: 0;
`;

export const BookMeta = styled.div`
	position: relative;
	z-index: 1;
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const BookTitle = styled.h3<{ $theme: string }>`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.2;
	color: ${({ $theme }) => THEME[$theme]?.title ?? THEME.lavender.title};
`;

export const BookDescription = styled.p<{ $theme: string }>`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: ${({ $theme }) => THEME[$theme]?.subtitle ?? THEME.lavender.subtitle};
`;

export const StarsRow = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
	align-self: flex-start;
	margin-top: 4px;
`;

export const HexStar = styled.span<{ $filled: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 33px;
	flex-shrink: 0;
	filter: ${({ $filled }) => ($filled ? 'none' : 'grayscale(1)')};

	img {
		width: 30px;
		height: 33px;
		object-fit: contain;
		display: block;
	}
`;

export const ProgressPanel = styled.div<{ $theme?: string }>`
	padding: 14px 16px;
	border-radius: 18px;
	border: 2px solid
		${({ $theme }) => THEME[$theme ?? 'lavender']?.panelBorder ?? THEME.lavender.panelBorder};
	background: ${theme.colours.white};
	box-sizing: border-box;
`;

export const ProgressRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 10px;
`;

export const ProgressLabel = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 15px;
	color: #2a2438;
`;

export const UnitsLabel = styled.span<{ $theme: string }>`
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	color: ${({ $theme }) => THEME[$theme]?.units ?? THEME.lavender.units};
	white-space: nowrap;
`;

export const UnitsTrack = styled.div`
	width: 100%;
	height: 14px;
	border-radius: 999px;
	background: #ece8f2;
	overflow: hidden;
`;

export const UnitsFill = styled.div<{ $percent: number; $theme: string }>`
	height: 100%;
	width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
	border-radius: 999px;
	background: ${({ $theme }) => THEME[$theme]?.bar ?? THEME.lavender.bar};
`;

export const MetricsRow = styled.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: stretch;
	gap: 10px;
	width: 100%;

	/* 1 / 2 / 3 visible chips share one row evenly */
	& > [data-metric] {
		flex: 1 1 0;
		min-width: 0;
	}
`;

export const MetricChip = styled.div<{ $theme: string }>`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: center;
	gap: 8px;
	min-height: 108px;
	padding: 12px 10px 14px;
	border-radius: 20px;
	border: 2px solid
		${({ $theme }) => THEME[$theme]?.panelBorder ?? THEME.lavender.panelBorder};
	background: ${theme.colours.white};
	box-sizing: border-box;

	.top {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-width: 0;
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: ${({ $theme }) => THEME[$theme]?.iconBg ?? THEME.lavender.iconBg};
		flex-shrink: 0;

		img,
		svg {
			width: 22px;
			height: 22px;
			display: block;
		}
	}

	.icon-badge {
		width: 40px;
		height: 40px;
		object-fit: contain;
		flex-shrink: 0;
		display: block;
	}

	.value {
		font-family: ${theme.fonts.Fredoka};
		font-weight: 600;
		font-size: clamp(14px, 2.4vw, 18px);
		line-height: 1.15;
		color: #2a2438;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.divider {
		display: block;
		width: 100%;
		height: 1px;
		background: #e6e1ec;
		flex-shrink: 0;
	}

	.label {
		font-family: ${theme.fonts.Nunito};
		font-weight: 700;
		font-size: clamp(11px, 1.8vw, 13px);
		line-height: 1.2;
		color: #8a8494;
		text-align: center;
		min-width: 0;
		overflow-wrap: anywhere;
	}
`;

export const NextGoalRow = styled.div<{ $theme?: string }>`
	position: relative;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px 18px;
	min-height: 143px;
	padding: 18px 22px 28px;
	border-radius: 20px;
	border: 2px solid
		${({ $theme }) => THEME[$theme ?? 'lavender']?.goalBorder ?? THEME.lavender.goalBorder};
	background: ${({ $theme }) =>
		THEME[$theme ?? 'lavender']?.goalBg ?? THEME.lavender.goalBg};
	overflow: hidden;
	box-sizing: border-box;
	isolation: isolate;
`;

export const NextGoalCopy = styled.div<{ $theme?: string }>`
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
	flex: 1 1 260px;

	.bird {
		width: 106px;
		height: 103px;
		object-fit: contain;
		object-position: left bottom;
		flex-shrink: 0;
		margin-bottom: -10px;
	}

	.copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		min-width: 0;
	}

	.eyebrow {
		margin: 0;
		font-family: ${theme.fonts.Fredoka};
		font-weight: 600;
		font-size: 18px;
		line-height: 1.2;
		color: ${({ $theme }) =>
			$theme === 'pink'
				? '#7A2240'
				: $theme === 'cream' || $theme === 'mint'
					? '#442817'
					: '#3d2a5c'};
	}

	.title {
		margin: 0;
		font-family: ${theme.fonts.Nunito};
		font-weight: 700;
		font-size: 15px;
		line-height: 1.35;
		color: ${({ $theme }) =>
			$theme === 'pink'
				? '#9A4A62'
				: $theme === 'cream' || $theme === 'mint'
					? '#6B635A'
					: '#4a3b66'};
	}

	.reward {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-top: 4px;
		font-family: ${theme.fonts.Nunito};
		font-weight: 700;
		font-size: 14px;
		line-height: 1.2;
		color: ${({ $theme }) =>
			$theme === 'pink'
				? '#B06A80'
				: $theme === 'cream' || $theme === 'mint'
					? '#8A7350'
					: '#5c4a7a'};

		img {
			width: 20px;
			height: 18px;
			object-fit: contain;
			opacity: 1;
		}
	}
`;

export const ContinueCta = styled(Link)<{ $theme: string }>`
	position: relative;
	z-index: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 14px 22px;
	border-radius: 999px;
	background: ${({ $theme }) => THEME[$theme]?.cta ?? THEME.lavender.cta};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	text-decoration: none;
	white-space: nowrap;
	flex-shrink: 0;
	box-shadow: ${({ $theme }) =>
		$theme === 'mint'
			? '0 4px 0 #719537'
			: $theme === 'cream'
				? '0 4px 12px rgba(32, 184, 160, 0.35)'
				: $theme === 'pink'
					? '0 4px 12px rgba(232, 90, 155, 0.35)'
					: '0 4px 12px rgba(123, 97, 255, 0.35)'};

	&:hover {
		filter: brightness(1.05);
	}
`;

export const AchievementsList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

export const AchievementRow = styled.li`
	display: flex;
	align-items: center;
	gap: 16px;
	min-width: 0;
`;

export const AchievementIcon = styled.img<{ $earned: boolean }>`
	width: 72px;
	height: 72px;
	flex-shrink: 0;
	object-fit: contain;
	border-radius: 16px;
	opacity: ${({ $earned }) => ($earned ? 1 : 0.88)};
	filter: ${({ $earned }) => ($earned ? 'none' : 'grayscale(0.2)')};
`;

export const AchievementBody = styled.div`
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const AchievementTitle = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 16px;
	line-height: 1.3;
	color: #1f1e1e;
`;

export const AchievementTrack = styled.div`
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: #ebe7e1;
	overflow: hidden;
`;

export const AchievementFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
	border-radius: 999px;
	background: #f5c518;
`;

export const AchievementDescription = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: #9a9288;
`;
