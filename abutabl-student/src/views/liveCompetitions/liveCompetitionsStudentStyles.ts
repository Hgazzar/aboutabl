import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import {
	STUDENT_SHELL_ASIDE_WIDTH,
	STUDENT_SHELL_GAP,
	STUDENT_SHELL_MAIN_COLUMN_WIDTH,
} from 'config/studentShellLayout';
import { DashboardAside } from 'views/dashboard/styles';

export const LiveGamesPageGrid = styled.div`
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

export const LiveGamesMainColumn = styled.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: hidden;
	background: ${theme.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
`;

export const LiveGamesHero = styled.header`
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

export const LiveGamesHeroCopy = styled.div`
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

export const LiveGamesHeroTitle = styled.h1`
	margin: 0;
	padding: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
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

export const LiveGamesHeroTitleLine = styled.span`
	display: block;
	white-space: nowrap;
`;

export const LiveGamesHeroSubtitle = styled.p`
	margin: 20px 0 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
`;

export const LiveGamesHeroPageLabel = styled.p`
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

export const LiveGamesHeroArtWrap = styled.div`
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

export const LiveGamesHeroSpark = styled.img`
	position: absolute;
	left: 50%;
	top: 42%;
	width: 118%;
	max-width: none;
	transform: translate(-50%, -50%);
	opacity: 0.95;
	pointer-events: none;
`;

export const LiveGamesHeroBird = styled.img`
	position: relative;
	z-index: 1;
	width: 100%;
	height: 100%;
	display: block;
	object-fit: contain;
	object-position: center bottom;
`;

export const LiveGamesBoardCard = styled.section`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin: 0 20px 20px;
	padding: 20px 24px 24px;
	border-radius: 20px;
	background: ${theme.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;

	@media (max-width: 640px) {
		margin: 0 12px 12px;
		padding: 16px;
	}
`;

export const LiveGamesBackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	align-self: flex-start;
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

export const LiveGamesPanelCard = styled.div`
	padding: 20px 22px;
	border-radius: 16px;
	background: #e7f7f2;
	border: none;
	box-sizing: border-box;
`;

export const SessionStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

export const SessionTitle = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.25;
	color: #442817;
`;

export const SessionSubtitle = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.45;
	color: #937c61;
`;

export const SessionChipRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
`;

export const SessionMetaRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px 14px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: #937c61;
`;

export const SessionHudRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
`;

export const SessionHudChip = styled.span<{ $tone?: 'default' | 'warn' | 'ok' }>`
	display: inline-flex;
	align-items: center;
	padding: 6px 12px;
	border-radius: 999px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1;
	background: ${({ $tone }) =>
		$tone === 'warn'
			? 'rgba(249, 115, 22, 0.16)'
			: $tone === 'ok'
				? 'rgba(30, 187, 163, 0.18)'
				: 'rgba(0, 144, 122, 0.12)'};
	color: ${({ $tone }) =>
		$tone === 'warn' ? '#c2410c' : $tone === 'ok' ? '#0f766e' : '#0b7a68'};
`;

export const SessionStatGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 10px;
`;

export const SessionStatCard = styled.div`
	padding: 12px 14px;
	border-radius: 14px;
	background: ${theme.colours.white};
	box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
	box-sizing: border-box;
	min-width: 0;
	overflow: visible;
`;

export const SessionStatLabel = styled.div`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.3;
	color: #937c61;
`;

export const SessionStatValue = styled.div`
	margin-top: 4px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(15px, 2.4vw, 20px);
	line-height: 1.3;
	color: #442817;
	overflow-wrap: anywhere;
	word-break: break-word;
`;

export const SessionWaitingCard = styled.div`
	padding: 28px 22px;
	border-radius: 16px;
	background: #e7f7f2;
	text-align: center;
	box-sizing: border-box;
`;

/** Waiting copy under the lobby session table row (left-aligned, not a second card). */
export const SessionLobbyWaiting = styled.div`
	margin-top: 10px;
	padding-top: 12px;
	border-top: 1px solid rgba(68, 40, 23, 0.1);
	text-align: start;
`;

export const SessionLobbyWaitingTitle = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 16px;
	line-height: 1.3;
	color: #442817;
`;

/** Invitation list — same row language as dashboard My Assignments. */
export const InviteList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

export const InviteRow = styled.li`
	display: flex;
	align-items: center;
	gap: 14px;
	min-height: 72px;
	padding: 14px 16px;
	border-radius: 16px;
	background: #e7f7f2;
	box-sizing: border-box;

	@media (max-width: 640px) {
		flex-wrap: wrap;
	}
`;

export const InviteStripe = styled.span<{
	$tone: 'join' | 'continue' | 'results' | 'view';
}>`
	flex-shrink: 0;
	width: 8px;
	align-self: stretch;
	min-height: 40px;
	border-radius: 999px;
	/* Matches button actions: Join/Enter · Continue · View results · View */
	background: ${({ $tone }) =>
		$tone === 'join'
			? '#1ebba3'
			: $tone === 'continue'
				? '#f59e0b'
				: $tone === 'results'
					? '#039be5'
					: '#9ca3af'};
`;

export const InviteCopy = styled.div`
	flex: 1 1 auto;
	min-width: 0;
`;

export const InviteTitle = styled.strong`
	display: block;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	color: #442817;
`;

export const InviteMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px 10px;
	margin-top: 4px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: #937c61;
`;

export const InviteChip = styled.span<{ $tone?: 'default' | 'ok' | 'muted' }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	background: ${({ $tone }) =>
		$tone === 'ok'
			? 'rgba(30, 187, 163, 0.18)'
			: $tone === 'muted'
				? '#efe8df'
				: 'rgba(0, 144, 122, 0.14)'};
	color: ${({ $tone }) =>
		$tone === 'ok' ? '#0f766e' : $tone === 'muted' ? '#7a6a58' : '#0b7a68'};
`;

export const InviteHint = styled.p`
	margin: 6px 0 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	line-height: 1.35;
	color: #a07855;
`;

export const InviteActionButton = styled.button`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 118px;
	height: 36px;
	padding: 0 22px;
	border: none;
	border-radius: 999px;
	background: linear-gradient(90deg, #2dd4bf 0%, #00907a 100%);
	box-shadow: 0 2px 0 rgba(0, 144, 122, 0.35);
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: ${theme.colours.white};
	cursor: pointer;
	transition: filter 0.15s ease;

	&:hover:not(:disabled) {
		filter: brightness(1.03);
	}

	&:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

export const InviteActionLink = styled(Link)`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 118px;
	height: 36px;
	padding: 0 22px;
	border-radius: 999px;
	background: linear-gradient(90deg, #2dd4bf 0%, #00907a 100%);
	box-shadow: 0 2px 0 rgba(0, 144, 122, 0.35);
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: ${theme.colours.white};
	transition: filter 0.15s ease;

	&:hover {
		filter: brightness(1.03);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

export const SessionCtaFull = styled(InviteActionButton)`
	width: 100%;
	min-width: 0;
	height: 44px;
`;

export const SessionCtaLinkFull = styled(InviteActionLink)`
	width: 100%;
	min-width: 0;
	height: 44px;
	box-sizing: border-box;
`;

export const InviteEmptyCard = styled.div`
	padding: 28px 20px;
	border-radius: 16px;
	background: #e7f7f2;
	text-align: center;
	box-sizing: border-box;
`;

export const InviteEmptyTitle = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	color: #442817;
`;

export const InviteEmptyBody = styled.p`
	margin: 10px 0 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	line-height: 1.45;
	color: #937c61;
`;

export { DashboardAside };
