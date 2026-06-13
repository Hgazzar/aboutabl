import styled from 'styled-components';
import { theme } from 'global-styles';

export const DatePickerInputWrapper = styled.div`
	label {
		display: flex;
		flex-direction: column;
		justify-content: center;
		border: 1px solid ${theme.colours.BrightGray};
		height: 72px;
		border-radius: 16px;
		box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		.mantine-Input-icon {
			width: 40px;
			height: 40px;
			border-right: 1px solid #f0eeed;
		}
		p {
			font-family: ${theme.fonts.Regular};
			font-weight: 400;
			font-size: 12px;
			color: ${theme.colours['Spanish Gray']};
			left: 55px;
			width: fit-content;
			top: 5px;
			span {
				color: ${theme.colours.error};
			}
		}
	}
	input {
		width: 100%;
		font-family: ${theme.fonts.Bold};
		font-size: 14px;
		font-weight: 500;
		color: rgb(0, 0, 0);
		border: none;
		outline: none;
		margin-bottom: 9px;
		&::placeholder {
			color: ${theme.colours.BrightGray};
		}
		&[data-with-icon] {
			padding-left: 55px;
		}
	}
	& > p {
		color: ${theme.colours.black};
		margin-top: 8px;
	}
	.mantine-DatePicker-calendarHeader {
		direction: ltr;
	}
	.mantine-DatePicker-month {
		direction: ltr;
	}
`;
