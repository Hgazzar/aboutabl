import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';

/** Figma frame: outer cream `#F8EFD8` + inset parchment texture. */
export const PARCHMENT_GROUND = '#F8EFD8';
export const PARCHMENT_TEXTURE = figmaDashboardAssetUrl('parchment-card.png');

export const PARCHMENT_OUTER_RADIUS = 20;
export const PARCHMENT_INNER_RADIUS = 16;
export const PARCHMENT_OUTER_PADDING = 20;

/** Outer cream rectangle with rounded corners (bannerFrame / assCards wrapper). */
export const ParchmentOuter = styled.section`
	width: 100%;
	padding: ${PARCHMENT_OUTER_PADDING}px;
	border-radius: ${PARCHMENT_OUTER_RADIUS}px;
	background-color: ${PARCHMENT_GROUND};
	box-sizing: border-box;
`;

/** Inset parchment area — texture fills this box only, smaller than outer frame. */
export const ParchmentInner = styled.div<{ $minHeight?: number }>`
	position: relative;
	width: 100%;
	min-height: ${({ $minHeight = 178 }) => $minHeight}px;
	border-radius: ${PARCHMENT_INNER_RADIUS}px;
	overflow: hidden;
	box-sizing: border-box;
`;

export const ParchmentTextureImg = styled.img`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: fill;
	opacity: 0.5;
	pointer-events: none;
	user-select: none;
	z-index: 0;
`;

export const ParchmentMountContent = styled.div`
	position: relative;
	z-index: 1;
	box-sizing: border-box;
	height: 100%;
	min-height: inherit;
`;
