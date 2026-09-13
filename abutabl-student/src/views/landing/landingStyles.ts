import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';

const TEAL = theme.colours.PaoloVeroneseGreen;
const TEAL_BRIGHT = theme.colours.LightSeaGreen;

export const LandingRoot = styled.div`
	min-height: 100vh;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	font-family: ${theme.fonts.Nunito};
	background: ${TEAL};
	color: #442817;
	box-sizing: border-box;
`;

export const LandingNavShell = styled.header`
	position: relative;
	z-index: 5;
	width: 100%;
	flex-shrink: 0;
	padding: ${24}px ${24}px 0;
	box-sizing: border-box;

	@media (max-width: 640px) {
		padding: 16px 16px 0;
	}
`;

export const LandingNav = styled.nav`
	display: flex;
	align-items: center;
	gap: 16px;
	width: 100%;
	box-sizing: border-box;
	height: 81px;
	background-color: ${theme.colours.white};
	border: 2px solid ${theme.colours.LightSeaGreen};
	border-bottom-width: 5px;
	border-radius: 20px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
	padding: 0 24px;

	@media (max-width: 899px) {
		gap: 12px;
		height: auto;
		min-height: 58px;
		border-bottom-width: 2px;
		padding: 10px 16px;
		flex-wrap: wrap;
	}
`;

export const Brand = styled(Link)`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	text-decoration: none;
	min-width: 0;

	img {
		height: 36px;
		width: auto;
		object-fit: contain;
	}
`;

export const BrandMark = styled.img`
	height: 36px;
	width: auto;
	object-fit: contain;
`;

export const NavLinks = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 28px;
	flex: 1;
	min-width: 0;

	a {
		font-family: ${theme.fonts.ExtraBold};
		font-weight: 800;
		font-size: 13px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		text-decoration: none;
		color: #5c5148;
		white-space: nowrap;

		&:hover,
		&[data-active='true'] {
			color: ${TEAL_BRIGHT};
		}
	}

	@media (max-width: 720px) {
		width: 100%;
		order: 3;
		justify-content: center;
		gap: 16px;
		padding-top: 4px;
	}
`;

export const NavLogin = styled(Link)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	min-height: 40px;
	padding: 0 20px;
	border: none;
	border-radius: 12px;
	background: ${theme.colours.LightSeaGreen};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	text-decoration: none;
	box-shadow: 0 2px 8px rgba(30, 187, 163, 0.35);
	white-space: nowrap;

	&:hover {
		filter: brightness(1.05);
	}
`;

/** Matches student page heroes (assignments / todo): teal band + bird/spark + white card. */
export const HeroBand = styled.section`
	position: relative;
	max-width: 1180px;
	margin: 0 auto;
	padding: 12px 28px 0;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(260px, 48%);
	gap: 8px;
	align-items: start;
	box-sizing: border-box;
	overflow: visible;
	min-height: 308px;

	@media (max-width: 860px) {
		grid-template-columns: 1fr;
		min-height: 0;
		padding: 20px 20px 0;
		text-align: center;
	}
`;

export const HeroCopy = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
	max-width: 100%;
	padding-top: 8px;
	padding-bottom: 36px;
	text-align: start;
	color: ${theme.colours.white};

	@media (max-width: 860px) {
		align-items: center;
		text-align: center;
		padding-bottom: 16px;
	}
`;

/** Same treatment as assignment / progress heroes: Fredoka + 1px outline. */
export const HeroTitle = styled.h1`
	margin: 0;
	padding: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-style: normal;
	font-size: 72px;
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
		font-size: clamp(48px, 7vw, 72px);
	}

	@media (max-width: 860px) {
		font-size: clamp(40px, 11vw, 56px);
		text-align: center;
	}
`;

export const HeroTitleLine = styled.span`
	display: block;
	white-space: nowrap;

	@media (max-width: 480px) {
		white-space: normal;
	}
`;

export const HeroSubtitle = styled.p`
	margin: 0;
	max-width: 420px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
	text-align: start;

	@media (max-width: 860px) {
		text-align: center;
	}
`;

export const HeroSubtitleLine = styled.span`
	display: block;
`;

export const HeroCtaRow = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;
	margin-top: 8px;

	@media (max-width: 860px) {
		justify-content: center;
	}
`;

export const HeroPrimaryCta = styled(Link)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 48px;
	padding: 0 28px;
	border-radius: 14px;
	background: ${theme.colours.white};
	color: ${TEAL};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	text-decoration: none;
	box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);

	&:hover {
		filter: brightness(1.02);
	}
`;

export const InviteBadge = styled.img`
	width: 168px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
	filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
`;

export const HeroArt = styled.div`
	position: relative;
	z-index: 1;
	justify-self: end;
	width: min(560px, 108%);
	aspect-ratio: 530 / 420;
	margin-top: 0;
	margin-inline-end: -36px;
	margin-bottom: -72px;
	overflow: visible;
	pointer-events: none;

	@media (max-width: 860px) {
		justify-self: center;
		width: min(380px, 96%);
		margin-inline-end: 0;
		margin-bottom: -44px;
	}
`;

/** Keeps sunburst under the navbar; wide enough so left/right rays are not cropped. */
export const HeroSparkClip = styled.div`
	position: absolute;
	top: -8px;
	bottom: 0;
	left: -40%;
	right: -40%;
	overflow: hidden;
	pointer-events: none;
	z-index: 0;
`;

export const HeroSpark = styled.img`
	position: absolute;
	left: 50%;
	top: 46%;
	/* 138% of HeroArt ≈ 76.67% of this wider clip (180% of HeroArt) */
	width: 76.67%;
	max-width: none;
	height: auto;
	transform: translate(-50%, -50%);
	opacity: 0.55;
	object-fit: contain;
	z-index: 0;
`;

export const HeroBird = styled.img`
	position: relative;
	z-index: 1;
	display: block;
	width: 108%;
	height: 100%;
	margin-inline: -4%;
	object-fit: contain;
	object-position: center bottom;
`;

export const WhiteBoard = styled.section`
	position: relative;
	z-index: 2;
	margin: 0 24px;
	background: ${theme.colours.Lotion};
	border-radius: 32px 32px 0 0;
	padding: 56px 24px 0;
	box-sizing: border-box;
	overflow: visible;

	@media (max-width: 640px) {
		margin: 0 16px;
		padding: 40px 16px 0;
	}
`;

export const BoardInner = styled.div`
	max-width: 1100px;
	margin: 0 auto;
`;

export const SectionTitle = styled.h2`
	margin: 0 0 36px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(26px, 3.5vw, 34px);
	color: #2c241c;
	text-align: start;
`;

export const BooksGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 24px;
	margin-bottom: 96px;

	@media (max-width: 860px) {
		grid-template-columns: 1fr;
		max-width: 360px;
		margin-inline: auto;
	}
`;

/** CSS gradient cards + icons — shadow only, no white frame. */
export const BookCard = styled(Link)<{ $gradient: string }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 28px 22px 22px;
	border-radius: 28px;
	background: ${({ $gradient }) => $gradient};
	box-sizing: border-box;
	text-align: center;
	text-decoration: none;
	filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.14));
	transition: transform 0.15s ease, filter 0.15s ease;

	&:hover {
		transform: translateY(-2px);
		filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.18));
	}
`;

export const BookCardIcons = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14px;
	min-height: 88px;
	width: 100%;
`;

export const BookCardIcon = styled.img<{ $tall?: boolean; $rotateDeg?: number }>`
	width: auto;
	height: ${({ $tall }) => ($tall ? '80px' : '64px')};
	max-width: ${({ $tall }) => ($tall ? '92px' : '80px')};
	object-fit: contain;
	flex-shrink: 0;
	image-rendering: auto;
	transform: ${({ $rotateDeg }) =>
		$rotateDeg ? `rotate(${$rotateDeg}deg)` : 'none'};
`;

export const BookCardPlus = styled.span`
	font-family: ${theme.fonts.ExtraBold};
	font-size: 28px;
	line-height: 1;
	color: ${theme.colours.white};
	user-select: none;
`;

export const BookCardTitle = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 26px;
	color: ${theme.colours.white};
`;

export const BookCardCta = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-top: 4px;
	margin-bottom: 2px;
	padding: 12px 16px;
	border-radius: 999px;
	background: ${theme.colours.white};
	color: ${TEAL_BRIGHT};
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 15px;
	box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
`;


export const StepsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 32px;
	margin-bottom: 96px;
	align-items: start;

	@media (max-width: 860px) {
		grid-template-columns: 1fr;
		gap: 36px;
	}
`;

export const StepCard = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	text-align: center;
	padding: 0 8px;
`;

export const StepIconImg = styled.img`
	display: block;
	width: 66px;
	height: 66px;
	object-fit: contain;
	flex-shrink: 0;
`;

export const StepTitle = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.ExtraBold};
	font-weight: 800;
	font-size: 18px;
	color: #2c241c;
`;

export const StepText = styled.p`
	margin: 0;
	max-width: 260px;
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	font-weight: 600;
	line-height: 1.45;
	color: #5c5148;
`;

export const FounderSection = styled.section`
	margin-bottom: 96px;
`;

export const FounderHeadingRow = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px 18px;
	margin-bottom: 28px;
`;

export const FounderHeading = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.ExtraBold};
	font-weight: 800;
	font-size: clamp(26px, 3.5vw, 34px);
	color: #1a1a1a;
	line-height: 1.1;
`;

export const FounderBeesImg = styled.img`
	display: block;
	height: 72px;
	width: auto;
	max-width: min(380px, 70vw);
	object-fit: contain;
	flex-shrink: 0;
`;

export const FounderGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.75fr);
	gap: 36px;
	align-items: start;

	@media (max-width: 860px) {
		grid-template-columns: 1fr;
	}
`;

export const FounderCopy = styled.div`
	display: flex;
	flex-direction: column;
	gap: 22px;
	min-width: 0;
`;

export const FounderBio = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	font-weight: 600;
	line-height: 1.65;
	color: #2c241c;
`;

export const FounderQuoteBlock = styled.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 10px;
`;

export const FounderQuote = styled.blockquote`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	margin: 0;
	padding: 28px 24px 36px;
	min-height: 180px;
	box-sizing: border-box;
	border: 2px solid ${TEAL_BRIGHT};
	border-radius: 4px;
	background: transparent;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	font-weight: 600;
	line-height: 1.6;
	color: #2c241c;
`;

export const FounderQuoteMark = styled.img`
	display: block;
	width: 36px;
	height: 36px;
	object-fit: contain;
	flex-shrink: 0;
`;

export const FounderSign = styled.p`
	margin: 0;
	align-self: flex-end;
	font-family: ${theme.fonts.ExtraBold};
	font-weight: 800;
	font-size: 18px;
	color: #e67e22;
`;

export const FounderPhotoFrame = styled.div`
	width: min(300px, 100%);
	justify-self: end;
	line-height: 0;

	@media (max-width: 860px) {
		justify-self: center;
	}
`;

export const FounderPhotoImg = styled.img`
	display: block;
	width: 100%;
	height: auto;
	object-fit: contain;
`;

export const ContactSection = styled.section`
	background: transparent;
	border-radius: 0;
	padding: 8px 0 0;
	box-sizing: border-box;
	overflow: visible;
`;

export const ContactGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr);
	gap: 28px 40px;
	align-items: end;

	@media (max-width: 860px) {
		grid-template-columns: 1fr;
		gap: 28px;
		align-items: stretch;
	}
`;

export const ContactVisual = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	min-width: 0;
	overflow: visible;
	/* Keep illustration bottom flush with the white board / footer seam */
	align-self: stretch;
`;

export const ContactTitle = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.ExtraBold};
	font-weight: 800;
	font-size: clamp(32px, 4vw, 42px);
	color: #f5c518;
	line-height: 1.1;
`;

export const ContactHint = styled.p`
	margin: 0;
	max-width: 380px;
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	font-weight: 600;
	line-height: 1.5;
	color: #6b5c4f;
`;

/** Full composite (bird + bars + mound) — bottom edge on white/footer seam. */
export const ContactArt = styled.div`
	position: relative;
	width: min(520px, 118%);
	margin-top: auto;
	margin-inline-start: -12px;
	margin-bottom: 0;
	line-height: 0;
	overflow: hidden;
	pointer-events: none;

	@media (max-width: 860px) {
		width: min(420px, 100%);
		margin-inline: auto;
		margin-top: 8px;
	}
`;

export const ContactBars = styled.img<{ $pos: 'tr' | 'bl' }>`
	display: none;
`;

export const ContactBird = styled.img`
	position: relative;
	z-index: 1;
	display: block;
	width: 100%;
	max-width: none;
	height: auto;
	margin: 0;
	vertical-align: bottom;
	object-fit: contain;
	object-position: bottom center;
`;

export const ContactForm = styled.form`
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
	padding-bottom: 28px;

	@media (max-width: 860px) {
		padding-bottom: 24px;
	}
`;

export const ContactField = styled.input`
	width: 100%;
	min-height: 52px;
	padding: 14px 22px;
	border: 1px solid #e5e0da;
	border-radius: 999px;
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	font-weight: 600;
	box-sizing: border-box;
	background: ${theme.colours.white};
	color: #2c241c;
	box-shadow: 0 3px 0 rgba(0, 0, 0, 0.06);

	&::placeholder {
		color: #b0b0b0;
	}

	&:focus {
		outline: 2px solid ${TEAL_BRIGHT};
		outline-offset: 1px;
	}
`;

export const ContactArea = styled.textarea`
	width: 100%;
	min-height: 160px;
	padding: 18px 22px;
	border: 1px solid #e5e0da;
	border-radius: 28px;
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	font-weight: 600;
	resize: vertical;
	box-sizing: border-box;
	background: ${theme.colours.white};
	color: #2c241c;
	box-shadow: 0 3px 0 rgba(0, 0, 0, 0.06);

	&::placeholder {
		color: #b0b0b0;
	}

	&:focus {
		outline: 2px solid ${TEAL_BRIGHT};
		outline-offset: 1px;
	}
`;

export const ContactSubmit = styled.button`
	align-self: flex-end;
	min-height: 48px;
	padding: 12px 28px;
	border: none;
	border-radius: 16px;
	background: ${TEAL_BRIGHT};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.ExtraBold};
	font-size: 14px;
	font-weight: 800;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;
	box-shadow: 0 4px 0 ${TEAL};

	&:hover:not(:disabled) {
		filter: brightness(1.04);
	}

	&:disabled {
		opacity: 0.7;
		cursor: wait;
	}
`;

export const ContactError = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	font-weight: 700;
	color: #d64545;
`;

/** Success popup — mint top / white bottom (Figma Frame 427319634). */
export const SuccessOverlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 80;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	box-sizing: border-box;
	background: rgba(0, 0, 0, 0.45);
`;

export const SuccessModal = styled.div`
	position: relative;
	width: min(420px, 100%);
	border-radius: 28px;
	overflow: hidden;
	background: ${theme.colours.white};
	box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
`;

export const SuccessTop = styled.div`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	min-height: 200px;
	padding: 28px 24px 0;
	background: #b8ebe3;
	box-sizing: border-box;
`;

export const SuccessCloseIcon = styled.button`
	position: absolute;
	top: 14px;
	left: 14px;
	z-index: 2;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	padding: 0;
	border: none;
	border-radius: 999px;
	background: ${theme.colours.white};
	color: #9aa0a6;
	cursor: pointer;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

	svg {
		display: block;
		width: 14px;
		height: 14px;
	}

	&:hover {
		color: #5f6368;
	}
`;

export const SuccessBird = styled.img`
	width: min(260px, 72%);
	height: auto;
	display: block;
	margin-bottom: -28px;
	object-fit: contain;
	pointer-events: none;
`;

export const SuccessBody = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 40px 28px 28px;
	text-align: center;
	background: ${theme.colours.white};
`;

export const SuccessTitle = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-size: clamp(22px, 4vw, 28px);
	font-weight: 700;
	color: #111;
	letter-spacing: -0.02em;
`;

export const SuccessSubtitle = styled.p`
	margin: 0 0 8px;
	font-family: ${theme.fonts.Nunito};
	font-size: 16px;
	font-weight: 600;
	color: #222;
`;

export const SuccessCloseBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 148px;
	min-height: 48px;
	padding: 0 28px;
	border: none;
	border-radius: 14px;
	background: ${TEAL_BRIGHT};
	color: ${theme.colours.white};
	font-family: ${theme.fonts.ExtraBold};
	font-size: 14px;
	font-weight: 800;
	letter-spacing: 0.08em;
	line-height: 1;
	text-transform: uppercase;
	cursor: pointer;
	box-shadow: 0 4px 0 ${TEAL};

	&:hover {
		filter: brightness(1.04);
	}
`;
