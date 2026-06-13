import { theme } from 'global-styles';
import styled from 'styled-components';

export const HeaderWrapper = styled.div`
	.courses_info {
		font-family: ${theme.fonts.Bold};
		h3 {
			font-weight: 700;
			color: ${theme.colours.EerieBlack};
		}
		span.count {
			width: 41px;
			height: 35px;
			border: 1px solid ${theme.colours.BrightGray};
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: ${theme.colours.Lotion};
			font-family: ${theme.fonts.Medium};
			font-weight: 500;
		}
	}
	.filter_container {
		font-family: ${theme.fonts.Medium};
		p {
			font-weight: 500;
			font-size: 13px;
		}
	}
	div[aria-haspopup='menu'] {
		height: 32px;
		padding: 12px 16px;
		cursor: pointer;
		background-color: ${theme.colours.Sunglow};
		color: ${theme.colours.EerieBlack};
		font-weight: 400;
		font-size: 13px;
		border-radius: 12px;
		box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
		-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
		-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
		h4 {
			line-height: 43px;
			margin-bottom: 4px;
		}
	}
	.mantine-Menu-dropdown {
		font-family: ${theme.fonts.Regular};
		font-weight: 400;
		border-radius: 17px;
		padding: 0;
		.mantine-Text-root {
			background-color: ${theme.colours.BrightGray};
			color: ${theme.colours['Grey-body']};
			padding: 9px 24px;
			border-top-right-radius: 16px;
			border-top-left-radius: 16px;
			font-weight: 400;
			font-size: 12px;
		}
		button {
			padding: 10px 12px;
			font-size: 14px;
			font-weight: 500;
			color: ${theme.colours['Grey-body']};
		}
	}
`;
