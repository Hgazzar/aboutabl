import styled from 'styled-components';
import { theme } from 'global-styles';

export const InputWrapper = styled.div<{ islabelVisible: boolean }>`
	margin-bottom: ${theme.space_size};
	.mantine-PasswordInput-input {
		border: none;
		border-radius: 16px;

	}
	label {
		display: flex;
		flex-direction: column;
		justify-content: center;
		border: 1px solid ${theme.colours.BrightGray};
		height: 60px;
		border-radius: 16px;
		box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		.mantine-Input-icon {
			width: 40px;
			height: 20px;
			border-right: 1px solid #f0eeed;
		}
		p {
			font-family: ${theme.fonts.Regular};
			font-weight: 400;
			font-size: 12px;
			color: ${theme.colours['Spanish Gray']};
			visibility: ${(props) => (props.islabelVisible ? 'visible' : 'hidden')};
			left: 55px;
			width: fit-content;
			top: 5px;
			span {
				color: ${theme.colours.error};
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
			&:-webkit-autofill,
			:-webkit-autofill:focus {
				transition: background-color 0s 600000s, color 0s 600000s;
			}
			&:disabled,
			&:read-only {
				background-color: ${theme.colours.BrightGray};
				color: ${theme.colours.SpanishGray};
				opacity: 0.6;
				cursor: not-allowed;
			}
			&[data-with-icon] {
				padding-left: 55px;
				padding-right: 55px;
			}
		}
		&.disabled {
			background-color: ${theme.colours.BrightGray};
		}
		&:lang(ar) {
			direction: rtl;
			p{
				right: 55px;
				left: unset;
			}
		}
	}
	& > p {
		color: ${theme.colours.error};
		margin-top: 8px;
		font-size: 12px;
		font-family: ${theme.fonts.Medium};
	}
`;
