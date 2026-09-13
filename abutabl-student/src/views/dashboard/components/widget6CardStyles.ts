import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import {
	STUDENT_WIDGET6_RECOMMENDED_WIDTH,
	STUDENT_WIDGET6_RECENT_WIDTH,
} from 'config/studentShellLayout';

/** Figma recommended cards (`1801:1588` …) — 360×126. */
export const WIDGET6_CARD_WIDTH = STUDENT_WIDGET6_RECOMMENDED_WIDTH;
export const WIDGET6_CARD_HEIGHT = 126;
/** Figma vertical gap between recommended cards (`1801:1588` stack). */
export const WIDGET6_CARD_GAP = 16;
export const WIDGET6_RECENT_ROW_HEIGHT = 70;
export const WIDGET6_RECENT_ROW_GAP = 16;

const cardWave = (waveColor: string) =>
	`url("data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 36' preserveAspectRatio='none'><path d='M0 22 C60 8 120 30 180 18 C240 6 300 28 360 14 L360 36 L0 36 Z' fill='${waveColor}'/></svg>`
	)}")`;

export const cardSurfaceStyles = {
	mint: css`
		background: linear-gradient(180deg, #e8f7f3 0%, #dff3ef 58%, #d4eee9 100%);

		&::after {
			background-image: ${cardWave('#b8e5dc')};
		}
	`,
	cream: css`
		background: linear-gradient(180deg, #fff9eb 0%, #fdf2d8 72%, #f8ebc8 100%);

		&::after {
			background-image: ${cardWave('#efd9a8')};
		}
	`,
	lavender: css`
		background: linear-gradient(180deg, #f3eefb 0%, #ebe3f8 72%, #e2d8f2 100%);

		&::after {
			background-image: ${cardWave('#d2c4ea')};
		}
	`,
};

const cardShell = css`
	position: relative;
	display: block;
	width: 100%;
	max-width: ${WIDGET6_CARD_WIDTH}px;
	min-height: ${WIDGET6_CARD_HEIGHT}px;
	border-radius: 20px;
	overflow: hidden;
	box-shadow: 0 2px 14px rgba(68, 40, 23, 0.08);
	text-decoration: none;
	color: inherit;
	box-sizing: border-box;

	&::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 36px;
		background-repeat: no-repeat;
		background-size: 100% 100%;
		pointer-events: none;
	}
`;

export const RecommendedCardLink = styled(Link)<{ $theme: 'mint' | 'cream' | 'lavender' }>`
	${cardShell};
	${({ $theme }) => cardSurfaceStyles[$theme]};
`;

export const RecentRow = styled.div<{ $theme: 'cream' | 'lavender' }>`
	${cardShell};
	min-height: ${WIDGET6_RECENT_ROW_HEIGHT}px;
	max-width: ${STUDENT_WIDGET6_RECENT_WIDTH}px;
	border-radius: 16px;
	${({ $theme }) => cardSurfaceStyles[$theme]};

	&::after {
		height: 22px;
	}
`;

export const CardContent = styled.div`
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: 108px minmax(0, 1fr);
	grid-template-rows: 1fr auto;
	align-items: end;
	min-height: ${WIDGET6_CARD_HEIGHT}px;
	padding: 12px 16px 14px 8px;
	box-sizing: border-box;
`;

export const RecentRowContent = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: ${WIDGET6_RECENT_ROW_HEIGHT}px;
	padding: 10px 14px 10px 10px;
	box-sizing: border-box;
`;

export const BirdLarge = styled.img`
	grid-row: 1 / span 2;
	grid-column: 1;
	width: 108px;
	height: 104px;
	object-fit: contain;
	object-position: left bottom;
	align-self: end;
`;

export const BirdSmall = styled.img`
	width: 44px;
	height: 44px;
	flex-shrink: 0;
	object-fit: contain;
`;

export const CardCopy = styled.div`
	grid-column: 2;
	grid-row: 1;
	align-self: center;
	padding-top: 4px;
	padding-inline-end: 56px;
`;

export const CardBodyText = styled.p<{ $accent?: 'teal' | 'purple' }>`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.35;
	color: #442817;

	strong {
		font-weight: 800;
		color: ${({ $accent }) => ($accent === 'purple' ? '#8e24aa' : '#23b8a2')};
	}
`;

export const CardXp = styled.span`
	position: absolute;
	top: 14px;
	inset-inline-end: 16px;
	z-index: 2;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1;
	color: #23b8a2;
`;

export const CardCtaWrap = styled.span`
	grid-column: 2;
	grid-row: 2;
	justify-self: end;
	margin-top: 6px;
`;

const ctaBase = css`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 34px;
	padding: 0 16px;
	border-radius: 999px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 12px;
	line-height: 1;
	letter-spacing: 0.02em;
	text-transform: none;
	color: ${theme.colours.white};
	white-space: nowrap;
`;

export const CtaMint = styled.span`
	${ctaBase};
	background: linear-gradient(180deg, #29c4ad 0%, #23b8a2 100%);
	box-shadow: 0 2px 0 #1a9a87;
`;

export const CtaGold = styled.span`
	${ctaBase};
	background: linear-gradient(180deg, #ffd054 0%, #eeae3e 100%);
	box-shadow: 0 2px 0 #c8841f;
`;

export const CtaPurple = styled.span`
	${ctaBase};
	background: linear-gradient(180deg, #ba68c8 0%, #8e24aa 100%);
	box-shadow: 0 2px 0 #6a1b9a;
`;

export const RecentHeader = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 14px;
`;

export const SectionHeading = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.35;
	color: #442817;
`;

export const ViewMoreLabel = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: #23b8a2;
`;

export const RecentTextBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	flex: 1;
	padding-inline-end: 52px;
`;

export const RecentBodyText = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.3;
	color: #442817;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	strong {
		font-weight: 800;
		color: #23b8a2;
	}
`;

export const RecentDateText = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.2;
	color: #937c61;
`;

export const RecentXp = styled.span`
	position: absolute;
	top: 12px;
	inset-inline-end: 14px;
	z-index: 2;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1;
	color: #23b8a2;
`;

export const RecommendedHeader = styled.div`
	margin-bottom: 14px;
`;

export const EmptyHint = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	line-height: 1.4;
	color: #937c61;
`;
