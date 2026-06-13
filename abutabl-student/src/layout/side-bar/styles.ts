import { theme } from '../../global-styles';
import styled from 'styled-components';

export const SideBarWrapper = styled.aside`
	// padding: calc(${theme.space_size} * 4) calc(${theme.space_size});
	transition: all 0.5s;
	background-color: ${theme.colours.white};
	box-shadow: 0px 1px 10px 0px #00000014;
	z-index: 999;
	&.open {
		position: absolute;
		height: 100%;
		left: 0;
		@media (min-width: 768px) {
			position: relative;
			left: 0;
			height: auto;
		}
		&:lang(ar) {
			right: 0;
			left: unset;
		}
	}
	&.close {
		position: absolute;
		height: 100%;
		left: -120px;
		border-top-left-radius: 12px;
		&:lang(ar) {
			right: -160px;
			left: unset;
		}
		@media (min-width: 768px) {
			position: relative;
			left: 0;
			height: auto;
			&:lang(ar) {
				right: 0;
				left: unset;
			}
		}
	}
	@media print {
		display: none;
	}
`;
export const SectionsWrapper = styled.aside`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	left: 0;
	height: calc(100dvh - 100px);
	position: sticky;
	top: 40px;
`;

export const SideBarInfo = styled.div`
	.LogoWrapper {
		position: relative;
		display: flex;
		justify-content: flex-start;
		@media (max-width: 767px) {
			margin-top: 30px;
		}
	}
`;

export const SideBarLinks = styled.div`
	padding: calc(${theme.space_size} * 5) 0;
	.line {
		border-bottom: 1px solid ${theme.colours.Cultured};
		padding-bottom: 24px;
	}
`;
export const NavItem = styled.div<{ activeLink: boolean }>`
	margin-bottom: calc(${theme.space_size} * 5);
	.count {
		font-family: ${theme.fonts.Medium};
		background-color: ${theme.colours.AntiFlashWhite};
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		position: relative;
		margin-inline-end: 10px;
		&::before {
			position: absolute;
			content: '';
			width: 5px;
			height: 5px;
			background-color: ${theme.colours.PermanentGeraniumLake};
			border-radius: 50%;
			left: 15px;
			z-index: 9;
			top: 0;
		}
	}
	a {
		gap: calc(${theme.space_size});
		padding-inline: calc(${theme.space_size} * 2);
		text-decoration: none;
		display: flex;
		align-items: center;
		flex-direction: column;
		svg {
			color: ${(props) => (props.activeLink ? theme.colours.LightSeaGreen : theme.colours.SpanishGray)};
			path {
				stroke: ${(props) => (props.activeLink ? theme.colours.LightSeaGreen : theme.colours.SpanishGray)};
			}
		}
		div {
			width: ${(props) => (props.activeLink ? '48px' : 'auto')};
			height: ${(props) => (props.activeLink ? '48px' : 'auto')};
			border: ${(props) => (props.activeLink ? `1px solid ${theme.colours.Keppel}` : 'none')};
			border-radius: ${(props) => (props.activeLink ? '16px' : 'none')};
			background-color: ${(props) => (props.activeLink ? '#35C2AC1A' : 'transparent')};
			box-shadow: ${(props) => (props.activeLink ? `0px 4px 0px 0px ${theme.colours.Keppel}` : 'none')};
			-webkit-box-shadow: ${(props) => (props.activeLink ? `0px 4px 0px 0px ${theme.colours.Keppel}` : 'none')};
			-moz-box-shadow: ${(props) => (props.activeLink ? `0px 4px 0px 0px ${theme.colours.Keppel}` : 'none')};
			display: flex;
			align-items: center;
			justify-content: center;
		}
		p {
			font-size: 14px;
			color: ${(props) => (props.activeLink ? theme.colours.LightSeaGreen : theme.colours.SpanishGray)};
			font-weight: 400;
			white-space: nowrap;
		}
	}
`;

export const SideBarHelpersActionWrapper = styled.div`
	padding: 0 10px;
	.langWrapper {
		div {
			cursor: pointer;
			display: flex;
			justify-content: flex-start;
			align-items: center;
			flex-direction: column;
			gap: ${theme.space_size};
			p {
				font-size: 14px;
				color: ${theme.colours.SpanishGray};
				font-weight: 400;
				white-space: nowrap;
			}
		}
	}
`;
