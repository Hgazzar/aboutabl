import { theme } from 'global-styles';
import styled from 'styled-components';

export const ModuleViewWrapper = styled.div`
	margin-top: 11px;
	height: 88vh;
	width: 100%;
	display: inline-block;
	display: flex;
	flex-direction: column;
	margin: 40px;
`;

export const ModuleHeaderWrapper = styled.div`
	width: 100%;
	background-color: ${theme.colours.BrightGray};
	border-top-right-radius: 20px;
	border-top-left-radius: 20px;
	height: 60px;
	line-height: 60px;
	padding: 0 32px;
	border-bottom: 1px solid #fcfcfc;
`;
export const ModuleViewBodyWrapper = styled.div`
	width: 100%;
	height: auto;
	padding: 32px;
	overflow: auto;
	background-color: ${theme.colours.white};
	border-bottom-right-radius: 20px;
	border-bottom-left-radius: 20px;

	&.no_header {
		min-height: calc(100% - 136px);
		padding: 0;
		border-top-right-radius: 20px;
		border-top-left-radius: 20px;
	}
`;
