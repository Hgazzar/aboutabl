import styled from 'styled-components';
import { theme } from 'global-styles';
import bgAvatar from 'assets/images/figma/avatar-onboarding/bg-avatar.png';

const TEAL = '#1EBBA3';

export const OnboardingRoot = styled.div`
	position: fixed;
	inset: 0;
	z-index: 20;
	width: 100%;
	min-height: 100dvh;
	box-sizing: border-box;
	overflow-x: hidden;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px 24px 40px;
	/* Single bg image — no tile; white shows behind/around it */
	background-color: #ffffff;
	background-image: url(${bgAvatar});
	background-repeat: no-repeat;
	background-position: center center;
	background-size: cover;
	font-family: ${theme.fonts.Nunito};
`;

export const PageShell = styled.div`
	position: relative;
	width: 100%;
	max-width: 1040px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 22px;
	padding-top: 8px;
`;

/** Logo stays pinned top-left of the page shell (Figma). */
export const LogoSlot = styled.div`
	position: absolute;
	top: 0;
	inset-inline-start: 0;
	z-index: 2;
`;

export const HeaderGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(150px, 200px) 1fr minmax(150px, 200px);
	align-items: start;
	width: 100%;
	gap: 12px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
		justify-items: center;
	}
`;

export const HeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 14px;
	justify-self: start;

	@media (max-width: 720px) {
		align-items: center;
		justify-self: center;
	}
`;

export const HeaderCenter = styled.div`
	display: flex;
	justify-content: center;
	align-items: flex-start;
	padding-top: 4px;
`;

export const BrandMark = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 10px 18px;
	border-radius: 16px;
	/* Figma logo pill — light mint cyan from Choose Avatar */
	background: #e0feff;
	box-shadow: 0 4px 12px rgba(0, 144, 122, 0.12);

	img {
		height: 40px;
		width: auto;
		object-fit: contain;
		display: block;
	}
`;

export const TitleBlock = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	text-align: center;
`;

export const HeroTitle = styled.h1`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-size: clamp(32px, 4.6vw, 48px);
	font-weight: 700;
	letter-spacing: 0.04em;
	line-height: 1;
	color: #3b82f6;
	text-transform: uppercase;
	text-shadow: none;
	-webkit-text-stroke: 2px #0a0a0a;
	paint-order: stroke fill;
`;

export const HeroAccent = styled.span`
	color: ${theme.colours.LightSeaGreen};
	text-shadow: none;
	-webkit-text-stroke: 2px #0a0a0a;
	paint-order: stroke fill;
`;

export const GhostBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 38px;
	padding: 0 16px;
	border-radius: 12px;
	border: 1.5px solid ${TEAL};
	background: ${theme.colours.white};
	color: ${TEAL};
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	font-weight: 800;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;
	box-shadow: 0 6px 14px rgba(30, 187, 163, 0.45);

	&:hover {
		background: ${TEAL};
		color: #ffffff;
		box-shadow: 0 6px 14px rgba(30, 187, 163, 0.45);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
`;

/** Figma Choose Avatar: outline teal home under logo. */
export const HomeBtn = styled(GhostBtn)``;

/** Select — Figma: ~40–45% of card width, ~40% of card height, soft mint glow. */
export const SelectBtn = styled.button`
	flex: 1 1 0;
	align-self: center;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	min-width: 0;
	width: 100%;
	max-width: 48%;
	height: 52px;
	padding: 0 22px;
	border-radius: 14px;
	border: 1.5px solid ${TEAL};
	background: #ffffff;
	color: ${TEAL};
	font-family: ${theme.fonts.Nunito};
	font-size: 17px;
	font-weight: 800;
	line-height: 1;
	white-space: nowrap;
	cursor: pointer;
	box-shadow: 0 6px 10px rgba(183, 230, 222, 0.95), 0 2px 4px rgba(30, 187, 163, 0.18);
	transition: background-color 0.15s ease, color 0.15s ease;

	&:hover {
		background: ${TEAL};
		color: #ffffff;
		box-shadow: 0 6px 10px rgba(183, 230, 222, 0.95), 0 2px 4px rgba(30, 187, 163, 0.18);
	}

	&:active {
		transform: translateY(1px);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 900px) {
		height: 46px;
		max-width: 50%;
		padding: 0 16px;
		font-size: 15px;
	}
`;

export const Panel = styled.div`
	width: 100%;
	max-width: 1040px;
	box-sizing: border-box;
	margin: 6px auto 0;
	padding: 28px;
	border-radius: 40px;
	background: #ffffff;
	box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);

	@media (max-width: 767px) {
		padding: 16px;
		border-radius: 28px;
	}
`;

export const AvatarGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14px 14px;

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
		gap: 12px;
	}
`;

/**
 * White card: natural avatar PNG + Select taking ~40–45% width (Figma).
 */
export const AvatarCard = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	gap: 14px;
	box-sizing: border-box;
	width: 100%;
	padding: 12px 14px;
	border-radius: 18px;
	background: #ffffff;
	box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
	border: 1px solid rgba(0, 0, 0, 0.06);
`;

/** Preset PNG as-is — no extra white square wrapper. */
export const AvatarFace = styled.img`
	display: block;
	flex: 0 0 auto;
	width: min(132px, 48%);
	height: auto;
	border-radius: 0;
	object-fit: contain;
	object-position: center;
	image-rendering: auto;
	filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.22));
`;

export const SuccessWrap = styled.div`
	width: 100%;
	max-width: 560px;
	margin: 148px auto 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 22px;
	padding-inline: 8px;
	box-sizing: border-box;
`;

/** Keeps the preview card page-centered; Change Avatar hangs to its left, top-aligned. */
export const PreviewStage = styled.div`
	position: relative;
	width: min(320px, 70vw);
	margin: 0 auto;
`;

export const ChangeBeside = styled.div`
	position: absolute;
	top: 0;
	/* Sit just outside the card on the inline-start side (left in LTR). */
	inset-inline-end: calc(100% + 12px);
	z-index: 1;
	white-space: nowrap;

	@media (max-width: 640px) {
		position: static;
		inset-inline-end: auto;
		margin-bottom: 12px;
		width: 100%;
		display: flex;
		justify-content: flex-start;
	}
`;

export const PreviewCard = styled.div`
	width: 100%;
	aspect-ratio: 1;
	display: grid;
	place-items: center;
	padding: 22px;
	border-radius: 36px;
	background: #ffffff;
	box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
	box-sizing: border-box;
	overflow: hidden;
`;

export const PreviewFace = styled.img`
	display: block;
	width: 100%;
	height: 100%;
	margin: 0 auto;
	border-radius: 22px;
	object-fit: contain;
	object-position: center center;
	image-rendering: auto;
`;

export const GreatChoice = styled.p`
	margin: 2px 0 0;
	font-family: ${theme.fonts.Fredoka};
	font-size: clamp(30px, 5vw, 44px);
	font-weight: 700;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: ${TEAL};
	-webkit-text-stroke: 3px #ffffff;
	paint-order: stroke fill;
	text-shadow: 0 3px 0 #0f766e;
	text-align: center;
`;

/** Same corner curve as Change Avatar (`GhostBtn` = 12px). */
export const StartBtn = styled(GhostBtn)`
	min-width: 220px;
	min-height: 48px;
	font-size: 14px;
	margin-top: 2px;
`;
export const ErrorText = styled.p`
	margin: 14px 0 0;
	color: #b91c1c;
	font-size: 14px;
	font-weight: 700;
	text-align: center;
`;
