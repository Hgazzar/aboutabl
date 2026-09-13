import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import { theme } from 'global-styles';
import {
	STUDENT_SHELL_ASIDE_WIDTH,
	STUDENT_SHELL_GAP,
	STUDENT_SHELL_MAIN_COLUMN_WIDTH,
	STUDENT_SHELL_SIDEBAR_WIDTH,
} from 'config/studentShellLayout';

export const LayoutWrapper = styled.div`
	display: flex;
	flex-direction: column;
	direction: rtl;
	min-height: 100dvh;
	gap: ${STUDENT_SHELL_GAP}px;
	padding: ${STUDENT_SHELL_GAP}px;
	transition: all 0.5s;
	background-color: ${theme.colours.PaoloVeroneseGreen};

	&:lang(en) {
		direction: ltr;
	}

	@media (max-width: 767px) {
		gap: 16px;
		padding: 16px;
	}
`;export const SecondLayoutWrapper = styled.div`
	transition: all 0.5s;
	main {
		height: 100dvh;
		overflow-y: scroll;
		&::-webkit-scrollbar {
			width: 5px;
		}
		&::-webkit-scrollbar-thumb {
			background-color: #004d34;
		}
		&::-webkit-scrollbar-thumb:hover {
			background-color: #1ebba3;
		}
	}
`;
/** Row below navbar: sidebar + main content (Figma shell). */
export const LayoutBody = styled.div<{ $dashboard?: boolean }>`
	flex: 1;
	min-height: 0;
	width: 100%;
	position: relative;

	${({ $dashboard }) =>
		$dashboard
			? `
		display: grid;
		grid-template-columns: ${STUDENT_SHELL_SIDEBAR_WIDTH}px minmax(0, 1fr);
		gap: ${STUDENT_SHELL_GAP}px;
		align-items: start;

		@media (max-width: 991px) {
			grid-template-columns: 1fr;
		}
	`
			: `
		display: flex;
		gap: ${STUDENT_SHELL_GAP}px;
		align-items: stretch;

		@media (max-width: 767px) {
			gap: 16px;
		}
	`}
`;

export const LayoutContainer = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
	width: 100%;
	gap: ${STUDENT_SHELL_GAP}px;
	transition: all 0.5s;
	background-color: transparent;
	padding: 0;

	@media (max-width: 767px) {
		gap: 16px;
	}
`;

/** Scrollable content region below navbar — same width as NavBar, Figma cream panel. */
export const ShellMain = styled.main`
	flex: 1;
	min-height: 0;
	width: 100%;
	overflow: auto;
	background: ${theme.colours.Lotion};
	border-radius: 20px;

	& > * {
		width: 100%;
		min-height: 100%;
		margin: 0;
	}

	&::-webkit-scrollbar {
		width: 5px;
	}
	&::-webkit-scrollbar-thumb {
		background-color: #004d34;
	}
	&::-webkit-scrollbar-thumb:hover {
		background-color: #1ebba3;
	}
`;

export const ToastContainerWrapper = styled(ToastContainer)`
	position: unset;
`;
