import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';

export const NavBarRoot = styled.header`
	width: 100%;
	flex-shrink: 0;
`;

export const NavBarInner = styled.div`
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
		height: 58px;
		border-bottom-width: 2px;
		padding: 0 16px;
	}
`;

export const NavBarStart = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex-shrink: 0;
	min-width: 0;
`;

export const BrandLink = styled(Link)`
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

export const MobileMenuButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border: none;
	border-radius: 12px;
	background-color: ${theme.colours.AntiFlashWhite};
	cursor: pointer;
	flex-shrink: 0;

	@media (min-width: 768px) {
		display: none;
	}
`;

export const SearchWrap = styled.div`
	position: relative;
	flex: 0 1 360px;
	width: 100%;
	max-width: 360px;
	min-width: 180px;
	display: none;
	padding-bottom: 0;

	@media (min-width: 768px) {
		display: block;
	}

	@media (min-width: 1200px) {
		flex-basis: 380px;
		max-width: 380px;
	}
`;

export const SearchShell = styled.div`
	position: relative;
	width: 100%;
	border-radius: 12px;
	background: ${theme.colours.AntiFlashWhite};
	box-shadow: 0 5px 0 ${theme.colours.LightSeaGreen};
	overflow: hidden;
`;

export const SearchIconWrap = styled.span`
	position: absolute;
	left: 16px;
	top: 50%;
	transform: translateY(-50%);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	pointer-events: none;

	svg {
		width: 16px;
		height: 16px;
		display: block;
	}

	svg path {
		fill: ${theme.colours['Spanish Gray']};
	}
`;

export const SearchField = styled.input`
	width: 100%;
	height: 40px;
	border: none;
	border-radius: 12px;
	background: transparent;
	padding: 0 16px 0 44px;
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	color: ${theme.colours.black_2};
	outline: none;

	&::placeholder {
		color: ${theme.colours['Spanish Gray']};
	}
`;

export const SearchResults = styled.div`
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	right: 0;
	z-index: 30;
	background: ${theme.colours.white};
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	padding: 8px;
	max-height: 280px;
	overflow-y: auto;

	p {
		margin: 8px 12px;
		font-family: ${theme.fonts.Nunito};
		font-size: 14px;
		color: ${theme.colours['Grey-body']};
	}

	button {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 100%;
		border: none;
		background: transparent;
		padding: 10px 12px;
		border-radius: 8px;
		cursor: pointer;
		text-align: start;

		&:hover {
			background: ${theme.colours.AntiFlashWhite};
		}

		strong {
			font-family: ${theme.fonts.Fredoka};
			font-size: 14px;
			color: ${theme.colours.black_2};
		}

		span {
			font-family: ${theme.fonts.Nunito};
			font-size: 12px;
			color: ${theme.colours['Grey-body']};
			text-transform: capitalize;
		}
	}
`;

export const ActionsCluster = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 14px;
	flex-shrink: 0;
	margin-left: auto;
`;

export const XpCounter = styled.div`
	display: none;
	align-items: center;
	gap: 5px;
	margin-inline-end: 2px;

	@media (min-width: 768px) {
		display: flex;
	}

	img {
		width: 28px;
		height: 28px;
		object-fit: contain;
		flex-shrink: 0;
	}

	strong {
		font-family: ${theme.fonts.Fredoka};
		font-size: 16px;
		font-weight: 600;
		color: ${theme.colours.Marigold};
		line-height: 1;
		white-space: nowrap;
		transform: translateY(-3px);
	}
`;

export const AvatarWrap = styled.button`
	position: relative;
	width: 42px;
	height: 42px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	padding: 0;
	background: transparent;
	cursor: pointer;
	border-radius: 50%;
	transition: transform 0.15s ease;

	&:hover {
		transform: scale(1.04);
	}

	&:focus-visible {
		outline: none;

		.avatar {
			box-shadow: 0 0 0 2px ${theme.colours.white}, 0 0 0 4px ${theme.colours.LightSeaGreen};
		}
	}

	.ring {
		display: none;
	}

	.avatar {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		object-fit: cover;
		pointer-events: none;
		border: 2px solid ${theme.colours.LightSeaGreen};
		box-sizing: border-box;
		background: ${theme.colours.AntiFlashWhite};
	}
`;

export const LogoutButton = styled.button`
	display: none;
	align-items: center;
	justify-content: center;
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
	cursor: pointer;
	box-shadow: 0 2px 8px rgba(30, 187, 163, 0.35);
	white-space: nowrap;

	@media (min-width: 768px) {
		display: inline-flex;
	}
`;

export const BellButton = styled.button`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border: none;
	background: transparent;
	cursor: pointer;
	padding: 0;
	flex-shrink: 0;

	.bell-icon {
		width: 28px;
		height: 28px;
		object-fit: contain;
		display: block;
	}
`;

export const NotificationBadge = styled.span`
	position: absolute;
	top: 2px;
	inset-inline-end: 0;
	min-width: 18px;
	height: 18px;
	padding: 0 5px;
	border-radius: 999px;
	background: #ba0c12;
	color: ${theme.colours.white};
	font-family: ${theme.fonts.Nunito};
	font-size: 10px;
	font-weight: 800;
	line-height: 18px;
	text-align: center;
	box-shadow: 0 0 0 2px ${theme.colours.white};
	pointer-events: none;
`;
