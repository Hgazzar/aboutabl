import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import {
	STUDENT_SHELL_GAP,
	STUDENT_SHELL_MAIN_COLUMN_WIDTH,
} from 'config/studentShellLayout';
import type { MyBooksAdventureTheme } from './myBooksPageState';

const THEME_BG: Record<MyBooksAdventureTheme, string> = {
	teal: '#E6F7F4',
	sand: '#FFF4D6',
	lavender: '#EFE8FF',
};

const THEME_ACCENT: Record<MyBooksAdventureTheme, string> = {
	teal: '#1EBBA3',
	sand: '#E89D2C',
	lavender: '#7B6CF6',
};

const THEME_BAR: Record<MyBooksAdventureTheme, string> = {
	teal: '#1EBBA3',
	sand: '#FFC234',
	lavender: '#7B6CF6',
};

export const BooksPage = styled.div`
	display: grid;
	grid-template-columns: minmax(${STUDENT_SHELL_MAIN_COLUMN_WIDTH}px, 1fr);
	min-width: 0;
	width: 100%;
	font-family: ${theme.fonts.Nunito};
	box-sizing: border-box;
`;

export const BooksMain = styled.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: visible;
	background: ${theme.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
	box-sizing: border-box;
`;

export const BooksBoard = styled.section`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 28px;
	margin: ${STUDENT_SHELL_GAP}px ${STUDENT_SHELL_GAP}px ${STUDENT_SHELL_GAP}px;
	padding: 22px 24px 28px;
	border-radius: 24px;
	background: ${theme.colours.Lotion};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;
	/* Let hero bird hang past the board onto the green chrome. */
	overflow: visible;

	@media (max-width: 640px) {
		margin: 12px;
		padding: 16px 14px 20px;
		gap: 20px;
	}
`;

export const BooksErrorBanner = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin: ${STUDENT_SHELL_GAP}px ${STUDENT_SHELL_GAP}px 0;
	padding: 12px 16px;
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.92);
	color: ${theme.colours.error};
	font-size: 14px;

	button {
		border: none;
		background: ${theme.colours.LightSeaGreen};
		color: ${theme.colours.white};
		border-radius: 999px;
		padding: 8px 14px;
		cursor: pointer;
		font-family: ${theme.fonts.Nunito};
		font-weight: 700;
	}
`;

export const BooksEmptyHint = styled.p`
	margin: ${STUDENT_SHELL_GAP}px;
	padding: 24px;
	border-radius: 16px;
	background: rgba(255, 255, 255, 0.92);
	text-align: center;
	color: ${theme.colours['Grey-body']};
	font-size: 15px;
`;

export const BooksFooter = styled.footer`
	padding: 8px 24px 20px;
	text-align: center;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	line-height: 1.4;
	color: rgba(255, 255, 255, 0.88);
`;

/* —— Hero —— */

/**
 * Hero card sits on the cream board. Banner art includes cream frame + bird;
 * bleed past board padding + side margin so the bird tail sits on green.
 */
export const HeroSection = styled.section`
	position: relative;
	z-index: 3;
	width: calc(100% + 24px + ${STUDENT_SHELL_GAP}px);
	max-width: none;
	margin: 0;
	margin-inline-end: calc(-24px - ${STUDENT_SHELL_GAP}px);
	padding: 0;
	background: transparent;
	box-sizing: border-box;
	overflow: visible;

	@media (max-width: 640px) {
		width: calc(100% + 14px + 12px);
		margin-inline-end: calc(-14px - 12px);
	}
`;

/** Full-bleed banner — beige edge to beige edge; transparent outside frame shows green. */
export const HeroBannerImg = styled.img`
	display: block;
	width: 100%;
	height: auto;
	aspect-ratio: 1024 / 419;
	object-fit: fill;
	object-position: center;
	pointer-events: none;
	user-select: none;

	[dir='rtl'] & {
		transform: scaleX(-1);
	}
`;

/**
 * Overlay matches banner zones:
 * - left ~60% white panel → all copy / book / CTA
 * - right foliage + bird → speech only (absolute near bird)
 */
export const HeroContent = styled.div`
	position: absolute;
	inset: 0;
	z-index: 1;
	box-sizing: border-box;
	/* Inset to sit inside the cream frame of the art */
	padding: 5.2% 4.5% 6% 5%;
	pointer-events: none;

	> * {
		pointer-events: auto;
	}

	@media (max-width: 900px) {
		padding: 16px 16px 18px;
	}
`;

export const HeroCopy = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	width: min(560px, 58%);
	max-width: 100%;
	min-width: 0;
	text-align: start;

	@media (max-width: 900px) {
		width: 100%;
	}
`;

export const HeroEyebrow = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: clamp(11px, 1.2vw, 13px);
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #442817;
`;

export const HeroTitle = styled.h1`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(24px, 3.2vw, 34px);
	line-height: 1.12;
	color: #442817;
`;

export const HeroSubtitle = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: clamp(13px, 1.5vw, 16px);
	line-height: 1.35;
	color: #5c4030;
`;

export const HeroBookRow = styled.div`
	display: flex;
	align-items: flex-start;
	gap: clamp(14px, 1.8vw, 20px);
	margin-top: calc(30px + clamp(28px, 4.2vw, 48px));
	width: 100%;

	@media (max-width: 560px) {
		flex-direction: column;
		align-items: stretch;
		margin-top: 50px;
	}
`;

export const HeroCover = styled.img`
	width: 112px;
	height: 140px;
	object-fit: cover;
	border-radius: 14px;
	box-shadow: 0 8px 14px rgba(68, 40, 23, 0.18);
	flex-shrink: 0;
	background: #fff;
`;

export const HeroCoverFallback = styled.div`
	width: 112px;
	height: 140px;
	border-radius: 14px;
	flex-shrink: 0;
	background: linear-gradient(160deg, #1ebba3, #00907a);
`;

export const HeroBookMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	flex: 1;
`;

export const HeroBookTitle = styled.h2`
	margin: 0;
	max-width: 100%;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(17px, 2.1vw, 22px);
	line-height: 1.2;
	color: #442817;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow-wrap: anywhere;
	word-break: break-word;
`;

export const HeroBookDescription = styled.p`
	margin: 0;
	max-width: 100%;
	font-family: ${theme.fonts.Nunito};
	font-size: clamp(13px, 1.4vw, 15px);
	line-height: 1.35;
	color: #6b4a2e;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow-wrap: anywhere;
	word-break: break-word;
`;

export const HeroProgressBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
	max-width: 320px;
	margin-top: 4px;
	padding-bottom: 4px;
	overflow: visible;
`;

export const HeroUnitsLabel = styled.p`
	margin: 0;
	align-self: flex-end;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1;
	color: ${theme.colours.LightSeaGreen};
`;

export const HeroProgressTrack = styled.div`
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: rgba(68, 40, 23, 0.12);
	overflow: hidden;
`;

export const HeroProgressFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
	border-radius: 999px;
	background: ${theme.colours.LightSeaGreen};
`;

/** Same CTA language as adventure cards: teal pill + 3D bottom edge. */
export const HeroContinueCta = styled(Link)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-top: 2px;
	margin-bottom: 4px;
	padding: 12px 16px;
	border: none;
	border-radius: 18px;
	background: ${theme.colours.LightSeaGreen};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(15px, 1.6vw, 17px);
	line-height: 1;
	text-decoration: none;
	text-transform: none;
	letter-spacing: 0;
	box-shadow: 0 4px 0 ${theme.colours.PaoloVeroneseGreen};

	&:hover {
		filter: brightness(1.04);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

/** Speech sits left of the bird (mid/lower right), facing the beak — matches Figma. */
export const HeroSpeech = styled.div`
	position: absolute;
	z-index: 3;
	top: auto;
	bottom: 27%;
	inset-inline-end: 15%;
	max-width: 128px;
	padding: 12px 14px;
	border-radius: 18px;
	background: ${theme.colours.white};
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: clamp(12px, 1.25vw, 14px);
	line-height: 1.25;
	color: #442817;
	text-align: center;
	white-space: pre-line;
	pointer-events: none;

	&::after {
		content: '';
		position: absolute;
		inset-inline-end: 18px;
		bottom: -7px;
		border-width: 8px 6px 0 6px;
		border-style: solid;
		border-color: ${theme.colours.white} transparent transparent transparent;
	}

	@media (max-width: 900px) {
		bottom: 30%;
		inset-inline-end: 12%;
		max-width: 120px;
		padding: 10px 12px;
	}

	@media (max-width: 560px) {
		display: none;
	}
`;

/* —— Adventure grid —— */

export const AdventureSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 18px;
`;

export const AdventureHeading = styled.h2`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(22px, 3vw, 28px);
	line-height: 1.2;
	color: #442817;
	text-align: start;

	img {
		width: 22px;
		height: 22px;
		object-fit: contain;
	}
`;

export const AdventureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18px;

	@media (max-width: 1100px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const AdventureCard = styled.article<{ $theme: MyBooksAdventureTheme }>`
	position: relative;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	gap: 12px;
	padding: 16px;
	padding-bottom: 20px;
	border-radius: 22px;
	background: ${({ $theme }) => THEME_BG[$theme]};
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
	box-sizing: border-box;
	min-width: 0;
	overflow: visible;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

export const AdventureCardTop = styled.div`
	display: contents;
`;

export const AdventureCover = styled.img`
	width: 72px;
	height: 90px;
	object-fit: cover;
	border-radius: 12px;
	flex-shrink: 0;
	background: #fff;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

export const AdventureCoverFallback = styled.div`
	width: 72px;
	height: 90px;
	border-radius: 12px;
	flex-shrink: 0;
	background: linear-gradient(160deg, #1ebba3, #00907a);
`;

export const AdventureMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	flex: 1;
	overflow: visible;
	text-align: start;
`;

export const AdventureTitle = styled.h3`
	margin: 0;
	max-width: 100%;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 16px;
	line-height: 1.25;
	color: #442817;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow-wrap: anywhere;
	word-break: break-word;
`;

export const AdventureDescription = styled.p`
	margin: 0;
	max-width: 100%;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	line-height: 1.35;
	color: #6b4a2e;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	overflow-wrap: anywhere;
	word-break: break-word;
`;

export const AdventureProgressBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
	margin-top: 4px;
	overflow: visible;
`;

export const AdventureUnits = styled.p`
	margin: 0;
	align-self: flex-end;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	color: ${theme.colours.LightSeaGreen};
`;

export const AdventureTrack = styled.div`
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: rgba(68, 40, 23, 0.1);
	overflow: hidden;
`;

export const AdventureFill = styled.div<{ $percent: number; $theme: MyBooksAdventureTheme }>`
	height: 100%;
	width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
	border-radius: 999px;
	background: ${({ $theme }) => THEME_BAR[$theme]};
`;

export const AdventureCta = styled(Link)<{ $theme: MyBooksAdventureTheme }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-top: 4px;
	margin-bottom: 2px;
	padding: 11px 14px;
	border: none;
	border-radius: 18px;
	background: ${({ $theme }) => THEME_ACCENT[$theme]};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 15px;
	line-height: 1;
	text-decoration: none;
	box-shadow: 0 4px 0
		${({ $theme }) =>
			$theme === 'teal'
				? theme.colours.PaoloVeroneseGreen
				: $theme === 'sand'
					? '#c8841f'
					: '#5b4ed0'};

	&:hover {
		filter: brightness(1.04);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;
