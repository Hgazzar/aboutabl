import { theme } from '../../global-styles';
import styled from 'styled-components';
import {
	STUDENT_SHELL_NAV_ACTIVE_COLOR,
	STUDENT_SHELL_SIDEBAR_ITEM_GAP,
	STUDENT_SHELL_SIDEBAR_ITEM_WIDTH,
	STUDENT_SHELL_SIDEBAR_PADDING_BOTTOM,
	STUDENT_SHELL_SIDEBAR_PADDING_TOP,
	STUDENT_SHELL_SIDEBAR_WIDTH,
} from 'config/studentShellLayout';

export const SideBarWrapper = styled.aside`
	transition: transform 0.35s ease, left 0.35s ease, right 0.35s ease;
	background-color: ${theme.colours.white};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
	z-index: 999;
	width: ${STUDENT_SHELL_SIDEBAR_WIDTH}px;
	flex-shrink: 0;
	border-radius: 20px;
	align-self: flex-start;

	&.open {
		position: absolute;
		top: 0;
		bottom: 0;
		height: auto;
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
		top: 0;
		bottom: 0;
		height: auto;
		left: -${STUDENT_SHELL_SIDEBAR_WIDTH + 8}px;
		border-top-left-radius: 20px;
		border-bottom-left-radius: 20px;

		&:lang(ar) {
			right: -${STUDENT_SHELL_SIDEBAR_WIDTH + 8}px;
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

export const SectionsWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	height: 100%;
	min-height: 100%;
	width: 100%;
`;

export const SideBarInfo = styled.div`
	.LogoWrapper {
		position: relative;
		display: flex;
		justify-content: flex-start;

		img {
			height: 36px;
			width: auto;
			object-fit: contain;
		}

		@media (max-width: 767px) {
			margin-top: 30px;
		}
	}
`;

export const SideBarLinks = styled.nav`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	padding: ${STUDENT_SHELL_SIDEBAR_PADDING_TOP}px 0 ${STUDENT_SHELL_SIDEBAR_PADDING_BOTTOM}px;
`;

export const NavItem = styled.div`
	width: ${STUDENT_SHELL_SIDEBAR_ITEM_WIDTH}px;

	&:not(:last-child) {
		margin-bottom: ${STUDENT_SHELL_SIDEBAR_ITEM_GAP}px;
	}

	a,
	span {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		text-decoration: none;
		border-radius: 12px;
		transition: transform 0.15s ease;
	}

	a:hover {
		transform: translateY(-1px);
	}

	a:focus-visible {
		outline: 2px solid ${STUDENT_SHELL_NAV_ACTIVE_COLOR};
		outline-offset: 4px;
	}

	.nav-icon {
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: 93px;
		object-fit: contain;
		object-position: center;
		image-rendering: auto;
		display: block;
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
