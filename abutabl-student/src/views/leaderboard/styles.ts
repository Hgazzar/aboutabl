import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import {
	STUDENT_SHELL_ASIDE_WIDTH,
	STUDENT_SHELL_GAP,
	STUDENT_SHELL_MAIN_COLUMN_WIDTH,
} from 'config/studentShellLayout';
import { DashboardAside } from 'views/dashboard/styles';

export const LeaderboardPageGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(${STUDENT_SHELL_MAIN_COLUMN_WIDTH}px, 1fr) ${STUDENT_SHELL_ASIDE_WIDTH}px;
	gap: ${STUDENT_SHELL_GAP}px;
	align-items: start;
	min-width: 0;
	width: 100%;
	font-family: ${theme.fonts.Nunito};
	box-sizing: border-box;

	@media (max-width: 991px) {
		grid-template-columns: 1fr;
	}
`;

export const LeaderboardMainColumn = styled.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: hidden;
	background: ${theme.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
`;

export const Hero = styled.header`
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

export const HeroCopy = styled.div`
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

/** Figma hero title — Fredoka SemiBold 104px, 1px #000 stroke. */
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
`;

export const HeroBoardLabel = styled.p`
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

export const HeroArtWrap = styled.div`
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

export const HeroBird = styled.img`
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

export const BoardCard = styled.section`
	position: relative;
	z-index: 2;
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

export const BackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 14px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.2;
	color: #9c9b9b;
	text-decoration: none;

	&:hover {
		color: #1ebba3;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
		border-radius: 6px;
	}
`;

export const FiltersRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px 16px;
	margin-bottom: 14px;
	border-bottom: 1px solid #ececec;
`;

export const ScopeTabs = styled.div`
	display: flex;
	align-items: stretch;
	gap: 22px;
`;

export const ScopeTab = styled.button<{ $active?: boolean }>`
	appearance: none;
	border: none;
	background: transparent;
	padding: 0 0 10px;
	margin: 0;
	cursor: pointer;
	font-family: ${theme.fonts.Nunito};
	font-weight: ${({ $active }) => ($active ? 800 : 600)};
	font-size: 15px;
	line-height: 1.2;
	color: ${({ $active }) => ($active ? '#1f1e1e' : '#9c9b9b')};
	border-bottom: 3px solid ${({ $active }) => ($active ? '#4C8DFF' : 'transparent')};
	margin-bottom: -1px;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
		border-radius: 4px;
	}
`;

export const RangePills = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 2px;
	padding: 3px;
	border-radius: 999px;
	background: transparent;
	max-width: 100%;
	overflow-x: auto;
`;

export const RangePill = styled.button<{ $active?: boolean }>`
	appearance: none;
	border: none;
	cursor: pointer;
	white-space: nowrap;
	padding: 8px 14px;
	border-radius: 999px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1;
	color: ${({ $active }) => ($active ? '#1E4FBF' : '#9c9b9b')};
	background: ${({ $active }) => ($active ? '#DCE9FF' : 'transparent')};
	transition: background 0.15s ease, color 0.15s ease;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
	}
`;

export const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-height: min(620px, 62vh);
	overflow-y: auto;
	padding-inline-end: 2px;
`;

export const Row = styled.div<{ $tier?: 'gold' | 'silver' | 'bronze' | null; $current?: boolean }>`
	display: grid;
	grid-template-columns: 48px 48px minmax(0, 1fr) auto;
	align-items: center;
	gap: 12px;
	min-height: 66px;
	padding: 10px 14px;
	border-radius: 16px;
	box-sizing: border-box;
	background: ${({ $tier }) => {
		if ($tier === 'gold') return '#FFF6CF';
		if ($tier === 'silver') return '#E9EDF5';
		if ($tier === 'bronze') return '#F7E2D0';
		return '#ffffff';
	}};
	border: ${({ $current, $tier }) => {
		if ($current) return '2px solid #4C8DFF';
		if ($tier) return '1px solid transparent';
		return '1px solid #f0f0f0';
	}};
	box-shadow: ${({ $current }) => ($current ? '0 0 0 1px rgba(76, 141, 255, 0.18)' : 'none')};

	@media (max-width: 520px) {
		grid-template-columns: 40px 40px minmax(0, 1fr);
		grid-template-rows: auto auto;
		row-gap: 6px;

		& > :last-child {
			grid-column: 3 / 4;
			justify-self: end;
		}
	}
`;

export const RankCell = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 0;
`;

export const RankNumber = styled.span`
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1;
	color: #4C8DFF;
`;

export const TrophyBadge = styled.span<{ $tier: 'gold' | 'silver' | 'bronze' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 700;
	font-size: 15px;
	line-height: 1;
	color: #442817;
	background: ${({ $tier }) => {
		if ($tier === 'gold') return 'radial-gradient(circle at 35% 30%, #FFE999 0%, #F5C518 55%, #E0A800 100%)';
		if ($tier === 'silver') return 'radial-gradient(circle at 35% 30%, #F4F7FA 0%, #C5D0DB 55%, #9AABC0 100%)';
		return 'radial-gradient(circle at 35% 30%, #F6D3B0 0%, #D4A06E 55%, #B87A45 100%)';
	}};
	box-shadow:
		inset 0 -2px 0 rgba(0, 0, 0, 0.1),
		0 2px 4px rgba(0, 0, 0, 0.08);
`;

export const Avatar = styled.img`
	width: 44px;
	height: 44px;
	border-radius: 50%;
	object-fit: cover;
	background: #f3f4f6;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
`;

export const NameBlock = styled.div`
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

export const StudentName = styled.strong`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 15px;
	line-height: 1.25;
	color: #1f1e1e;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
`;

export const YouBadge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	background: #1ebba3;
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1.2;
`;

export const XpValue = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	color: #6b5c4e;
	white-space: nowrap;
	unicode-bidi: isolate;
	direction: ltr;
`;

export const EmptyState = styled.p`
	margin: 28px 8px;
	text-align: center;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.45;
	color: #8a7568;
`;

export const ErrorBanner = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin: 16px 20px 0;
	padding: 12px 16px;
	border-radius: 12px;
	background: #fff4f4;
	color: #8b2e2e;
	font-size: 14px;

	button {
		border: none;
		background: transparent;
		color: #1ebba3;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
	}
`;

export const SummaryCard = styled.aside`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 18px;
	padding: 22px 20px 20px;
	border-radius: 24px;
	background: ${theme.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
`;

export const SummaryHead = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	text-align: center;
`;

export const SummaryTitle = styled.h2`
	margin: 0;
	width: 100%;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.25;
	color: #1f1e1e;
	text-align: center;
`;

export const SummaryRange = styled.p`
	margin: 4px 0 0;
	width: 100%;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
	color: #1ebba3;
	text-transform: capitalize;
	text-align: center;
`;

export const SummaryProfile = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
`;

/** Match /learn HelloQuickActions avatar (contain, no rounded crop). */
export const SummaryAvatarFrame = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100px;
	height: 98px;
	line-height: 0;
`;

export const SummaryAvatar = styled.img`
	width: 100%;
	height: 100%;
	border-radius: 0;
	object-fit: contain;
	display: block;
	background: transparent;
`;

export const SummaryLevelBadge = styled.span`
	position: absolute;
	left: 50%;
	bottom: -10px;
	transform: translateX(-50%);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 72px;
	padding: 4px 12px;
	border-radius: 10px;
	background: #1ebba3;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1.2;
	color: #ffe566;
	white-space: nowrap;
	box-shadow: 0 2px 0 rgba(0, 0, 0, 0.08);
`;

export const SummaryName = styled.strong`
	margin-top: 6px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 20px;
	line-height: 1.2;
	color: #1f1e1e;
	text-align: center;
	text-transform: capitalize;
`;

export const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px 16px;
`;

export const StatBlock = styled.div`
	min-width: 0;
`;

export const StatLabel = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1.25;
	color: #1f1e1e;
`;

export const StatValue = styled.strong`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1.25;
	color: #1f1e1e;
`;

export const StatLine = styled.p`
	margin: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 4px;
`;

export const DeltaLine = styled.div<{ $direction: 'up' | 'down' | 'flat' }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-top: 6px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 12px;
	line-height: 1.2;
	color: ${({ $direction }) => {
		if ($direction === 'up') return '#1ebba3';
		if ($direction === 'down') return '#c47a47';
		return '#8a7568';
	}};
`;

export const DeltaArrow = styled.img<{ $down?: boolean }>`
	width: 12px;
	height: 12px;
	object-fit: contain;
	transform: ${({ $down }) => ($down ? 'rotate(180deg)' : 'none')};
	filter: ${({ $down }) =>
		$down
			? 'invert(48%) sepia(42%) saturate(650%) hue-rotate(346deg) brightness(95%) contrast(85%)'
			: 'none'};
`;

export const StreakPill = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 48px;
	padding: 10px 16px;
	border-radius: 16px;
	background: #fff4d6;
	box-sizing: border-box;

	img {
		width: 42px;
		height: 42px;
		object-fit: contain;
		flex-shrink: 0;
	}

	span {
		font-family: ${theme.fonts.Nunito};
		font-weight: 800;
		font-size: 15px;
		line-height: 1.2;
		color: #c47a47;
	}
`;

export const ViewProfileLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-top: 2px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1.2;
	color: #4c8dff;
	text-decoration: none;
	text-transform: uppercase;
	letter-spacing: 0.02em;

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
		border-radius: 4px;
	}
`;

export { DashboardAside };
