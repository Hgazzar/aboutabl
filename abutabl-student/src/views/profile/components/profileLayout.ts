import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';

export const ProfilePage = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
	padding: 8px 8px 24px;
	font-family: ${theme.fonts.Nunito};
`;

export const ProfileHeaderRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	padding: 4px 8px 0;
	min-height: 88px;
`;

export const HeaderCopy = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	min-width: 0;
`;

export const GoToDashboard = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.22);
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.04em;
	text-decoration: none;
	text-transform: uppercase;
`;

export const ProfileTitle = styled.h1`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(32px, 4vw, 42px);
	line-height: 1.1;
	color: ${theme.colours.white};
`;

export const HeaderBird = styled.img`
	width: min(280px, 46vw);
	height: auto;
	object-fit: contain;
	align-self: flex-end;
	margin-bottom: -56px;
	z-index: 2;
	pointer-events: none;

	@media (max-width: 767px) {
		width: 170px;
		margin-bottom: -36px;
	}
`;

export const ProfileShell = styled.section`
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
	min-height: 640px;
	background: ${theme.colours.white};
	border-radius: 24px;
	box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
	overflow: hidden;

	@media (max-width: 899px) {
		grid-template-columns: 1fr;
	}
`;

export const ProfileMain = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 28px;
	padding: 28px 32px 36px;
	background: ${theme.colours.white};
	border-left: 1px solid #f0ece6;

	&:lang(ar) {
		border-left: none;
		border-right: 1px solid #f0ece6;
	}

	@media (max-width: 899px) {
		padding: 20px 16px 28px;
		border-left: none;
		border-right: none;
		border-top: 1px solid #f0ece6;
	}
`;

export const ProfileError = styled.div`
	margin: 0 0 16px;
	padding: 10px 14px;
	border-radius: 12px;
	background: #fff4f4;
	color: #8b2e2e;
	font-size: 14px;
`;

export const EmptyState = styled.p`
	margin: 0;
	padding: 8px 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	line-height: 1.5;
	color: ${theme.colours['Grey-body']};
`;

/** Figma progress pocket: tight gray drop-shadow L/R/bottom, none on top. */
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
