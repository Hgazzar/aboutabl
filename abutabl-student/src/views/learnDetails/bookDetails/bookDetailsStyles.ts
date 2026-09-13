import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import {
	STUDENT_SHELL_ASIDE_WIDTH,
	STUDENT_SHELL_GAP,
	STUDENT_SHELL_MAIN_COLUMN_WIDTH,
} from 'config/studentShellLayout';

/** Single outer scroll page — no fixed-height overflow panels. */
export const BookDetailsPage = styled.div`
	display: grid;
	grid-template-columns: minmax(${STUDENT_SHELL_MAIN_COLUMN_WIDTH}px, 1fr) ${STUDENT_SHELL_ASIDE_WIDTH}px;
	gap: ${STUDENT_SHELL_GAP}px;
	min-width: 0;
	width: 100%;
	font-family: ${theme.fonts.Nunito};
	box-sizing: border-box;

	@media (max-width: 1100px) {
		grid-template-columns: 1fr;
	}
`;

export const BookDetailsMain = styled.main`
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
	border-radius: 20px;
	background: ${theme.colours.Lotion};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
	padding: 20px 22px 28px;
	box-sizing: border-box;
	/* Natural page growth — no nested scroll */
	overflow: visible;
`;

export const BookDetailsAside = styled.aside`
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;

	@media (max-width: 1100px) {
		width: 100%;
	}
`;

export const BackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	width: fit-content;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	color: #9c9b9b;
	text-decoration: none;

	&:hover {
		color: ${theme.colours.LightSeaGreen};
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
		border-radius: 6px;
	}
`;

export const ErrorBanner = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 16px;
	border-radius: 12px;
	background: #fff5f5;
	color: ${theme.colours.error};
	font-size: 14px;

	button {
		border: none;
		background: ${theme.colours.LightSeaGreen};
		color: white;
		border-radius: 999px;
		padding: 8px 14px;
		cursor: pointer;
		font-weight: 700;
	}
`;

export const EmptyHint = styled.p`
	margin: 0;
	padding: 24px;
	text-align: center;
	color: ${theme.colours['Grey-body']};
	font-size: 15px;
`;

/* —— Hero —— */

export const HeroBanner = styled.section<{
	$theme?: 'math' | 'science' | 'default';
	$bannerUrl?: string | null;
}>`
	position: relative;
	display: grid;
	grid-template-columns: ${({ $theme }) =>
		$theme === 'math' || $theme === 'science' ? 'minmax(150px, 34%) 1fr' : 'auto 1fr'};
	gap: 20px;
	align-items: center;
	min-height: ${({ $theme }) => ($theme === 'math' || $theme === 'science' ? '206px' : '168px')};
	padding: ${({ $theme }) =>
		$theme === 'math' || $theme === 'science' ? '22px 28px 22px 18px' : '22px 24px'};
	border-radius: 24px;
	background-color: #ff9f43;
	background-image: ${({ $bannerUrl, $theme }) => {
		if ($bannerUrl) return `url(${$bannerUrl})`;
		if ($theme === 'default' || !$theme) {
			return 'linear-gradient(120deg, #ff9f43 0%, #ffc234 55%, #ffe08a 100%)';
		}
		return 'none';
	}};
	background-repeat: no-repeat;
	background-position: center;
	background-size: cover;
	overflow: hidden;
	box-sizing: border-box;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		min-height: 180px;
		padding: 18px 16px;
		text-align: start;
	}
`;

export const HeroCover = styled.img`
	width: 96px;
	height: 120px;
	object-fit: cover;
	border-radius: 14px;
	box-shadow: 0 8px 16px rgba(68, 40, 23, 0.2);
	background: #fff;
`;

export const HeroCoverFallback = styled.div`
	width: 96px;
	height: 120px;
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.35);
`;

/** Spacer reserves the illustrated book zone on themed banners. */
export const HeroArtSpacer = styled.div`
	min-height: 120px;
	pointer-events: none;

	@media (max-width: 640px) {
		display: none;
	}
`;

export const HeroCopy = styled.div<{ $theme?: 'math' | 'science' | 'default' }>`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	color: #fff;
	text-align: start;
	justify-content: center;
`;

export const HeroTitle = styled.h1`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(26px, 3.5vw, 36px);
	line-height: 1.15;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
`;

export const HeroUnit = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 15px;
	opacity: 0.95;
`;

export const HeroProgressRow = styled.div<{ $theme?: 'math' | 'science' | 'default' }>`
	display: flex;
	align-items: center;
	gap: 14px;
	margin-top: 10px;
	width: min(420px, 100%);
	padding: 10px 14px;
	border-radius: 999px;
	background: ${({ $theme }) =>
		$theme === 'science' ? 'rgba(255, 230, 245, 0.92)' : 'rgba(255, 236, 210, 0.92)'};
	box-sizing: border-box;
`;

export const HeroProgressLabel = styled.p<{ $theme?: 'math' | 'science' | 'default' }>`
	margin: 0;
	flex-shrink: 0;
	font-size: 13px;
	font-weight: 800;
	color: ${({ $theme }) => ($theme === 'science' ? '#6b3a7a' : '#8a4a12')};
	white-space: nowrap;
`;

export const HeroTrack = styled.div<{ $theme?: 'math' | 'science' | 'default' }>`
	flex: 1;
	min-width: 0;
	height: 10px;
	border-radius: 999px;
	background: ${({ $theme }) =>
		$theme === 'science' ? 'rgba(107, 58, 122, 0.25)' : 'rgba(90, 40, 10, 0.35)'};
	overflow: hidden;
`;

export const HeroFill = styled.div<{ $percent: number; $theme?: 'math' | 'science' | 'default' }>`
	height: 100%;
	width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
	border-radius: 999px;
	background: ${({ $theme }) => ($theme === 'science' ? '#c45aad' : '#ff7a1a')};
`;

export const HeroContinue = styled(Link)<{ $theme?: 'math' | 'science' | 'default' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-top: 6px;
	width: fit-content;
	padding: 10px 18px;
	border-radius: 999px;
	background: ${({ $theme }) =>
		$theme === 'math' || $theme === 'science' ? 'rgba(255, 255, 255, 0.95)' : '#fff'};
	color: ${({ $theme }) => ($theme === 'science' ? '#5b2d6b' : '#442817')};
	font-family: ${theme.fonts.Fredoka};
	font-size: 15px;
	text-decoration: none;
	box-shadow: 0 3px 0 rgba(68, 40, 23, 0.15);

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

/* —— Unit tabs —— */

export const UnitTabsBar = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	overflow-x: auto;
	padding-bottom: 4px;
	scrollbar-width: thin;
	-webkit-overflow-scrolling: touch;

	&::-webkit-scrollbar {
		height: 4px;
	}
`;

export const UnitTab = styled.button<{ $active?: boolean }>`
	flex: 0 0 auto;
	border: none;
	cursor: pointer;
	padding: 10px 16px;
	border-radius: 999px;
	font-family: ${theme.fonts.Fredoka};
	font-size: 14px;
	background: ${({ $active }) => ($active ? '#0f7668' : '#fff')};
	color: ${({ $active }) => ($active ? '#fff' : '#6b7280')};
	box-shadow: ${({ $active }) => ($active ? '0 2px 0 rgba(15, 118, 104, 0.35)' : '0 0 0 1px #e5e7eb')};

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
	}
`;

export const UnitOverflowBtn = styled(UnitTab)`
	background: #f3f4f6;
	color: #374151;
`;

export const UnitHeaderBlock = styled.header`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	text-align: center;
	padding: 8px 0 4px;
`;

export const UnitHeaderTitle = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(20px, 2.5vw, 26px);
	color: #442817;
`;

export const UnitHeaderSub = styled.p`
	margin: 0;
	font-size: 14px;
	color: #6b7280;
`;

/* —— Timeline —— */

export const TimelineList = styled.ol`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0;
	position: relative;
`;

export const TimelineItem = styled.li`
	position: relative;
	display: grid;
	grid-template-columns: 28px 1fr;
	gap: 12px;
	padding-bottom: 14px;

	&:not(:last-child)::before {
		content: '';
		position: absolute;
		inset-inline-start: 12px;
		top: 28px;
		bottom: 0;
		width: 2px;
		background: #e5e7eb;
	}
`;

export const TimelineDot = styled.span<{ $tone: string }>`
	width: 24px;
	height: 24px;
	border-radius: 999px;
	background: ${({ $tone }) => $tone};
	box-shadow: 0 0 0 4px #fff;
	margin-top: 14px;
	z-index: 1;
`;

export const TimelineCard = styled.div<{ $bg: string }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 16px;
	border-radius: 18px;
	background: ${({ $bg }) => $bg};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	min-width: 0;
`;

export const TimelineMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
	text-align: start;
`;

export const TimelineIcon = styled.span`
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.7);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
`;

export const TimelineTitle = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-size: 16px;
	color: #442817;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const TimelineKind = styled.p`
	margin: 2px 0 0;
	font-size: 12px;
	color: #6b7280;
`;

export const TimelineCta = styled(Link)`
	flex-shrink: 0;
	padding: 8px 14px;
	border-radius: 999px;
	background: #0f7668;
	color: #fff;
	font-family: ${theme.fonts.Fredoka};
	font-size: 13px;
	text-decoration: none;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
	}
`;

export const TimelineCtaExternal = styled.a`
	flex-shrink: 0;
	padding: 8px 14px;
	border-radius: 999px;
	background: #0f7668;
	color: #fff;
	font-family: ${theme.fonts.Fredoka};
	font-size: 13px;
	text-decoration: none;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
	}
`;

/* —— Aside widgets —— */

export const AsideCard = styled.section`
	background: ${theme.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: 18px;
	box-sizing: border-box;
`;

export const AsideTitle = styled.h2`
	margin: 0 0 12px;
	font-family: ${theme.fonts.Fredoka};
	font-size: 18px;
	color: #442817;
	text-align: center;
`;

export const MascotBlock = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 8px 0 4px;
`;

export const MascotImg = styled.img`
	width: min(180px, 100%);
	height: auto;
	object-fit: contain;
`;

export const MascotCaption = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-size: 15px;
	color: #442817;
`;

export const ViewAllLink = styled(Link)`
	display: inline-block;
	margin-top: 12px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.04em;
	color: #3b82f6;
	text-decoration: none;
	text-align: center;
	width: 100%;
`;

export const QuestRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 14px;
`;

export const QuestTitle = styled.p`
	margin: 0;
	font-weight: 700;
	font-size: 13px;
	color: #442817;
`;

export const QuestTrack = styled.div`
	height: 8px;
	border-radius: 999px;
	background: #f3f4f6;
	overflow: hidden;
`;

export const QuestFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
	background: ${theme.colours.LightSeaGreen};
`;

export const StarsRow = styled.div`
	display: flex;
	justify-content: center;
	gap: 6px;
	margin: 8px 0;
`;

export const StarSlot = styled.span<{ $filled: boolean }>`
	width: 22px;
	height: 22px;
	border-radius: 999px;
	background: ${({ $filled }) => ($filled ? '#fbbf24' : '#e5e7eb')};
	opacity: ${({ $filled }) => ($filled ? 1 : 0.7)};
`;
