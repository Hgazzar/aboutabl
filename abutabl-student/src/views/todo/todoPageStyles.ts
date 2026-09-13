import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from 'global-styles';
import {
	STUDENT_SHELL_ASIDE_WIDTH,
	STUDENT_SHELL_GAP,
	STUDENT_SHELL_MAIN_COLUMN_WIDTH,
} from 'config/studentShellLayout';
import { DashboardAside } from 'views/dashboard/styles';

export const TodoPageGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(${STUDENT_SHELL_MAIN_COLUMN_WIDTH}px, 1fr) ${STUDENT_SHELL_ASIDE_WIDTH}px;
	gap: ${STUDENT_SHELL_GAP}px;
	min-width: 0;
	width: 100%;
	font-family: ${theme.fonts.Nunito};
	box-sizing: border-box;

	@media (max-width: 991px) {
		grid-template-columns: 1fr;
	}
`;

export const TodoMainColumn = styled.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: hidden;
	background: ${theme.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
`;

export const TodoAssignmentsShell = styled.section`
	position: relative;
	z-index: 2;
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

export const TodoBackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 16px;
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

export const TodoFooter = styled.footer`
	padding: 8px 24px 20px;
	text-align: center;
	font-family: ${theme.fonts.Nunito};
	font-size: 13px;
	line-height: 1.4;
	color: rgba(255, 255, 255, 0.88);
`;

export const TodoErrorBanner = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin: 16px 20px 0;
	padding: 12px 16px;
	border-radius: 12px;
	background: #fff4f4;
	color: #8b2e2e;
	font-size: 14px;

	button {
		border: none;
		background: transparent;
		color: #1ebba3;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
	}
`;

export const TodoEmptyHint = styled.p`
	margin: 24px;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	line-height: 1.5;
	color: ${theme.colours.white};
	text-align: center;
`;

export { DashboardAside };
